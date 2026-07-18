import React, { useCallback, useEffect, useState } from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Modal,
	Alert,
	ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
	interpolate,
	Easing,
} from 'react-native-reanimated'
import { useVoiceTranscription, type VoiceStatus } from './useVoiceTranscription'

const BRAND = '#d4af37'
const PANEL = '#0f0f0f'
const RECORDING_RED = '#ef4444'
// Diameter of the speaker icon puck that rides the progress bar's leading edge.
const ICON_TIP_SIZE = 22

type RecordingModalProps = {
	visible: boolean
	onClose: () => void
	/** Live (interim) transcript → editor renders it as a grey caret span. */
	onLiveTranscript: (text: string) => void
	/** Final phrase → committed permanently into the editor. */
	onFinalText: (text: string) => void
	/** Fired when a dictation session begins (live or retry) → new-line rule. */
	onSessionStart?: () => void
	/** A previously-recorded file to resume (draft flow); primes the Retry button. */
	resumeFilePath?: string | null
	/** Persist a device draft (unfinished idea) when the user keeps it on exit. */
	onDraftSave?: (fileUri: string) => void
	/** Clear the device draft once the idea is committed or discarded. */
	onDraftClear?: () => void
}

function statusLabel(status: VoiceStatus, hasRecording: boolean): string {
	switch (status) {
		case 'connecting':
			return 'Connecting…'
		case 'recording':
			return 'Listening…'
		case 'reconnecting':
			return 'Connection lost — tap Retry to transcribe'
		case 'transcribing':
			return 'Transcribing in progress…'
		case 'error':
			return 'Something went wrong — you can Retry'
		default:
			return hasRecording ? 'Recorded — tap Retry or Done' : 'Record your idea'
	}
}

