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
import { api } from '@/services/api'

type ForgotPasswordStep = 'email' | 'reset'

export default function ForgotPasswordScreen() {
	const router = useRouter()
	const [step, setStep] = useState<ForgotPasswordStep>('email')
	const [loading, setLoading] = useState(false)
	const [email, setEmail] = useState('')
	const [resetToken, setResetToken] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)

	const handleRequestReset = async () => {
		if (!email) {
			Alert.alert('Error', 'Please enter your email address')
			return
		}

		setLoading(true)
		try {
			const data = await api.call(
				'/api/auth/forgot-password',
				{
					method: 'POST',
					body: JSON.stringify({ email }),
				},
				false,
			)

			Alert.alert(
				'Success',
				'Password reset link has been sent to your email',
			)
			setStep('reset')
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to send reset link')
		} finally {
			setLoading(false)
		}
	}

	const handleResetPassword = async () => {
		if (!resetToken || !newPassword || !confirmPassword) {
			Alert.alert('Error', 'Please fill in all fields')
			return
		}

		if (newPassword !== confirmPassword) {
			Alert.alert('Error', 'Passwords do not match')
			return
		}

		if (newPassword.length < 8) {
			Alert.alert('Error', 'Password must be at least 8 characters long')
			return
		}

		setLoading(true)
		try {
			await api.call(
				'/api/auth/reset-password',
				{
					method: 'POST',
					body: JSON.stringify({
						resetToken,
						newPassword,
						confirmPassword,
					}),
				},
				false,
			)

			Alert.alert('Success', 'Password has been reset successfully')
			router.replace('/signup-login')
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to reset password')
		} finally {
			setLoading(false)
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
						{step === 'email' ? 'Forgot Password' : 'Reset Password'}
					</Text>
					<Text style={styles.subtitle}>
						{step === 'email'
							? 'Enter your email address and we will send you instructions to reset your password.'
							: 'Enter the reset code sent to your email and choose a new password.'}
					</Text>
				</View>

				{/* Card */}
				<View style={styles.card}>
					{step === 'email' ? (
						<View style={styles.form}>
							{/* Email Input */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Email Address</Text>
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

							{/* Submit Button */}
							<TouchableOpacity
								style={[
									styles.primaryButton,
									loading && styles.disabledButton,
								]}
								onPress={handleRequestReset}
								disabled={loading}
								activeOpacity={0.85}
							>
								{loading ? (
									<ActivityIndicator color='#FFFFFF' />
								) : (
									<Text style={styles.primaryButtonText}>
										Send Reset Link
									</Text>
								)}
							</TouchableOpacity>

							{/* Back to Login Button */}
							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={() => router.replace('/signup-login')}
								activeOpacity={0.85}
							>
								<Text style={styles.secondaryButtonText}>
									Back to Login
								</Text>
							</TouchableOpacity>
						</View>
					) : (
						<View style={styles.form}>
							{/* Reset Token Input */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Reset Code</Text>
								<View style={styles.inputWrapper}>
									<Text style={styles.inputIcon}>🔑</Text>
									<TextInput
										style={styles.input}
										placeholder='Enter the reset code'
										placeholderTextColor='#8E9BAE'
										value={resetToken}
										onChangeText={setResetToken}
										autoCapitalize='none'
									/>
								</View>
							</View>

							{/* New Password Input */}
							<View style={styles.inputGroup}>
								<Text style={styles.label}>New Password</Text>
								<View style={styles.inputWrapper}>
									<Text style={styles.inputIcon}>🔒</Text>
									<TextInput
										style={styles.input}
										placeholder='At least 8 characters'
										placeholderTextColor='#8E9BAE'
										value={newPassword}
										onChangeText={setNewPassword}
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
									Confirm New Password
								</Text>
								<View style={styles.inputWrapper}>
									<Text style={styles.inputIcon}>🔒</Text>
									<TextInput
										style={styles.input}
										placeholder='Confirm your password'
										placeholderTextColor='#8E9BAE'
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										secureTextEntry={!showPassword}
									/>
								</View>
							</View>

							{/* Requirements */}
							<View style={styles.requirements}>
								<Text style={styles.requirementsTitle}>
									Password Requirements:
								</Text>
								<Text style={styles.requirement}>
									• At least 8 characters long
								</Text>
								<Text style={styles.requirement}>
									• Must match the confirmation password
								</Text>
							</View>

							{/* Submit Button */}
							<TouchableOpacity
								style={[
									styles.primaryButton,
									loading && styles.disabledButton,
								]}
								onPress={handleResetPassword}
								disabled={loading}
								activeOpacity={0.85}
							>
								{loading ? (
									<ActivityIndicator color='#FFFFFF' />
								) : (
									<Text style={styles.primaryButtonText}>
										Reset Password
									</Text>
								)}
							</TouchableOpacity>

							{/* Back to Email Step */}
							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={() => setStep('email')}
								activeOpacity={0.85}
							>
								<Text style={styles.secondaryButtonText}>
									Back
								</Text>
							</TouchableOpacity>
						</View>
					)}
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
		paddingBottom: 40,
	},
	header: {
		backgroundColor: '#FBF9F5',
		paddingHorizontal: 24,
		paddingTop: 56,
		paddingBottom: 24,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: '#FAF7F2',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	backArrow: {
		fontSize: 22,
		color: '#163354',
		fontWeight: '700',
	},
	headline: {
		fontSize: 28,
		fontWeight: '800',
		color: '#163354',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		color: '#64748B',
		lineHeight: 20,
	},
	card: {
		backgroundColor: '#FAF7F2',
		marginHorizontal: 20,
		borderRadius: 20,
		padding: 24,
		marginBottom: 20,
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	form: {
		gap: 18,
	},
	inputGroup: {
		gap: 8,
	},
	label: {
		fontSize: 13.5,
		fontWeight: '700',
		color: '#163354',
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
		borderRadius: 12,
		paddingHorizontal: 14,
		backgroundColor: '#FFFFFF',
		height: 50,
	},
	inputIcon: {
		fontSize: 16,
		marginRight: 8,
	},
	input: {
		flex: 1,
		fontSize: 14.5,
		color: '#163354',
		fontWeight: '500',
	},
	eyeIcon: {
		fontSize: 18,
		marginLeft: 8,
	},
	primaryButton: {
		backgroundColor: '#1D4A79',
		paddingVertical: 15,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 8,
	},
	primaryButtonText: {
		color: '#FFFFFF',
		fontSize: 15.5,
		fontWeight: '800',
	},
	secondaryButton: {
		paddingVertical: 14,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
		backgroundColor: '#F5EFE6',
		marginTop: 4,
	},
	secondaryButtonText: {
		color: '#163354',
		fontSize: 15,
		fontWeight: '700',
	},
	disabledButton: {
		opacity: 0.6,
	},
	requirements: {
		backgroundColor: '#F5EFE6',
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#EADBCE',
		marginTop: 4,
	},
	requirementsTitle: {
		fontSize: 12.5,
		fontWeight: '700',
		color: '#163354',
		marginBottom: 6,
	},
	requirement: {
		fontSize: 12,
		color: '#64748B',
		marginBottom: 4,
	},
})
