import { useCallback, useEffect, useRef, useState } from 'react'
import { NativeModules, PermissionsAndroid, Platform } from 'react-native'
import { File, Paths, type FileHandle } from 'expo-file-system'
import AudioRecord from 'react-native-live-audio-stream'
import { api, getWsUrl } from '@/services/api'

// react-native-live-audio-stream is a NATIVE module: it only exists in a custom
// dev/EAS build, NOT in Expo Go. When absent, NativeModules.RNLiveAudioStream is
// null and AudioRecord.init(...) throws 'Cannot read property init of null',
// leaving the UI stuck on "connecting". Detect it up front to fail cleanly.
const AUDIO_NATIVE_AVAILABLE = !!NativeModules.RNLiveAudioStream

const BAR_COUNT = 32
const IDLE_LEVEL = 0.04

// LINEAR16 @ 16kHz mono — must match the backend RECOGNITION_CONFIG.
const SAMPLE_RATE = 16000
const AUDIO_OPTIONS = {
	sampleRate: SAMPLE_RATE,
	channels: 1,
	bitsPerSample: 16,
	audioSource: 6, // Android VOICE_RECOGNITION
	bufferSize: 4096,
	wavFile: 'voice-tmp.wav', // required by the lib; we persist raw PCM ourselves
}

export type VoiceStatus =
	| 'idle'
	| 'connecting'
	| 'recording'
	| 'reconnecting'
	| 'transcribing' // re-streaming a saved file (retry) — drives the progress bar
	| 'error'

type Options = {
	/** Live (interim) transcript — rendered as a grey caret span in the editor. */
	onLiveTranscript: (text: string) => void
	/** Stabilized phrase — committed permanently into the editor. */
	onFinalText: (text: string) => void
	/**
	 * Fired once when a dictation session begins (live start OR retry), before
	 * any text is committed. Lets the editor decide to start on a new line.
	 */
	onSessionStart?: () => void
}

// Decode a base64 string into raw bytes without relying on Buffer/atob.
const B64 =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function base64ToBytes(b64: string): Uint8Array {
	const clean = b64.replace(/=+$/, '')
	const out = new Uint8Array(Math.floor((clean.length * 3) / 4))
	let bits = 0
	let acc = 0
	let o = 0
	for (let i = 0; i < clean.length; i++) {
		const v = B64.indexOf(clean[i])
		if (v < 0) continue
		acc = (acc << 6) | v
		bits += 6
		if (bits >= 8) {
			bits -= 8
			out[o++] = (acc >> bits) & 0xff
		}
	}
	return out.subarray(0, o)
}

// Encode raw bytes to base64 (mirror of base64ToBytes) so the retry path can
// re-send a cached PCM file over the same text-frame protocol the live path uses.
function bytesToBase64(bytes: Uint8Array): string {
	let out = ''
	let i = 0
	for (; i + 2 < bytes.length; i += 3) {
		const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
		out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63]
	}
	const rem = bytes.length - i
	if (rem === 1) {
		const n = bytes[i] << 16
		out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + '=='
	} else if (rem === 2) {
		const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
		out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + '='
	}
	return out
}

// --- Retry-streaming pacing -------------------------------------------------
// Google's streamingRecognize expects audio at roughly real-time. When we
// re-stream a saved file we can push FASTER than real-time, but not instantly
// (a huge burst is rejected with "audio being sent too fast"). We send one
// RETRY_CHUNK_BYTES slice every RETRY_CHUNK_INTERVAL_MS. LINEAR16@16kHz mono =
// 32000 bytes/sec, so 16000 bytes = 0.5s of audio; sending that every 100ms
// feeds ~5x real-time — a 5-min clip transcribes in ~1 min. Tune if Google
// complains: lower the byte size or raise the interval to slow down.
const RETRY_CHUNK_BYTES = 16000
const RETRY_CHUNK_INTERVAL_MS = 100

// Root-mean-square amplitude of a PCM16 chunk, normalized to 0..1 for the meter.
function chunkLevel(bytes: Uint8Array): number {
	const n = Math.floor(bytes.length / 2)
	if (!n) return IDLE_LEVEL
	let sumSq = 0
	for (let i = 0; i < n; i++) {
		let s = bytes[i * 2] | (bytes[i * 2 + 1] << 8)
		if (s >= 0x8000) s -= 0x10000
		const f = s / 32768
		sumSq += f * f
	}
	const rms = Math.sqrt(sumSq / n)
	return Math.max(IDLE_LEVEL, Math.min(1, rms * 4))
}

