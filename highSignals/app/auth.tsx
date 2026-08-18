import { useRouter } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import {
	Animated,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	ActivityIndicator,
	Alert,
} from 'react-native'
import { useAuth } from '@/context/AuthContext'
import { useFirebaseGoogleSignIn } from '@/hooks/useFirebaseGoogleSignIn'

export default function AuthScreen() {
	const router = useRouter()
	const { googleLogin } = useAuth()
	const { loading, signInWithGoogle } = useFirebaseGoogleSignIn()

	// Animation
	const fadeAnim = useRef(new Animated.Value(0)).current
	const slideAnim = useRef(new Animated.Value(30)).current

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 700,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 700,
				useNativeDriver: true,
			}),
		]).start()
	}, [])

	const handleGoogleSignIn = async () => {
		try {
			const idToken = await signInWithGoogle()
			if (!idToken) return

			await googleLogin(idToken)
			router.replace('/(tabs)/dashboard-new')
		} catch (error: any) {
			Alert.alert(
				'Error',
				error.message || 'Failed to sign in with Google',
			)
		}
	}

	const handleEmailSignUp = () => {
		router.push('/signup-login')
	}

	const handleLogIn = () => {
		router.push({
			pathname: '/signup-login',
			params: { tab: 'login' },
		})
	}

	return (
		<View style={styles.container}>
			<StatusBar barStyle='dark-content' backgroundColor='#FBF9F5' />

			<Animated.View
				style={[
					styles.inner,
					{
						opacity: fadeAnim,
						transform: [{ translateY: slideAnim }],
					},
				]}
			>
				{/* Score Gauge Section */}
				<View style={styles.gaugeSection}>
					<View style={styles.gaugeWrapper}>
						{/* Background track */}
						<View style={styles.gaugeTrack} />

						{/* Colored segments - red to green */}
						<View style={[styles.gaugeSegment, styles.gaugeRed]} />
						<View
							style={[styles.gaugeSegment, styles.gaugeOrange]}
						/>
						<View
							style={[styles.gaugeSegment, styles.gaugeYellow]}
						/>
						<View
							style={[styles.gaugeSegment, styles.gaugeGreen]}
						/>

						{/* Score in center */}
						<View style={styles.gaugeCenter}>
							<Text style={styles.gaugeLabel}>CONTENT SCORE</Text>
							<Text style={styles.gaugeScore}>98</Text>
						</View>
					</View>
				</View>

				{/* Headline */}
				<Text style={styles.headline}>
					Publish with{'\n'}
					<Text style={styles.headlineAccent}>Confidence.</Text>
				</Text>

				{/* Subtitle */}
				<Text style={styles.subtitle}>
					The only mobile AI that audits your content before you post.
				</Text>

				{/* Buttons */}
				<View style={styles.buttonsContainer}>
					{/* Continue with Google */}
					<TouchableOpacity
						style={[
							styles.googleButton,
							loading && styles.disabledButton,
						]}
						activeOpacity={0.85}
						onPress={handleGoogleSignIn}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color='#163354' size='small' />
						) : (
							<>
								<View style={styles.googleIcon}>
									<Text style={styles.googleIconText}>G</Text>
								</View>
								<Text style={styles.googleButtonText}>
									Continue with Google
								</Text>
							</>
						)}
					</TouchableOpacity>

					{/* Continue with Email */}
					<TouchableOpacity
						style={styles.emailButton}
						activeOpacity={0.85}
						onPress={handleEmailSignUp}
					>
						<Text style={styles.emailIcon}>✉</Text>
						<Text style={styles.emailButtonText}>
							Continue with Email
						</Text>
					</TouchableOpacity>
				</View>
			</Animated.View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBF9F5',
		justifyContent: 'center',
		paddingHorizontal: 28,
	},
	inner: {
		alignItems: 'center',
	},

	// Gauge section
	gaugeSection: {
		marginBottom: 28,
		alignItems: 'center',
	},
	gaugeWrapper: {
		width: 200,
		height: 110,
		alignItems: 'center',
		justifyContent: 'flex-end',
		position: 'relative',
	},
	gaugeTrack: {
		position: 'absolute',
		width: 200,
		height: 100,
		borderTopLeftRadius: 100,
		borderTopRightRadius: 100,
		borderWidth: 14,
		borderColor: '#EADBCE',
		borderBottomWidth: 0,
		top: 0,
	},
	gaugeSegment: {
		position: 'absolute',
		width: 200,
		height: 100,
		borderTopLeftRadius: 100,
		borderTopRightRadius: 100,
		borderWidth: 14,
		borderBottomWidth: 0,
		top: 0,
	},
	gaugeRed: {
		borderColor: '#FF4444',
		opacity: 0.9,
		transform: [{ rotate: '-90deg' }],
		width: 100,
		left: 0,
		borderTopRightRadius: 0,
		borderRightWidth: 0,
	},
	gaugeOrange: {
		borderColor: '#FF8C00',
		opacity: 0.9,
		width: 100,
		left: 0,
		borderTopRightRadius: 0,
		borderRightWidth: 0,
		transform: [{ rotate: '-45deg' }],
	},
	gaugeYellow: {
		borderColor: '#D4AF37',
		opacity: 0.9,
		width: 100,
		right: 0,
		borderTopLeftRadius: 0,
		borderLeftWidth: 0,
		transform: [{ rotate: '45deg' }],
	},
	gaugeGreen: {
		borderColor: '#059669',
		opacity: 0.9,
		width: 100,
		right: 0,
		borderTopLeftRadius: 0,
		borderLeftWidth: 0,
		transform: [{ rotate: '90deg' }],
	},
	gaugeCenter: {
		alignItems: 'center',
		paddingBottom: 4,
	},
	gaugeLabel: {
		color: '#8E9BAE',
		fontSize: 9,
		fontWeight: '700',
		letterSpacing: 1.5,
		marginBottom: 2,
	},
	gaugeScore: {
		color: '#163354',
		fontSize: 48,
		fontWeight: '800',
		lineHeight: 52,
	},

	// Text
	headline: {
		fontSize: 32,
		fontWeight: '800',
		color: '#163354',
		textAlign: 'center',
		lineHeight: 40,
		marginBottom: 12,
		letterSpacing: -0.5,
	},
	headlineAccent: {
		color: '#1D4A79',
	},
	subtitle: {
		fontSize: 14,
		color: '#64748B',
		textAlign: 'center',
		lineHeight: 21,
		marginBottom: 40,
		paddingHorizontal: 10,
	},

	// Buttons
	buttonsContainer: {
		width: '100%',
		gap: 12,
		marginBottom: 24,
	},
	googleButton: {
		backgroundColor: '#FFFFFF',
		paddingVertical: 15,
		borderRadius: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	googleIcon: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10,
	},
	googleIconText: {
		color: '#163354',
		fontSize: 13,
		fontWeight: '800',
	},
	googleButtonText: {
		color: '#163354',
		fontSize: 15,
		fontWeight: '700',
	},
	emailButton: {
		backgroundColor: '#1D4A79',
		paddingVertical: 15,
		borderRadius: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
	},
	emailIcon: {
		color: '#FFFFFF',
		fontSize: 15,
		marginRight: 10,
	},
	emailButtonText: {
		color: '#FFFFFF',
		fontSize: 15,
		fontWeight: '700',
	},
	disabledButton: {
		opacity: 0.6,
	},

	// Login link
	loginRow: {
		paddingVertical: 8,
	},
	loginText: {
		color: '#8E9BAE',
		fontSize: 14,
	},
	loginAccent: {
		color: '#1D4A79',
		fontWeight: '700',
	},
})
