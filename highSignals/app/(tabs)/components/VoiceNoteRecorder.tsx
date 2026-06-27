import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
	interpolate,
	Easing,
	type SharedValue,
} from 'react-native-reanimated'

const BRAND = '#d4af37'
const PANEL = '#0f0f0f'
const RECORDING_RED = '#ef4444'
const BAR_COUNT = 35
const METERING_INTERVAL = 100 // ms
const MIN_DB = -60
const MAX_DB = 0

// Normalize dB value to 0–1 range
function normalizeMetering(dB: number): number {
	const clamped = Math.max(MIN_DB, Math.min(MAX_DB, dB))
	return (clamped - MIN_DB) / (MAX_DB - MIN_DB)
}

// Format seconds to m:ss
function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${s.toString().padStart(2, '0')}`
}

type VoiceNoteRecorderProps = {
	onRecordingComplete: (uri: string, durationMs: number) => void
	onCancel: () => void
	onDelete: () => void
	voiceNoteUri: string | null
	voiceNoteDuration: number // ms
}

export default function VoiceNoteRecorder({
	onRecordingComplete,
	onCancel,
	onDelete,
	voiceNoteUri,
	voiceNoteDuration,
}: VoiceNoteRecorderProps) {
	// ── Recording state ──
	const [isRecording, setIsRecording] = useState(!voiceNoteUri)
	const recordingRef = useRef<Audio.Recording | null>(null)
	const [elapsedSec, setElapsedSec] = useState(0)
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const [meteringLevels, setMeteringLevels] = useState<number[]>(
		() => new Array(BAR_COUNT).fill(0.05),
	)
	const pulseAnim = useSharedValue(0.4)

	// ── Playback state ──
	const soundRef = useRef<Audio.Sound | null>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [playbackPosition, setPlaybackPosition] = useState(0)
	const playbackProgress = useSharedValue(0)

	// Store recorded levels for playback waveform
	const recordedLevelsRef = useRef<number[]>([])

	// ── Pulse animation for recording dot ──
	useEffect(() => {
		if (isRecording) {
			const interval = setInterval(() => {
				pulseAnim.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }, () => {
					pulseAnim.value = withTiming(0.4, { duration: 500, easing: Easing.inOut(Easing.ease) })
				})
			}, 1000)
			return () => clearInterval(interval)
		}
	}, [isRecording])

	const pulseStyle = useAnimatedStyle(() => ({
		opacity: pulseAnim.value,
	}))

	// ── Start recording on mount if no existing voice note ──
	useEffect(() => {
		if (!voiceNoteUri) {
			startRecording()
		}
		return () => {
			cleanup()
		}
	}, [])

	const cleanup = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
		if (recordingRef.current) {
			try {
				recordingRef.current.stopAndUnloadAsync().catch(() => {})
			} catch {}
			recordingRef.current = null
		}
		if (soundRef.current) {
			try {
				soundRef.current.unloadAsync().catch(() => {})
			} catch {}
			soundRef.current = null
		}
	}, [])

	const startRecording = useCallback(async () => {
		try {
			const permission = await Audio.requestPermissionsAsync()
			if (!permission.granted) {
				return
			}

			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			})

			const { recording } = await Audio.Recording.createAsync(
				{
					...Audio.RecordingOptionsPresets.HIGH_QUALITY,
					isMeteringEnabled: true,
				},
				(status) => {
					if (status.isRecording && status.metering !== undefined) {
						const normalized = normalizeMetering(status.metering)
						recordedLevelsRef.current.push(normalized)
						setMeteringLevels((prev) => {
							const next = [...prev.slice(1), normalized]
							return next
						})
					}
				},
				METERING_INTERVAL,
			)

			recordingRef.current = recording
			setIsRecording(true)
			setElapsedSec(0)
			recordedLevelsRef.current = []
			setMeteringLevels(new Array(BAR_COUNT).fill(0.05))

			// Timer
			const start = Date.now()
			timerRef.current = setInterval(() => {
				setElapsedSec(Math.floor((Date.now() - start) / 1000))
			}, 250)
		} catch (err) {
			console.warn('Failed to start recording', err)
		}
	}, [])

	const stopRecording = useCallback(async () => {
		if (!recordingRef.current) return

		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}

		try {
			await recordingRef.current.stopAndUnloadAsync()
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
			})

			const uri = recordingRef.current.getURI()
			const status = await recordingRef.current.getStatusAsync()
			recordingRef.current = null
			setIsRecording(false)

			if (uri) {
				onRecordingComplete(uri, status.durationMillis ?? 0)
			}
		} catch (err) {
			console.warn('Failed to stop recording', err)
		}
	}, [onRecordingComplete])

	const cancelRecording = useCallback(async () => {
		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}

		if (recordingRef.current) {
			try {
				await recordingRef.current.stopAndUnloadAsync()
			} catch {}
			recordingRef.current = null
		}

		setIsRecording(false)
		onCancel()
	}, [onCancel])

	// ── Playback ──
	const togglePlayback = useCallback(async () => {
		if (!voiceNoteUri) return

		if (isPlaying && soundRef.current) {
			await soundRef.current.pauseAsync()
			setIsPlaying(false)
			return
		}

		try {
			if (soundRef.current) {
				await soundRef.current.playAsync()
				setIsPlaying(true)
				return
			}

			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
				playsInSilentModeIOS: true,
			})

			const { sound } = await Audio.Sound.createAsync(
				{ uri: voiceNoteUri },
				{ shouldPlay: true },
				(status) => {
					if (status.isLoaded) {
						if (status.durationMillis && status.durationMillis > 0) {
							const progress = status.positionMillis / status.durationMillis
							playbackProgress.value = progress
							setPlaybackPosition(status.positionMillis)
						}
						if (status.didJustFinish) {
							setIsPlaying(false)
							setPlaybackPosition(0)
							playbackProgress.value = 0
							soundRef.current?.setPositionAsync(0)
						}
					}
				},
			)

			soundRef.current = sound
			setIsPlaying(true)
		} catch (err) {
			console.warn('Playback error', err)
		}
	}, [voiceNoteUri, isPlaying])

	const handleDelete = useCallback(async () => {
		if (soundRef.current) {
			try {
				await soundRef.current.unloadAsync()
			} catch {}
			soundRef.current = null
		}
		setIsPlaying(false)
		setPlaybackPosition(0)
		playbackProgress.value = 0
		onDelete()
	}, [onDelete])

	// ── Render: Recording Mode ──
	if (isRecording && !voiceNoteUri) {
		return (
			<View style={styles.recordingStrip}>
				{/* Cancel button */}
				<TouchableOpacity
					onPress={cancelRecording}
					style={styles.actionBtn}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<Ionicons name="trash-outline" size={22} color="#9ca3af" />
				</TouchableOpacity>

				{/* Recording indicator + timer */}
				<Animated.View style={[styles.recordingDot, pulseStyle]} />
				<Text style={styles.timerText}>{formatTime(elapsedSec)}</Text>

				{/* Waveform bars */}
				<View style={styles.waveformContainer}>
					{meteringLevels.map((level, index) => (
						<WaveformBar key={index} level={level} index={index} isRecording />
					))}
				</View>

				{/* Stop button */}
				<TouchableOpacity
					onPress={stopRecording}
					style={[styles.actionBtn, styles.stopBtn]}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<Ionicons name="checkmark" size={22} color="#000000" />
				</TouchableOpacity>
			</View>
		)
	}

	// ── Render: Playback Mode ──
	if (voiceNoteUri) {
		// Generate static waveform from recorded levels
		const playbackBars = generatePlaybackBars(
			recordedLevelsRef.current,
			BAR_COUNT,
		)

		return (
			<View style={styles.playbackStrip}>
				{/* Play / Pause */}
				<TouchableOpacity
					onPress={togglePlayback}
					style={[styles.actionBtn, styles.playBtn]}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<Ionicons
						name={isPlaying ? 'pause' : 'play'}
						size={20}
						color="#000000"
					/>
				</TouchableOpacity>

				{/* Waveform with progress overlay */}
				<View style={styles.playbackWaveformContainer}>
					{playbackBars.map((level, index) => (
						<PlaybackBar
							key={index}
							level={level}
							index={index}
							totalBars={BAR_COUNT}
							progress={playbackProgress}
						/>
					))}
				</View>

				{/* Duration */}
				<Text style={styles.durationText}>
					{isPlaying
						? formatTime(playbackPosition / 1000)
						: formatTime(voiceNoteDuration / 1000)}
				</Text>

				{/* Delete */}
				<TouchableOpacity
					onPress={handleDelete}
					style={styles.actionBtn}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<Ionicons name="close-circle" size={22} color="#9ca3af" />
				</TouchableOpacity>
			</View>
		)
	}

	return null
}

// ── Waveform Bar (Recording) ──
function WaveformBar({
	level,
	index,
	isRecording,
}: {
	level: number
	index: number
	isRecording: boolean
}) {
	const barHeight = useSharedValue(level)

	useEffect(() => {
		barHeight.value = withSpring(level, {
			damping: 12,
			stiffness: 180,
			mass: 0.5,
		})
	}, [level])

	const animStyle = useAnimatedStyle(() => {
		const height = interpolate(barHeight.value, [0, 1], [3, 28])
		return {
			height,
		}
	})

	return (
		<Animated.View
			style={[
				styles.waveformBar,
				animStyle,
				{
					opacity: 0.5 + level * 0.5,
				},
			]}
		/>
	)
}

// ── Waveform Bar (Playback) ──
function PlaybackBar({
	level,
	index,
	totalBars,
	progress,
}: {
	level: number
	index: number
	totalBars: number
	progress: SharedValue<number>
}) {
	const barFraction = (index + 1) / totalBars
	const height = interpolate(level, [0, 1], [3, 28])

	const animStyle = useAnimatedStyle(() => {
		const played = progress.value >= barFraction
		return {
			backgroundColor: played ? BRAND : 'rgba(212, 175, 55, 0.35)',
		}
	})

	return (
		<Animated.View
			style={[
				styles.waveformBar,
				{ height },
				animStyle,
			]}
		/>
	)
}

// ── Utility: Generate evenly-spaced bars from recorded levels ──
function generatePlaybackBars(
	recorded: number[],
	barCount: number,
): number[] {
	if (recorded.length === 0) {
		return new Array(barCount).fill(0.1)
	}

	const bars: number[] = []
	const chunkSize = Math.max(1, Math.floor(recorded.length / barCount))

	for (let i = 0; i < barCount; i++) {
		const start = Math.floor((i / barCount) * recorded.length)
		const end = Math.min(
			start + chunkSize,
			recorded.length,
		)
		let sum = 0
		let count = 0
		for (let j = start; j < end; j++) {
			sum += recorded[j]
			count++
		}
		bars.push(count > 0 ? sum / count : 0.1)
	}

	return bars
}

const styles = StyleSheet.create({
	// ── Recording Strip ──
	recordingStrip: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: PANEL,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(255,255,255,0.08)',
		gap: 8,
	},
	recordingDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: RECORDING_RED,
	},
	timerText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
		fontVariant: ['tabular-nums'],
		minWidth: 36,
	},
	waveformContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 32,
		gap: 2,
	},
	waveformBar: {
		width: 3,
		borderRadius: 1.5,
		backgroundColor: BRAND,
	},

	// ── Playback Strip ──
	playbackStrip: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(212, 175, 55, 0.08)',
		borderWidth: 1,
		borderColor: 'rgba(212, 175, 55, 0.2)',
		borderRadius: 16,
		marginHorizontal: 12,
		marginBottom: 8,
		paddingHorizontal: 10,
		paddingVertical: 8,
		gap: 8,
	},
	playbackWaveformContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 32,
		gap: 2,
	},
	durationText: {
		color: 'rgba(255,255,255,0.6)',
		fontSize: 12,
		fontWeight: '600',
		fontVariant: ['tabular-nums'],
		minWidth: 32,
		textAlign: 'right',
	},

	// ── Shared ──
	actionBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	stopBtn: {
		backgroundColor: BRAND,
	},
	playBtn: {
		backgroundColor: BRAND,
	},
})