export function useVoiceTranscription({
	onLiveTranscript,
	onFinalText,
	onSessionStart,
}: Options) {
	const [status, setStatus] = useState<VoiceStatus>('idle')
	const [levels, setLevels] = useState<number[]>(() =>
		new Array(BAR_COUNT).fill(IDLE_LEVEL),
	)
	const [hasRecording, setHasRecording] = useState(false)
	const [isBusy, setIsBusy] = useState(false) // retry in flight
	const [progress, setProgress] = useState(0) // retry re-stream progress 0..1

	const wsRef = useRef<WebSocket | null>(null)
	const handleRef = useRef<FileHandle | null>(null)
	const fileRef = useRef<File | null>(null)
	const recordingRef = useRef(false)
	const dataSubRef = useRef<{ remove: () => void } | null>(null)
	// Set true while a retry re-stream is in flight so the ws.onclose handler
	// doesn't misread the intentional close as a dropped connection.
	const retryingRef = useRef(false)

	// Keep latest callbacks without re-subscribing.
	const liveRef = useRef(onLiveTranscript)
	const finalRef = useRef(onFinalText)
	const sessionStartRef = useRef(onSessionStart)
	useEffect(() => {
		liveRef.current = onLiveTranscript
		finalRef.current = onFinalText
		sessionStartRef.current = onSessionStart
	}, [onLiveTranscript, onFinalText, onSessionStart])

	const closeFile = useCallback(() => {
		try {
			handleRef.current?.close()
		} catch {}
		handleRef.current = null
	}, [])

	const requestMicPermission = useCallback(async () => {
		if (Platform.OS !== 'android') return true
		try {
			const granted = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
				{
					title: 'Microphone access',
					message: 'highSignals needs your mic to transcribe your idea.',
					buttonPositive: 'Allow',
				},
			)
			return granted === PermissionsAndroid.RESULTS.GRANTED
		} catch {
			return false
		}
	}, [])

	// Open (or reuse) a fresh raw-PCM temp file for this recording session.
	const openFreshFile = useCallback(() => {
		closeFile()
		const file = new File(Paths.document, `voice-${Date.now()}.pcm`)
		try {
			file.create({ overwrite: true })
		} catch {}
		fileRef.current = file
		handleRef.current = file.open()
		return file
	}, [closeFile])

	const openSocket = useCallback(() => {
		const token = api.getToken()
		let opened = false
		const ws = new WebSocket(`${getWsUrl()}?token=${encodeURIComponent(token)}`)
		wsRef.current = ws

		ws.onopen = () => {
			opened = true
		}
		ws.onmessage = (evt) => {
			try {
				const msg = JSON.parse(evt.data as string)
				if (msg.type === 'partial') {
					liveRef.current(msg.transcript)
				} else if (msg.type === 'final') {
					finalRef.current(msg.transcript)
				} else if (msg.type === 'error') {
					// Server can't transcribe live (e.g. not configured). Recording
					// still lands in the local file, so the Retry path can recover it.
					setStatus('error')
				}
			} catch {}
		}
		ws.onerror = () => {
			// Recording continues to the local file; user can Retry.
			setStatus((s) => (recordingRef.current ? 'reconnecting' : 'error'))
		}
		ws.onclose = () => {
			// Never opened → rejected at the handshake (bad token / host down).
			// Opened then dropped mid-recording → recoverable, offer Retry.
			if (!opened) {
				setStatus((s) => (s === 'idle' ? s : 'error'))
			} else {
				setStatus((s) => (recordingRef.current ? 'reconnecting' : s))
			}
		}
		return ws
	}, [])

	const handleChunk = useCallback((b64: string) => {
		const bytes = base64ToBytes(b64)

		// 1) Persist raw PCM to the temp file (for retry / draft).
		try {
			handleRef.current?.writeBytes(bytes)
		} catch {}

		// 2) Stream to the backend if the socket is open.
		const ws = wsRef.current
		if (ws && ws.readyState === WebSocket.OPEN) {
			try {
				ws.send(b64)
			} catch {}
		}

		// 3) Update the waveform meter.
		const lvl = chunkLevel(bytes)
		setLevels((prev) => [...prev.slice(1), lvl])
	}, [])

	const start = useCallback(async () => {
		if (recordingRef.current) return

		// Guard: no native audio module (e.g. running in Expo Go) — bail with a
		// clean error instead of crashing on AudioRecord.init.
		if (!AUDIO_NATIVE_AVAILABLE) {
			setStatus('error')
			return
		}

		setStatus('connecting')

		const ok = await requestMicPermission()
		if (!ok) {
			setStatus('error')
			return
		}

		// New dictation session — let the editor start committed text on a fresh
		// line if it already holds content.
		sessionStartRef.current?.()

		openFreshFile()
		setHasRecording(true)
		openSocket()

		AudioRecord.init(AUDIO_OPTIONS as any)
		dataSubRef.current?.remove()
		// The lib's types declare `on` as void, but it returns an EmitterSubscription.
		dataSubRef.current = AudioRecord.on(
			'data',
			handleChunk,
		) as unknown as { remove: () => void }
		AudioRecord.start()
		recordingRef.current = true
		setStatus('recording')
	}, [handleChunk, openFreshFile, openSocket, requestMicPermission])

	const stopCapture = useCallback(async () => {
		if (!recordingRef.current) return
		recordingRef.current = false
		try {
			await AudioRecord.stop()
		} catch {}
		dataSubRef.current?.remove()
		dataSubRef.current = null
		closeFile()
	}, [closeFile])

	// User tapped Stop/Done: end mic + let Google flush the final transcript,
	// then close the socket shortly after.
	const stop = useCallback(async () => {
		await stopCapture()
		const ws = wsRef.current
		if (ws && ws.readyState === WebSocket.OPEN) {
			setTimeout(() => {
				try {
					ws.close(1000)
				} catch {}
			}, 800)
		}
		setStatus('idle')
	}, [stopCapture])

	// Discard everything — used by the cancel guard.
	const cancel = useCallback(async () => {
		await stopCapture()
		try {
			wsRef.current?.close(1000)
		} catch {}
		wsRef.current = null
		try {
			fileRef.current?.delete()
		} catch {}
		fileRef.current = null
		setHasRecording(false)
		setLevels(new Array(BAR_COUNT).fill(IDLE_LEVEL))
		setProgress(0)
		setStatus('idle')
	}, [stopCapture])

	// Re-stream a recorded PCM file to the backend over the SAME realtime
	// WebSocket the live mic uses — no batch endpoint, no cloud storage. We read
	// the cached file in paced chunks (see RETRY_* constants) and feed them to
	// Google's streaming recognizer, committing partial/final text as it comes
	// back and driving a real 0..1 progress bar from bytesSent / totalBytes.
	// Defaults to the file recorded in this session; `overrideUri` powers the
	// draft-resume flow (a file saved in a previous app session).
	const retry = useCallback(
		async (overrideUri?: string) => {
			const uri = overrideUri || fileRef.current?.uri
			if (!uri) {
				setStatus('error')
				return
			}

			let file: File
			let handle: FileHandle
			try {
				file = new File(uri)
				handle = file.open()
			} catch {
				setStatus('error')
				return
			}

			const total = file.size || 0
			if (!total) {
				try {
					handle.close()
				} catch {}
				setStatus('error')
				return
			}

			// New dictation session — same new-line rule as a live start.
			sessionStartRef.current?.()

			setIsBusy(true)
			setProgress(0)
			setStatus('transcribing')
			retryingRef.current = true

			const token = api.getToken()
			const ws = new WebSocket(
				`${getWsUrl()}?token=${encodeURIComponent(token)}`,
			)
			wsRef.current = ws

			// Resolve once the whole flow is done (all audio sent + finals flushed
			// + socket closed) or on any terminal error.
			await new Promise<void>((resolve) => {
				let settled = false
				let pacer: ReturnType<typeof setInterval> | null = null
				let flushTimer: ReturnType<typeof setTimeout> | null = null

				const cleanup = (ok: boolean) => {
					if (settled) return
					settled = true
					if (pacer) clearInterval(pacer)
					if (flushTimer) clearTimeout(flushTimer)
					try {
						handle.close()
					} catch {}
					try {
						ws.close(1000)
					} catch {}
					retryingRef.current = false
					setIsBusy(false)
					setProgress(ok ? 1 : 0)
					setStatus(ok ? 'idle' : 'error')
					resolve()
				}

				// Push the next slice of the file; stops the pacer at EOF and gives
				// Google a moment to emit any trailing final before we close.
				const pump = () => {
					let bytes: Uint8Array
					try {
						bytes = handle.readBytes(RETRY_CHUNK_BYTES)
					} catch {
						cleanup(false)
						return
					}
					if (!bytes || bytes.length === 0) {
						if (pacer) clearInterval(pacer)
						pacer = null
						// All audio sent — wait briefly for the last finals, then done.
						flushTimer = setTimeout(() => cleanup(true), 1500)
						return
					}
					try {
						ws.send(bytesToBase64(bytes))
					} catch {
						cleanup(false)
						return
					}
					setProgress(Math.min(1, (handle.offset ?? 0) / total))
				}

				ws.onopen = () => {
					// Wait for the server's { type: 'ready' } before streaming so the
					// Google stream is live and nothing is dropped.
				}
				ws.onmessage = (evt) => {
					try {
						const msg = JSON.parse(evt.data as string)
						if (msg.type === 'ready') {
							if (pacer) return
							pacer = setInterval(pump, RETRY_CHUNK_INTERVAL_MS)
						} else if (msg.type === 'partial') {
							liveRef.current(msg.transcript)
						} else if (msg.type === 'final') {
							finalRef.current(msg.transcript)
						} else if (msg.type === 'error') {
							cleanup(false)
						}
					} catch {}
				}
				ws.onerror = () => cleanup(false)
				ws.onclose = () => cleanup(settled ? true : false)
			})
		},
		[],
	)

	// Cleanup on unmount.
	useEffect(() => {
		return () => {
			recordingRef.current = false
			try {
				AudioRecord.stop()
			} catch {}
			dataSubRef.current?.remove()
			closeFile()
			try {
				wsRef.current?.close()
			} catch {}
		}
	}, [closeFile])

	return {
		status,
		levels,
		hasRecording,
		isBusy,
		/** Retry re-stream progress, 0..1 — drives the transcribing bar. */
		progress,
		/** False in Expo Go / any build missing the native audio module. */
		audioAvailable: AUDIO_NATIVE_AVAILABLE,
		start,
		stop,
		cancel,
		retry,
		/** URI of the file recorded this session (for draft persistence). */
		getFileUri: () => fileRef.current?.uri ?? null,
	}
}
