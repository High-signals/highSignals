import React, { useEffect, useState, useMemo } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Image,
	Modal,
	TextInput,
} from 'react-native'
import Skeleton from '@/components/Skeleton'
import Toast from 'react-native-toast-message'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

interface UserProfile {
	id: string
	email: string
	name: string
	avatar?: string
	bio?: string
}

export default function ProfileScreen() {
	const router = useRouter()
	const { isAuthenticated, logout } = useAuth()
	const { theme, toggleTheme, colors } = useTheme()
	const styles = useMemo(() => getStyles(colors), [colors])
	const [user, setUser] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	
	const [showFeedbackModal, setShowFeedbackModal] = useState(false)
	const [feedbackData, setFeedbackData] = useState({ name: '', email: '', feedback: '' })
	const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

	useEffect(() => {
		if (isAuthenticated) {
			fetchProfile()
			return
		}

		setLoading(false)
	}, [isAuthenticated])

	const fetchProfile = async () => {
		try {
			setLoading(true)
			const profileData = await api.profile.get()
			setUser(profileData)
		} catch (error) {
			console.error('Error fetching profile:', error)
		} finally {
			setLoading(false)
		}
	}

	const menuItems = [
		{
			icon: theme === 'light' ? 'moon-outline' : 'sunny-outline',
			title: theme === 'light' ? 'Dark Mode' : 'Light Mode',
			description: 'Toggle app theme',
			onPress: toggleTheme,
		},
		{
			icon: 'person-outline',
			title: 'Edit Profile',
			description: 'Update your personal information',
			onPress: () => router.push('/profile-new' as any),
		},
		{
			icon: 'bulb-outline',
			title: 'ICP Profile',
			description: 'Manage your Ideal Client Profile',
			onPress: () => router.push('/icp-profile' as any),
		},
		{
			icon: 'document-text-outline',
			title: 'View Content',
			description: 'Browse all your content and posts',
			onPress: () => router.push('/GetContent' as any),
		},
		{
			icon: 'chatbubble-ellipses-outline',
			title: 'Send Feedback',
			description: 'Share your thoughts or report issues',
			onPress: () => {
				setFeedbackData({ name: user?.name || '', email: user?.email || '', feedback: '' })
				setShowFeedbackModal(true)
			},
		},
	]

	const submitFeedback = async () => {
		if (!feedbackData.feedback.trim()) {
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Please enter some feedback.',
			})
			return
		}
		try {
			setIsSubmittingFeedback(true)
			await api.profile.submitFeedback(feedbackData)
			setShowFeedbackModal(false)
			Toast.show({
				type: 'success',
				text1: 'Success',
				text2: 'Thank you for your feedback!',
			})
		} catch (error: any) {
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: error.message || 'Failed to send feedback.',
			})
		} finally {
			setIsSubmittingFeedback(false)
		}
	}

		if (loading) {
		return (
			<View style={styles.container}>
				<View style={[styles.profileCard, { alignItems: 'center' }]}>
					<Skeleton style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 16 }} />
					<Skeleton style={{ width: 150, height: 24, marginBottom: 8 }} />
					<Skeleton style={{ width: 200, height: 16 }} />
				</View>
				<View style={{ paddingHorizontal: 20, marginTop: 24, gap: 16 }}>
					<Skeleton style={{ width: 120, height: 14 }} />
					{[1, 2, 3, 4].map(i => (
						<Skeleton key={i} style={{ width: '100%', height: 60, borderRadius: 12 }} />
					))}
				</View>
			</View>
		)
	}

	const initials =
		user?.name
			?.split(' ')
			.map((n: string) => n[0])
			.join('')
			.toUpperCase() || 'U'

	return (
		<View style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Header Profile Card */}
				<View style={styles.profileCard}>
					<View style={styles.profileImageContainer}>
						{user?.avatar ? (
							<Image
								source={{ uri: user.avatar }}
								style={styles.profileImage}
							/>
						) : (
							<View style={styles.profilePlaceholder}>
								<Text style={styles.initials}>{initials}</Text>
							</View>
						)}
					</View>
					<Text style={styles.userName}>{user?.name || 'User'}</Text>
					<Text style={styles.userEmail}>{user?.email}</Text>
					{user?.bio && (
						<Text style={styles.userBio}>{user.bio}</Text>
					)}
				</View>

				{/* Menu Items */}
				<View style={styles.menuSection}>
					<Text style={styles.sectionTitle}>Quick Access</Text>
					{menuItems.map((item, index) => (
						<TouchableOpacity
							key={index}
							style={styles.menuItem}
							onPress={item.onPress}
							activeOpacity={0.8}
						>
							<View style={styles.menuItemLeft}>
								<View style={styles.menuIcon}>
									<Ionicons
										name={item.icon as any}
										size={22}
										color={theme === 'dark' ? colors.gold : colors.textSecondary}
									/>
								</View>
								<View style={styles.menuItemText}>
									<Text style={styles.menuItemTitle}>
										{item.title}
									</Text>
									<Text style={styles.menuItemDescription}>
										{item.description}
									</Text>
								</View>
							</View>
							<Ionicons
								name='chevron-forward'
								size={18}
								color={colors.textSubtle}
							/>
						</TouchableOpacity>
					))}
				</View>

				{/* Account Section */}
				<View style={styles.accountSection}>
					<TouchableOpacity
						style={styles.logoutButton}
						onPress={async () => {
							await logout()
							router.replace('/signup-login')
						}}
						activeOpacity={0.8}
					>
						<Ionicons
							name='log-out-outline'
							size={20}
							color={colors.dangerText}
						/>
						<Text style={styles.logoutText}>Log Out</Text>
					</TouchableOpacity>
				</View>

				<View style={{ height: 40 }} />
			</ScrollView>

			<Modal
				visible={showFeedbackModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowFeedbackModal(false)}
			>
				<TouchableOpacity 
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setShowFeedbackModal(false)}
				>
					<TouchableOpacity activeOpacity={1} style={styles.modalContent}>
						<Text style={styles.modalTitle}>Send Feedback</Text>
						
						<Text style={styles.inputLabel}>Name</Text>
						<TextInput
							style={styles.inputField}
							value={feedbackData.name}
							onChangeText={(t) => setFeedbackData(prev => ({ ...prev, name: t }))}
							placeholder="Your Name"
							placeholderTextColor={colors.textSubtle}
						/>
						
						<Text style={styles.inputLabel}>Email</Text>
						<TextInput
							style={styles.inputField}
							value={feedbackData.email}
							onChangeText={(t) => setFeedbackData(prev => ({ ...prev, email: t }))}
							placeholder="Your Email"
							keyboardType="email-address"
							placeholderTextColor={colors.textSubtle}
						/>

						<Text style={styles.inputLabel}>Feedback</Text>
						<TextInput
							style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]}
							value={feedbackData.feedback}
							onChangeText={(t) => setFeedbackData(prev => ({ ...prev, feedback: t }))}
							placeholder="What's on your mind?"
							multiline
							placeholderTextColor={colors.textSubtle}
						/>

						<View style={styles.modalActions}>
							<TouchableOpacity 
								style={[styles.modalBtn, { backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.border }]}
								onPress={() => setShowFeedbackModal(false)}
							>
								<Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity 
								style={[styles.modalBtn, { backgroundColor: colors.navyLight }]}
								onPress={submitFeedback}
								disabled={isSubmittingFeedback}
							>
								{isSubmittingFeedback ? (
									<ActivityIndicator size="small" color={colors.white} />
								) : (
									<Text style={[styles.modalBtnText, { color: colors.white }]}>Submit</Text>
								)}
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
		</View>
	)
}

