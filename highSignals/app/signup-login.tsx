import React, { useState } from 'react'
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	StatusBar,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { useFirebaseGoogleSignIn } from '@/hooks/useFirebaseGoogleSignIn'

export default function SignupLoginScreen() {
	const router = useRouter()
	const { login, register, googleLogin } = useAuth()
	const {
		loading: googleLoading,
		signInWithGoogle,
	} = useFirebaseGoogleSignIn()
	const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
	const [rememberMe, setRememberMe] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [loading, setLoading] = useState(false)

	// Form states
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [fullName, setFullName] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert('Error', 'Please fill in all fields')
			return
		}

		setLoading(true)
		try {
			await login(email, password)
			router.replace('/(tabs)/dashboard-new')
		} catch (error: any) {
			Alert.alert('Login Failed', error.message || 'Failed to login')
		} finally {
			setLoading(false)
		}
	}

	const handleRegister = async () => {
		if (!fullName || !email || !password || !confirmPassword) {
			Alert.alert('Error', 'Please fill in all fields')
			return
		}

		if (password !== confirmPassword) {
			Alert.alert('Error', 'Passwords do not match')
			return
		}

		setLoading(true)
		try {
			await register(email, password, fullName)
			router.replace('/onboarding-new')
		} catch (error: any) {
			Alert.alert(
				'Registration Failed',
				error.message || 'Failed to register',
			)
		} finally {
			setLoading(false)
		}
	}

	const handleGoogleAuth = async () => {
		try {
			const idToken = await signInWithGoogle()
			if (!idToken) return

			await googleLogin(idToken)
			router.replace('/(tabs)/dashboard-new')
		} catch (error: any) {
			Alert.alert(
				'Google Sign-In Failed',
				error.message || 'Failed to sign in with Google',
			)
		}
	}

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<StatusBar barStyle='dark-content' backgroundColor='#FBF9F5' />

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Header Section */}
				<View style={styles.header}>
					{/* Back Button */}
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => router.back()}
					>
						<Text style={styles.backArrow}>←</Text>
					</TouchableOpacity>

					{/* Headline */}
					<Text style={styles.headline}>
						Go ahead and set up{'\n'}your account
					</Text>
					<Text style={styles.subtitle}>
						Sign {activeTab === 'login' ? 'in' : 'up'} to enjoy the
						full experience
					</Text>
				</View>

				{/* Card */}
				<View style={styles.card}>
					{/* Tab Switcher */}
					<View style={styles.tabContainer}>
						<TouchableOpacity
							style={[
								styles.tab,
								activeTab === 'login' && styles.activeTab,
							]}
							onPress={() => setActiveTab('login')}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === 'login' &&
										styles.activeTabText,
								]}
							>
								Login
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.tab,
								activeTab === 'register' && styles.activeTab,
							]}
							onPress={() => setActiveTab('register')}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === 'register' &&
										styles.activeTabText,
								]}
							>
								Sign Up
							</Text>
						</TouchableOpacity>
					</View>

					{/* Login Form */}
					{activeTab === 'login' ? (
						<View style={styles.form}>
							{/* Email Input */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Email address</Text>
								<View style={styles.inputWrapper}>
									<Text style={styles.inputIcon}>✉️</Text>
									<TextInput
										style={styles.input}
										placeholder='name@example.com'
										placeholderTextColor='#8E9BAE'
										value={email}
										onChangeText={setEmail}
										keyboardType='email-address'
										autoCapitalize='none'
									/>
								</View>
							</View>

							{/* Password Input */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Password</Text>
								<View style={styles.inputWrapper}>
									<Text style={styles.inputIcon}>🔒</Text>
									<TextInput
										style={styles.input}
										placeholder='••••••••'
										placeholderTextColor='#8E9BAE'
										value={password}
										onChangeText={setPassword}
										secureTextEntry={!showPassword}
									/>
									<TouchableOpacity
										onPress={() =>
											setShowPassword(!showPassword)
										}
									>
										<Text style={styles.eyeIcon}>
											{showPassword ? '👁️' : '👁️‍🗨️'}
										</Text>
									</TouchableOpacity>
								</View>
							</View>

							{/* Remember Me & Forgot Password */}
							<View style={styles.row}>
								<TouchableOpacity
									style={styles.checkboxRow}
									onPress={() => setRememberMe(!rememberMe)}
								>
									<View style={styles.checkbox}>
										{rememberMe && (
											<View
												style={styles.checkboxChecked}
											/>
										)}
									</View>
									<Text style={styles.checkboxLabel}>
										Remember me
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									onPress={() =>
										router.push('/forgot-password')
									}
								>
									<Text style={styles.forgotPassword}>
										Forgot Password?
									</Text>
								</TouchableOpacity>
							</View>

							{/* Login Button */}
							<TouchableOpacity
								style={[
									styles.primaryButton,
									loading && styles.disabledButton,
								]}
								onPress={handleLogin}
								disabled={loading}
							>
								{loading ? (
									<ActivityIndicator color='#FFFFFF' />
								) : (
									<Text style={styles.primaryButtonText}>
										Login
									</Text>
								)}
							</TouchableOpacity>
						</View>
					) : (
						/* Register Form */
						<View style={styles.form}>
							{/* Full Name Input */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Full Name</Text>
								<View style={styles.inputWrapper}>
									<Text style={styles.inputIcon}>👤</Text>
									<TextInput
										style={styles.input}
										placeholder='John Doe'
										placeholderTextColor='#8E9BAE'
										value={fullName}
										onChangeText={setFullName}
									/>
								</View>
							</View>

							{/* Email Input */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Email address</Text>
								<View style={styles.inputWrapper}>
									<Text style={styles.inputIcon}>✉️</Text>
									<TextInput
										style={styles.input}
										placeholder='name@example.com'
										placeholderTextColor='#8E9BAE'
										value={email}
										onChangeText={setEmail}
										keyboardType='email-address'
										autoCapitalize='none'
									/>
								</View>
							</View>

							{/* Password Input */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Password</Text>
								<View style={styles.inputWrapper}>
									<Text style={styles.inputIcon}>🔒</Text>
									<TextInput
										style={styles.input}
										placeholder='••••••••'
										placeholderTextColor='#8E9BAE'
										value={password}
										onChangeText={setPassword}
										secureTextEntry={!showPassword}
									/>
									<TouchableOpacity
										onPress={() =>
											setShowPassword(!showPassword)
										}
									>
										<Text style={styles.eyeIcon}>
											{showPassword ? '👁️' : '👁️‍🗨️'}
										</Text>
									</TouchableOpacity>
								</View>
							</View>

							{/* Confirm Password Input */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>
									Confirm Password
								</Text>
								<View style={styles.inputWrapper}>
									<Text style={styles.inputIcon}>🔒</Text>
									<TextInput
										style={styles.input}
										placeholder='••••••••'
										placeholderTextColor='#8E9BAE'
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										secureTextEntry={!showPassword}
									/>
								</View>
							</View>

							{/* Register Button */}
							<TouchableOpacity
								style={[
									styles.primaryButton,
									loading && styles.disabledButton,
								]}
								onPress={handleRegister}
								disabled={loading}
							>
								{loading ? (
									<ActivityIndicator color='#FFFFFF' />
								) : (
									<Text style={styles.primaryButtonText}>
										Create Account
									</Text>
								)}
							</TouchableOpacity>
						</View>
					)}

					{/* Divider */}
					<View style={styles.dividerContainer}>
						<View style={styles.dividerLine} />
						<Text style={styles.dividerText}>
							Or {activeTab === 'login' ? 'login' : 'sign up'}{' '}
							with
						</Text>
						<View style={styles.dividerLine} />
					</View>

					{/* Social Login Buttons */}
					<View style={styles.socialButtons}>
						<TouchableOpacity
							style={styles.socialButton}
							onPress={handleGoogleAuth}
							disabled={googleLoading}
						>
							{googleLoading ? (
								<ActivityIndicator color='#163354' />
							) : (
								<>
									<View style={styles.googleIconCircle}>
										<Text style={styles.googleG}>G</Text>
									</View>
									<Text style={styles.socialButtonText}>
										Google
									</Text>
								</>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBF9F5',
	},
	scrollContent: {
		flexGrow: 1,
	},
	header: {
		paddingTop: 60,
		paddingHorizontal: 28,
		paddingBottom: 28,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		marginBottom: 16,
	},
	backArrow: {
		color: '#163354',
		fontSize: 26,
		fontWeight: '700',
	},
	headline: {
		fontSize: 28,
		fontWeight: '800',
		color: '#163354',
		lineHeight: 36,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		color: '#64748B',
		lineHeight: 20,
	},
	card: {
		flex: 1,
		backgroundColor: '#FAF7F2',
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		paddingTop: 26,
		paddingHorizontal: 24,
		paddingBottom: 40,
		borderTopWidth: 1.5,
		borderLeftWidth: 1.5,
		borderRightWidth: 1.5,
		borderColor: '#EADBCE',
	},
	tabContainer: {
		flexDirection: 'row',
		backgroundColor: '#F5EFE6',
		borderRadius: 14,
		padding: 4,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: '#EADBCE',
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderRadius: 10,
	},
	activeTab: {
		backgroundColor: '#FFFFFF',
		shadowColor: '#163354',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 2,
	},
	tabText: {
		fontSize: 14.5,
		fontWeight: '600',
		color: '#8E9BAE',
	},
	activeTabText: {
		color: '#163354',
		fontWeight: '800',
	},
	form: {
		marginBottom: 20,
	},
	inputGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 13,
		fontWeight: '700',
		color: '#163354',
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		paddingHorizontal: 14,
		height: 52,
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	inputIcon: {
		fontSize: 16,
		marginRight: 10,
	},
	input: {
		flex: 1,
		fontSize: 15,
		color: '#163354',
		fontWeight: '500',
	},
	eyeIcon: {
		fontSize: 18,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
	},
	checkboxRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 1.5,
		borderColor: '#CBD5E1',
		borderRadius: 6,
		marginRight: 8,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
	},
	checkboxChecked: {
		width: 12,
		height: 12,
		backgroundColor: '#1D4A79',
		borderRadius: 3,
	},
	checkboxLabel: {
		fontSize: 13.5,
		color: '#64748B',
		fontWeight: '500',
	},
	forgotPassword: {
		fontSize: 13.5,
		color: '#1D4A79',
		fontWeight: '700',
	},
	primaryButton: {
		backgroundColor: '#1D4A79',
		paddingVertical: 16,
		borderRadius: 14,
		alignItems: 'center',
		marginTop: 8,
	},
	primaryButtonText: {
		color: '#FFFFFF',
		fontSize: 15.5,
		fontWeight: '800',
	},
	disabledButton: {
		opacity: 0.6,
	},
	dividerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24,
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: '#EADBCE',
	},
	dividerText: {
		marginHorizontal: 12,
		fontSize: 13,
		color: '#8E9BAE',
		fontWeight: '500',
	},
	socialButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	socialButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFFFFF',
		paddingVertical: 14,
		borderRadius: 14,
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	googleIconCircle: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	googleG: {
		color: '#163354',
		fontSize: 14,
		fontWeight: '800',
	},
	socialButtonText: {
		fontSize: 14.5,
		color: '#163354',
		fontWeight: '700',
	},
})
