import { WebSocketServer } from 'ws'
import { verifyToken } from '../../shared/service/generateToken.js'
import {
	speechClient,
	RECOGNITION_CONFIG,
	GOOGLE_READY,
} from '../../config/google.js'

// Google caps a single streamingRecognize call at ~5 minutes. We proactively
// restart the underlying Google stream every STREAMING_LIMIT ms and keep the
// client WebSocket open across restarts, so dictation of any length works.
const STREAMING_LIMIT = 4 * 60 * 1000 // 4 minutes

/**
 * Attaches the realtime transcription protocol to a WebSocketServer.
 *
 * Wire protocol (server -> client), JSON text frames:
 *   { type: 'ready' }                          connection authed, mic can start
 *   { type: 'partial', transcript }            interim result (live)
 *   { type: 'final', transcript }              stabilized phrase
 *   { type: 'error', message }                 recoverable/terminal error
 *
 * Client -> server:
 *   binary frames  -> raw PCM16 audio (preferred)
 *   text frame with base64 payload -> decoded to PCM16
 */
export function attachTranscriptionWS(wss) {
	wss.on('connection', (ws) => {
		let googleStream = null
		let restartTimer = null
		let closed = false

		const safeSend = (obj) => {
			if (closed) return
			try {
				ws.send(JSON.stringify(obj))
			} catch {}
		}

		const startGoogleStream = () => {
			if (!GOOGLE_READY) return
			try {
				googleStream = speechClient
					.streamingRecognize({
						config: RECOGNITION_CONFIG,
						interimResults: true,
					})
					// Attach an error handler synchronously so a failed stream can
					// never bubble up as an uncaught exception / crash the process.
					.on('error', (err) => {
						console.warn('[transcribe] google stream error', err?.message)
						safeSend({
							type: 'error',
							message: 'Transcription stream error',
						})
					})
					.on('data', (data) => {
						const result = data.results?.[0]
						if (!result) return
						const transcript = result.alternatives?.[0]?.transcript ?? ''
						if (!transcript) return
						safeSend({
							type: result.isFinal ? 'final' : 'partial',
							transcript,
						})
					})
			} catch (err) {
				console.warn('[transcribe] failed to open google stream', err?.message)
				googleStream = null
				safeSend({ type: 'error', message: 'Transcription stream error' })
				return
			}

			// Schedule a transparent restart before Google's hard limit.
			restartTimer = setTimeout(() => {
				restartGoogleStream()
			}, STREAMING_LIMIT)
		}

		const restartGoogleStream = () => {
			if (closed) return
			try {
				googleStream?.end()
			} catch {}
			googleStream = null
			if (restartTimer) clearTimeout(restartTimer)
			startGoogleStream()
		}

		const writeAudio = (buffer) => {
			if (closed || !googleStream) return
			try {
				// The streamingRecognize helper wraps each written chunk in
				// { audioContent } for us (see @google-cloud/speech helpers.js),
				// so we must write the RAW buffer here — wrapping it ourselves
				// would double-nest it and Google would decode nothing.
				googleStream.write(buffer)
			} catch (err) {
				console.warn('[transcribe] failed to write audio', err?.message)
			}
		}

		if (GOOGLE_READY) {
			startGoogleStream()
			safeSend({ type: 'ready' })
		} else {
			// Not configured — let the client fall back to the Retry/batch path
			// instead of hanging while nothing transcribes.
			safeSend({
				type: 'error',
				message: 'Transcription service is not configured',
			})
		}

		ws.on('message', (message, isBinary) => {
			if (isBinary) {
				writeAudio(message)
				return
			}
			// Text frame: either a base64 audio chunk or a small JSON control msg.
			const text = message.toString()
			if (text.startsWith('{')) {
				// reserved for future control messages (e.g. { type: 'stop' })
				return
			}
			try {
				writeAudio(Buffer.from(text, 'base64'))
			} catch {}
		})

		const cleanup = () => {
			if (closed) return
			closed = true
			if (restartTimer) clearTimeout(restartTimer)
			try {
				googleStream?.end()
			} catch {}
			googleStream = null
		}

		ws.on('close', cleanup)
		ws.on('error', cleanup)
	})
}

/**
 * Creates a WebSocketServer bound (noServer) and hooks it to an http.Server's
 * upgrade event, only handling the /ws/transcribe path so it can coexist with
 * other upgrade handlers. Authentication happens during the HTTP upgrade so an
 * unauthorized client is rejected before the WebSocket handshake completes.
 */
export function registerTranscriptionWS(httpServer) {
	const wss = new WebSocketServer({ noServer: true })
	attachTranscriptionWS(wss)

	httpServer.on('upgrade', (req, socket, head) => {
		let url
		try {
			url = new URL(req.url, 'http://localhost')
		} catch {
			socket.destroy()
			return
		}

		if (url.pathname !== '/ws/transcribe') {
			socket.destroy()
			return
		}

		// Authenticate via ?token= (RN WebSocket can't set custom headers).
		let userId = null
		try {
			userId = verifyToken(url.searchParams.get('token'))?.id
		} catch {
			userId = null
		}
		if (!userId) {
			socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
			socket.destroy()
			return
		}

		wss.handleUpgrade(req, socket, head, (ws) => {
			ws.userId = userId
			wss.emit('connection', ws, req)
		})
	})

	return wss
}