const getStyles = (colors: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	profileCard: {
		alignItems: 'center',
		padding: 24,
		marginTop: 16,
		marginBottom: 20,
		backgroundColor: colors.surfaceLight,
		borderRadius: 20,
		marginHorizontal: 20,
		borderWidth: 1.5,
		borderColor: colors.border,
	},
	profileImageContainer: {
		marginBottom: 14,
	},
	profileImage: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 2,
		borderColor: colors.navyLight,
	},
	profilePlaceholder: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: colors.primaryAction,
		justifyContent: 'center',
		alignItems: 'center',
	},
	initials: {
		fontSize: 28,
		fontWeight: '800',
		color: colors.primaryActionText,
	},
	userName: {
		fontSize: 20,
		fontWeight: '800',
		color: colors.text,
		marginBottom: 4,
	},
	userEmail: {
		fontSize: 13.5,
		color: colors.textSecondary,
		marginBottom: 6,
		fontWeight: '500',
	},
	userBio: {
		fontSize: 13,
		color: colors.textMuted,
		textAlign: 'center',
		marginTop: 6,
		lineHeight: 18,
	},
	menuSection: {
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '800',
		color: colors.text,
		marginBottom: 12,
		textTransform: 'uppercase',
		letterSpacing: 0.7,
	},
	menuItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 14,
		paddingHorizontal: 14,
		marginBottom: 10,
		backgroundColor: colors.surfaceLight,
		borderRadius: 16,
		borderWidth: 1.5,
		borderColor: colors.border,
	},
	menuItemLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		gap: 14,
	},
	menuIcon: {
		width: 42,
		height: 42,
		borderRadius: 12,
		backgroundColor: colors.surfaceCard,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.border,
	},
	menuItemText: {
		flex: 1,
	},
	menuItemTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 2,
	},
	menuItemDescription: {
		fontSize: 12,
		color: colors.textSecondary,
	},
	accountSection: {
		paddingHorizontal: 20,
		marginTop: 10,
	},
	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 14,
		borderRadius: 14,
		backgroundColor: colors.dangerBg,
		borderWidth: 1.5,
		borderColor: colors.dangerBorder,
	},
	logoutText: {
		fontSize: 15,
		fontWeight: '700',
		color: colors.dangerText,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	modalContent: {
		backgroundColor: colors.surfaceLight,
		borderRadius: 20,
		padding: 24,
		width: '100%',
		borderWidth: 1.5,
		borderColor: colors.border,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: colors.text,
		marginBottom: 18,
	},
	inputLabel: {
		fontSize: 13,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 6,
	},
	inputField: {
		backgroundColor: colors.surface,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		color: colors.text,
		borderWidth: 1.5,
		borderColor: colors.border,
		marginBottom: 14,
		fontSize: 14,
	},
	modalActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 12,
		marginTop: 8,
	},
	modalBtn: {
		paddingHorizontal: 18,
		paddingVertical: 11,
		borderRadius: 10,
		minWidth: 84,
		alignItems: 'center',
	},
	modalBtnText: {
		fontWeight: '700',
		fontSize: 14,
	},
})