export default function RecordingModal({
	visible,
	onClose,
	onLiveTranscript,
	onFinalText,
	onSessionStart,
	resumeFilePath,
	onDraftSave,
	onDraftClear,
}: RecordingModalProps) {
	const {
		status,
		levels,
		hasRecording,
		isBusy,
		progress,
		start,
		stop,
		cancel,
		retry,
		getFileUri,
	} = useVoiceTranscription({ onLiveTranscript, onFinalText, onSessionStart })

	const [committed, setCommitted] = useState(false)
	const pulse = useSharedValue(0.4)
	const listening = status === 'recording' || status === 'connecting'
	const transcribing = status === 'transcribing'

	// A resumed draft counts as an existing recording that can be retried.
	const canRetry = hasRecording || !!resumeFilePath

	// Pulse the mic glow while listening.
	useEffect(() => {
		if (!listening) return
		const interval = setInterval(() => {
			pulse.value = withTiming(
				1,
				{ duration: 500, easing: Easing.inOut(Easing.ease) },
				() => {
					pulse.value = withTiming(0.4, {
						duration: 500,
						easing: Easing.inOut(Easing.ease),
					})
				},
			)
		}, 1000)
		return () => clearInterval(interval)
	}, [listening])

	const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

	// Reset the committed flag each time the sheet opens.
	useEffect(() => {
		if (visible) setCommitted(false)
	}, [visible])

	const toggle = useCallback(() => {
		if (listening) stop()
		else start()
	}, [listening, start, stop])

	// Done: stop + let the final transcript land, mark committed, clear draft, close.
	const handleDone = useCallback(async () => {
		await stop()
		setCommitted(true)
		onDraftClear?.()
		onClose()
	}, [stop, onDraftClear, onClose])

	const handleRetry = useCallback(() => {
		retry(resumeFilePath ?? undefined)
	}, [retry, resumeFilePath])

	// Cancel guard: if there's an in-progress or uncommitted recording, confirm
	// before throwing the idea away.
	const requestClose = useCallback(() => {
		const active = listening || (canRetry && !committed)
		if (!active) {
			onClose()
			return
		}
		Alert.alert(
			'Cancel your recorded idea?',
			'Your recording will be lost if you leave now. You can keep it as a draft to finish later.',
			[
				{ text: 'Keep recording', style: 'cancel' },
				{
					text: 'Save draft',
					onPress: () => {
						const uri = getFileUri() || resumeFilePath || null
						if (uri) onDraftSave?.(uri)
						// Stop capture but keep the file for later.
						stop()
						onClose()
					},
				},
				{
					text: 'Discard',
					style: 'destructive',
					onPress: () => {
						cancel()
						onDraftClear?.()
						onClose()
					},
				},
			],
		)
	}, [
		listening,
		canRetry,
		committed,
		onClose,
		getFileUri,
		resumeFilePath,
		onDraftSave,
		stop,
		cancel,
		onDraftClear,
	])

	return (
		<Modal
			visible={visible}
			transparent
			animationType='slide'
			onRequestClose={requestClose}
		>
			<View style={styles.overlay}>
				<View style={styles.sheet}>
					<View style={styles.sheetHeader}>
						<View style={styles.grabber} />
						<TouchableOpacity
							onPress={requestClose}
							style={styles.closeBtn}
							hitSlop={10}
						>
							<Ionicons name='close' size={22} color='rgba(255,255,255,0.6)' />
						</TouchableOpacity>
					</View>

					<Text style={styles.title}>
						{listening ? 'Listening…' : 'Record your idea'}
					</Text>
					<Text style={styles.subtitle}>
						Your words appear in the script behind this sheet.
					</Text>

					{/* Waveform */}
					<View style={styles.waveform}>
						{levels.map((level, index) => (
							<WaveBar key={index} level={level} active={listening} />
						))}
					</View>

					{/* Status line (NOT the transcript — that goes into the editor) */}
					<Text
						numberOfLines={2}
						style={[
							styles.status,
							(status === 'error' || status === 'reconnecting') &&
								styles.statusError,
						]}
					>
						{statusLabel(status, hasRecording)}
					</Text>

					{/* Transcribing progress bar with a speaker icon riding the tip */}
					{transcribing && <TranscribeProgress progress={progress} />}

					{/* Mic button */}
					<TouchableOpacity
						onPress={toggle}
						activeOpacity={0.85}
						disabled={isBusy}
						style={[
							styles.micButton,
							listening && styles.micButtonActive,
							isBusy && styles.micButtonDisabled,
						]}
					>
						{listening ? (
							<Animated.View style={pulseStyle}>
								<Ionicons name='stop' size={30} color='#ffffff' />
							</Animated.View>
						) : (
							<Ionicons name='mic' size={30} color='#000000' />
						)}
					</TouchableOpacity>
					<Text style={styles.micHint}>
						{transcribing
							? 'Transcribing your recording…'
							: listening
								? 'Tap to stop'
								: 'Tap to start'}
					</Text>

					{/* Retry — visible when there's a recording that failed to stream */}
					{canRetry && !listening && !transcribing && (
						<TouchableOpacity
							onPress={handleRetry}
							style={styles.retryButton}
							activeOpacity={0.85}
							disabled={isBusy}
						>
							{isBusy ? (
								<ActivityIndicator color={BRAND} size='small' />
							) : (
								<>
									<Ionicons name='refresh' size={18} color={BRAND} />
									<Text style={styles.retryText}>Retry transcription</Text>
								</>
							)}
						</TouchableOpacity>
					)}

					{/* Done */}
					<TouchableOpacity
						onPress={handleDone}
						style={styles.doneButton}
						activeOpacity={0.85}
						disabled={isBusy}
					>
						<Text style={styles.doneText}>Done</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	)
}

// Horizontal progress bar with a speaker icon riding the tip. `progress` is
// 0..1; the fill and the icon animate smoothly toward it as chunks are sent.
function TranscribeProgress({ progress }: { progress: number }) {
	const [trackWidth, setTrackWidth] = useState(0)
	const clamped = Math.max(0, Math.min(1, progress))
	const anim = useSharedValue(clamped)

	useEffect(() => {
		anim.value = withTiming(clamped, { duration: 220, easing: Easing.out(Easing.ease) })
	}, [clamped])

	const fillStyle = useAnimatedStyle(() => ({
		width: `${anim.value * 100}%`,
	}))
	// Keep the icon centered on the fill's leading edge, clamped inside the track.
	const iconStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: interpolate(
					anim.value,
					[0, 1],
					[0, Math.max(0, trackWidth - ICON_TIP_SIZE)],
				),
			},
		],
	}))

	return (
		<View style={styles.progressWrap}>
			<View
				style={styles.progressTrack}
				onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
			>
				<Animated.View style={[styles.progressFill, fillStyle]} />
				<Animated.View style={[styles.progressTip, iconStyle]}>
					<Ionicons name='volume-high' size={13} color='#000000' />
				</Animated.View>
			</View>
			<Text style={styles.progressLabel}>{Math.round(clamped * 100)}%</Text>
		</View>
	)
}

