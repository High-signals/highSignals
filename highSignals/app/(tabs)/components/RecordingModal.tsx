import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Modal,
	Platform,
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
import { speechErrorMessage } from './speechErrors'

const BRAND = '#d4af37'
const PANEL = '#0f0f0f'
const RECORDING_RED = '#ef4444'
const BAR_COUNT = 32

// Load the speech-recognition native module defensively. If the app binary
// was built before this dependency was added (or running in Expo Go), the
// native module is absent and `requireNativeModule` throws at import time.
let SpeechModule: any = null
try {
	SpeechModule = require('expo-speech-recognition').ExpoSpeechRecognitionModule
} catch {
	SpeechModule = null
}
const SPEECH_AVAILABLE = !!SpeechModule

// volumechange.value ranges roughly -2..10; treat <0 as silence and
// normalize the audible range to 0..1.
function normalizeVolume(v: number): number {
	if (v <= 0) return 0.04
	return Math.max(0.04, Math.min(1, v / 10))
}

type RecordingModalProps = {
	visible: boolean
	onClose: () => void
	/** Called with each finalized phrase. The screen appends this to the editor. */
	onFinalText: (text: string) => void
}

export default function RecordingModal({
	visible,
	onClose,
	onFinalText,
}: RecordingModalProps) {
	const [listening, setListening] = useState(false)
	const [interim, setInterim] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [levels, setLevels] = useState<number[]>(() =>
		new Array(BAR_COUNT).fill(0.04),
	)
	const pulse = useSharedValue(0.4)

	// Keep the latest callback without re-subscribing listeners on every render.
	const onFinalTextRef = useRef(onFinalText)
	useEffect(() => {
		onFinalTextRef.current = onFinalText
	}, [onFinalText])

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

	// Attach native event listeners while the modal is open.
	useEffect(() => {
		if (!visible || !SPEECH_AVAILABLE) return
		const subs = [
			SpeechModule.addListener('result', (e: any) => {
				const transcript = e.results?.[0]?.transcript ?? ''
				if (e.isFinal) {
					const trimmed = transcript.trim()
					if (trimmed) onFinalTextRef.current(trimmed)
					setInterim('')
				} else {
					setInterim(transcript)
				}
			}),
			SpeechModule.addListener('volumechange', (e: any) => {
				const norm = normalizeVolume(e?.value ?? 0)
				setLevels((prev) => [...prev.slice(1), norm])
			}),
			SpeechModule.addListener('end', () => {
				setListening(false)
				setInterim('')
			}),
			SpeechModule.addListener('error', (e: any) => {
				setError(speechErrorMessage(e.error))
				setListening(false)
				setInterim('')
			}),
		]
		return () => {
			subs.forEach((s) => {
				try {
					s?.remove()
				} catch {}
			})
		}
	}, [visible])

	// Stop recognition whenever the modal is dismissed.
	useEffect(() => {
		if (visible) return
		try {
			SpeechModule?.abort()
		} catch {}
		setListening(false)
		setInterim('')
		setError(null)
		setLevels(new Array(BAR_COUNT).fill(0.04))
	}, [visible])

	const start = useCallback(async () => {
		if (!SPEECH_AVAILABLE) {
			setError('Rebuild app to enable')
			return
		}
		setError(null)
		try {
			const perm = await SpeechModule.requestPermissionsAsync()
			if (!perm.granted) {
				setError('Mic permission needed')
				return
			}
			SpeechModule.start({
				lang: 'en-US',
				interimResults: true,
				continuous: true,
				addsPunctuation: true,
				requiresOnDeviceRecognition: Platform.OS === 'ios',
				volumeChangeEventOptions: {
					enabled: true,
					intervalMillis: 100,
				},
			})
			setListening(true)
		} catch (err) {
			console.warn('Failed to start dictation', err)
			setError('Dictation unavailable')
			setListening(false)
		}
	}, [])

	const stop = useCallback(() => {
		try {
			SpeechModule?.stop()
		} catch {}
		setListening(false)
	}, [])

	const toggle = useCallback(() => {
		if (listening) stop()
		else start()
	}, [listening, start, stop])

	const handleDone = useCallback(() => {
		stop()
		onClose()
	}, [stop, onClose])

	return (
		<Modal
			visible={visible}
			transparent
			animationType='slide'
			onRequestClose={handleDone}
		>
			<View style={styles.overlay}>
				<View style={styles.sheet}>
					{/* Grabber + close */}
					<View style={styles.sheetHeader}>
						<View style={styles.grabber} />
					</View>

					<Text style={styles.title}>
						{listening ? 'Listening…' : 'Record your idea'}
					</Text>
					<Text style={styles.subtitle}>
						{listening
							? 'Speak naturally — your words appear in the script behind this.'
							: 'Tap the mic and start speaking. We turn it into text.'}
					</Text>

					{/* Waveform */}
					<View style={styles.waveform}>
						{levels.map((level, index) => (
							<WaveBar
								key={index}
								level={level}
								active={listening}
							/>
						))}
					</View>

					{/* Interim transcript / error */}
					{(interim || error) && (
						<Text
							numberOfLines={2}
							style={[
								styles.interim,
								error && styles.interimError,
							]}
						>
							{error ?? interim}
						</Text>
					)}

					{/* Mic button */}
					<TouchableOpacity
						onPress={toggle}
						activeOpacity={0.85}
						style={[
							styles.micButton,
							listening && styles.micButtonActive,
						]}
					>
						{listening ? (
							<Animated.View style={pulseStyle}>
								<Ionicons
									name='stop'
									size={30}
									color='#ffffff'
								/>
							</Animated.View>
						) : (
							<Ionicons name='mic' size={30} color='#000000' />
						)}
					</TouchableOpacity>
					<Text style={styles.micHint}>
						{listening ? 'Tap to stop' : 'Tap to start'}
					</Text>

					{/* Done */}
					<TouchableOpacity
						onPress={handleDone}
						style={styles.doneButton}
						activeOpacity={0.85}
					>
						<Text style={styles.doneText}>Done</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
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
	},
	grabber: {
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: 'rgba(255,255,255,0.2)',
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
	interim: {
		fontSize: 14,
		color: 'rgba(255,255,255,0.85)',
		textAlign: 'center',
		minHeight: 38,
		marginBottom: 6,
		paddingHorizontal: 8,
	},
	interimError: {
		color: RECORDING_RED,
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
	micHint: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.5)',
		marginTop: 10,
	},
	doneButton: {
		marginTop: 22,
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
