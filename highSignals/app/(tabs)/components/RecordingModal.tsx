import React, { useCallback, useEffect, useState } from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Modal,
	Alert,
	ActivityIndicator,
	ScrollView,
	PanResponder
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
import { useTheme } from '@/context/ThemeContext'

const RECORDING_RED = '#DC2626'
const ICON_TIP_SIZE = 22

type RecordingModalProps = {
	visible: boolean
	onClose: () => void
	onLiveTranscript: (text: string) => void
	onFinalText: (text: string) => void
	onSessionStart?: () => void
	resumeFilePath?: string | null
	onDraftSave?: (fileUri: string) => void
	onDraftClear?: () => void
}

function statusLabel(status: VoiceStatus, hasRecording: boolean, countdown: number | null): string {
	if (countdown !== null && countdown > 0) return `Speak in ${countdown}...`;
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
			return hasRecording ? 'Recorded — tap Retry or Insert' : 'Record your idea'
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
	const { colors } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);

	const [localText, setLocalText] = useState('')
	const [interimText, setInterimText] = useState('')

	const handleLiveTranscript = useCallback((text: string) => {
		setInterimText(text)
	}, [])

	const handleFinalText = useCallback((text: string) => {
		setLocalText((prev) => (prev ? prev + ' ' + text : text))
		setInterimText('')
	}, [])

	const {
		status,
		levels,
		hasRecording,
		isBusy,
		progress,
		audioAvailable,
		start,
		stop,
		cancel,
		retry,
		getFileUri,
	} = useVoiceTranscription({ 
		onLiveTranscript: handleLiveTranscript, 
		onFinalText: handleFinalText, 
		onSessionStart 
	})

	const displayFullText = localText + (localText && interimText ? ' ' : '') + interimText
	const [committed, setCommitted] = useState(false)
	const [countdown, setCountdown] = useState<number | null>(null)
	const pulse = useSharedValue(0.4)

	useEffect(() => {
		if (countdown === null) return
		if (countdown === 0) {
			setCountdown(null)
			return
		}
		const timer = setTimeout(() => {
			setCountdown(countdown - 1)
		}, 1000)
		return () => clearTimeout(timer)
	}, [countdown])

	const listening = status === 'recording' || status === 'connecting'
	const transcribing = status === 'transcribing'
	const canRetry = hasRecording || !!resumeFilePath

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

	useEffect(() => {
		if (visible) {
			setCommitted(false)
			setLocalText('')
			setInterimText('')
			setCountdown(null)
		}
	}, [visible])

	const toggle = useCallback(() => {
		if (listening) {
			stop()
			setCountdown(null)
		} else {
			setCountdown(3)
			start()
		}
	}, [listening, start, stop])

	const handleInsert = useCallback(async () => {
		await stop()
		const finalResult = localText + (localText && interimText ? ' ' : '') + interimText
		if (finalResult) {
			onFinalText(finalResult)
		}
		setCommitted(true)
		onDraftClear?.()
		onClose()
	}, [stop, localText, interimText, onFinalText, onDraftClear, onClose])

	const handleRetry = useCallback(() => {
		setLocalText('')
		setInterimText('')
		retry(resumeFilePath ?? undefined)
	}, [retry, resumeFilePath])

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

	const panResponder = React.useMemo(() => 
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderRelease: (e, gestureState) => {
				if (gestureState.dy > 50) {
					requestClose()
				}
			},
		}), [requestClose])

	return (
		<Modal
			visible={visible}
			transparent
			animationType='slide'
			onRequestClose={requestClose}
		>
			<View style={styles.overlay}>
				<View style={styles.sheet}>
					<View style={styles.sheetHeader} {...panResponder.panHandlers}>
						<View style={styles.grabber} />
						<TouchableOpacity
							onPress={requestClose}
							style={styles.closeBtn}
							hitSlop={10}
						>
							<Ionicons name='close' size={22} color={colors.textSubtle} />
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.transcriptArea} contentContainerStyle={{flexGrow: 1}}>
						<Text style={displayFullText ? styles.transcriptText : styles.transcriptPlaceholder}>
							{displayFullText || 'Start speaking to transcribe...'}
						</Text>
					</ScrollView>

					{!audioAvailable && (
						<Text style={[styles.status, styles.statusError]}>
							Voice recording needs the full app build (not Expo Go).
						</Text>
					)}
					{transcribing && <TranscribeProgress progress={progress} colors={colors} styles={styles} />}

					<View style={styles.recordingRow}>
						<View style={styles.waveformContainer}>
							<Text
								numberOfLines={2}
								style={[
									styles.status,
									(status === 'error' || status === 'reconnecting') && styles.statusError,
								]}
							>
								{statusLabel(status, hasRecording, countdown)}
							</Text>
							<View style={styles.waveform}>
								{levels.map((level, index) => (
									<WaveBar key={index} level={level} active={listening} colors={colors} styles={styles} />
								))}
							</View>
						</View>

						<TouchableOpacity
							onPress={toggle}
							activeOpacity={0.85}
							disabled={isBusy || !audioAvailable}
							style={[
								styles.miniMicButton,
								listening && styles.micButtonActive,
								(isBusy || !audioAvailable) && styles.micButtonDisabled,
							]}
						>
							{listening ? (
								<Animated.View style={pulseStyle}>
									<Ionicons name='stop' size={20} color='#ffffff' />
								</Animated.View>
							) : (
								<Ionicons name='mic' size={20} color='#ffffff' />
							)}
						</TouchableOpacity>
					</View>

					<View style={styles.actionsRow}>
						{canRetry && !listening && !transcribing && (
							<TouchableOpacity
								onPress={handleRetry}
								style={styles.retryButton}
								activeOpacity={0.85}
								disabled={isBusy}
							>
								{isBusy ? (
									<ActivityIndicator color={colors.navyLight} size='small' />
								) : (
									<>
										<Ionicons name='refresh' size={18} color={colors.navyLight} />
										<Text style={styles.retryText}>Retry transcription</Text>
									</>
								)}
							</TouchableOpacity>
						)}
						<TouchableOpacity
							onPress={handleInsert}
							style={[styles.doneButton, (!displayFullText || listening) && styles.buttonDisabled]}
							activeOpacity={0.85}
							disabled={!displayFullText || listening || isBusy}
						>
							<Text style={styles.doneText}>Insert</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	)
}