function WaveBar({ level, active }: { level: number; active: boolean }) {
	const barHeight = useSharedValue(level)

	useEffect(() => {
		barHeight.value = withSpring(level, {
			damping: 12,
			stiffness: 180,
			mass: 0.5,
		})
	}, [level])

	const animStyle = useAnimatedStyle(() => ({
		height: interpolate(barHeight.value, [0, 1], [4, 40]),
	}))

	return (
		<Animated.View
			style={[
				styles.waveBar,
				animStyle,
				{ opacity: active ? 0.5 + level * 0.5 : 0.25 },
			]}
		/>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.55)',
		justifyContent: 'flex-end',
	},
	sheet: {
		backgroundColor: PANEL,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 24,
		paddingBottom: 32,
		paddingTop: 10,
		alignItems: 'center',
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(255,255,255,0.1)',
	},
	sheetHeader: {
		width: '100%',
		alignItems: 'center',
		marginBottom: 14,
		justifyContent: 'center',
	},
	grabber: {
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: 'rgba(255,255,255,0.2)',
	},
	closeBtn: {
		position: 'absolute',
		right: 0,
		top: -2,
		padding: 4,
	},
	title: {
		fontSize: 18,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 13,
		color: 'rgba(255,255,255,0.55)',
		textAlign: 'center',
		marginBottom: 20,
		paddingHorizontal: 8,
	},
	waveform: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 48,
		gap: 3,
		marginBottom: 14,
	},
	waveBar: {
		width: 3,
		borderRadius: 1.5,
		backgroundColor: BRAND,
	},
	status: {
		fontSize: 14,
		color: 'rgba(255,255,255,0.7)',
		textAlign: 'center',
		minHeight: 38,
		marginBottom: 6,
		paddingHorizontal: 8,
	},
	statusError: {
		color: RECORDING_RED,
	},
	progressWrap: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 10,
		paddingHorizontal: 4,
	},
	progressTrack: {
		flex: 1,
		height: ICON_TIP_SIZE,
		borderRadius: ICON_TIP_SIZE / 2,
		backgroundColor: 'rgba(255,255,255,0.08)',
		justifyContent: 'center',
		overflow: 'hidden',
	},
	progressFill: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		backgroundColor: BRAND,
		borderRadius: ICON_TIP_SIZE / 2,
	},
	progressTip: {
		position: 'absolute',
		left: 0,
		width: ICON_TIP_SIZE,
		height: ICON_TIP_SIZE,
		borderRadius: ICON_TIP_SIZE / 2,
		backgroundColor: BRAND,
		alignItems: 'center',
		justifyContent: 'center',
	},
	progressLabel: {
		width: 40,
		textAlign: 'right',
		color: 'rgba(255,255,255,0.7)',
		fontSize: 12,
		fontWeight: '700',
		fontVariant: ['tabular-nums'],
	},
	micButton: {
		width: 76,
		height: 76,
		borderRadius: 38,
		backgroundColor: BRAND,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8,
	},
	micButtonActive: {
		backgroundColor: RECORDING_RED,
	},
	micButtonDisabled: {
		opacity: 0.5,
	},
	micHint: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.5)',
		marginTop: 10,
	},
	retryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginTop: 18,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 12,
		borderWidth: 1.5,
		borderColor: BRAND,
		backgroundColor: 'rgba(212,175,55,0.08)',
		width: '100%',
	},
	retryText: {
		color: BRAND,
		fontWeight: '700',
		fontSize: 15,
	},
	doneButton: {
		marginTop: 14,
		paddingVertical: 12,
		paddingHorizontal: 40,
		borderRadius: 12,
		backgroundColor: 'rgba(255,255,255,0.08)',
		width: '100%',
		alignItems: 'center',
	},
	doneText: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 15,
	},
})