function TranscribeProgress({ progress, colors, styles }: { progress: number, colors: any, styles: any }) {
	const [trackWidth, setTrackWidth] = useState(0)
	const clamped = Math.max(0, Math.min(1, progress))
	const anim = useSharedValue(clamped)

	useEffect(() => {
		anim.value = withTiming(clamped, { duration: 220, easing: Easing.out(Easing.ease) })
	}, [clamped])

	const fillStyle = useAnimatedStyle(() => ({
		width: `${anim.value * 100}%`,
	}))
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
		<View style={styles.progressContainer}>
			<View
				style={styles.track}
				onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
			>
				<Animated.View style={[styles.fill, fillStyle]} />
				<Animated.View style={[styles.iconRider, iconStyle]}>
					<Ionicons name='volume-medium' size={ICON_TIP_SIZE} color={colors.navyLight} />
				</Animated.View>
			</View>
		</View>
	)
}

function WaveBar({ level, active, colors, styles }: { level: number; active: boolean; colors: any; styles: any }) {
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
				!active && { backgroundColor: colors.textSubtle },
			]}
		/>
	)
}

const getStyles = (colors: any) => StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'flex-end',
	},
	sheet: {
		backgroundColor: colors.surfaceCard,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 20,
		paddingBottom: 36,
		paddingTop: 12,
		borderTopWidth: 1.5,
		borderTopColor: colors.border,
	},
	sheetHeader: {
		width: '100%',
		alignItems: 'center',
		marginBottom: 14,
		justifyContent: 'center',
		paddingVertical: 8,
	},
	grabber: {
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: colors.border,
	},
	closeBtn: {
		position: 'absolute',
		right: 0,
		top: 4,
		padding: 4,
	},
	transcriptArea: {
		width: '100%',
		minHeight: 150,
		maxHeight: 250,
		backgroundColor: colors.background,
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: colors.border,
	},
	transcriptText: {
		fontSize: 16,
		color: colors.text,
		lineHeight: 24,
	},
	transcriptPlaceholder: {
		fontSize: 16,
		color: colors.textSubtle,
		lineHeight: 24,
		fontStyle: 'italic',
	},
	recordingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
		paddingHorizontal: 4,
	},
	waveformContainer: {
		flex: 1,
		marginRight: 16,
	},
	miniMicButton: {
		width: 54,
		height: 54,
		borderRadius: 27,
		backgroundColor: colors.navyLight,
		alignItems: 'center',
		justifyContent: 'center',
	},
	micButtonActive: {
		backgroundColor: RECORDING_RED,
	},
	micButtonDisabled: {
		opacity: 0.5,
	},
	status: {
		fontSize: 13,
		color: colors.navyLight,
		fontWeight: '600',
		marginBottom: 8,
	},
	statusError: {
		color: RECORDING_RED,
	},
	waveform: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		height: 36,
		gap: 3,
	},
	waveBar: {
		width: 3,
		backgroundColor: colors.navyLight,
		borderRadius: 1.5,
	},
	actionsRow: {
		flexDirection: 'row',
		width: '100%',
		gap: 12,
	},
	retryButton: {
		flex: 1,
		paddingVertical: 13,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.background,
		borderWidth: 1,
		borderColor: colors.navyLight,
		flexDirection: 'row',
		gap: 6,
	},
	retryText: {
		color: colors.navyLight,
		fontWeight: '700',
		fontSize: 15,
	},
	doneButton: {
		flex: 1,
		paddingVertical: 13,
		borderRadius: 12,
		alignItems: 'center',
		backgroundColor: colors.navyLight,
	},
	doneText: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 15,
	},
	buttonDisabled: {
		opacity: 0.5,
	},
	progressContainer: {
		width: '100%',
		marginBottom: 20,
	},
	track: {
		height: 4,
		backgroundColor: colors.border,
		borderRadius: 2,
		width: '100%',
		overflow: 'visible',
	},
	fill: {
		height: '100%',
		backgroundColor: colors.navyLight,
		borderRadius: 2,
	},
	iconRider: {
		position: 'absolute',
		top: -(ICON_TIP_SIZE / 2) + 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
