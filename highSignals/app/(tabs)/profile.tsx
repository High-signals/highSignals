import React, { useEffect, useState } from 'react'
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
import Toast from 'react-native-toast-message'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

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
			<View
				style={[
					styles.container,
					{ justifyContent: 'center', alignItems: 'center' },
				]}
			>
				<ActivityIndicator size='large' color='#d4af37' />
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
										color='#1D4A79'
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
								color='#8E9BAE'
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
							color='#DC2626'
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
							placeholderTextColor="#8E9BAE"
						/>
						
						<Text style={styles.inputLabel}>Email</Text>
						<TextInput
							style={styles.inputField}
							value={feedbackData.email}
							onChangeText={(t) => setFeedbackData(prev => ({ ...prev, email: t }))}
							placeholder="Your Email"
							keyboardType="email-address"
							placeholderTextColor="#8E9BAE"
						/>

						<Text style={styles.inputLabel}>Feedback</Text>
						<TextInput
							style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]}
							value={feedbackData.feedback}
							onChangeText={(t) => setFeedbackData(prev => ({ ...prev, feedback: t }))}
							placeholder="What's on your mind?"
							multiline
							placeholderTextColor="#8E9BAE"
						/>

						<View style={styles.modalActions}>
							<TouchableOpacity 
								style={[styles.modalBtn, { backgroundColor: '#F5EFE6', borderWidth: 1, borderColor: '#EADBCE' }]}
								onPress={() => setShowFeedbackModal(false)}
							>
								<Text style={[styles.modalBtnText, { color: '#163354' }]}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity 
								style={[styles.modalBtn, { backgroundColor: '#1D4A79' }]}
								onPress={submitFeedback}
								disabled={isSubmittingFeedback}
							>
								{isSubmittingFeedback ? (
									<ActivityIndicator size="small" color="#FFFFFF" />
								) : (
									<Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Submit</Text>
								)}
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBF9F5',
	},
	profileCard: {
		alignItems: 'center',
		padding: 24,
		marginTop: 16,
		marginBottom: 20,
		backgroundColor: '#FAF7F2',
		borderRadius: 20,
		marginHorizontal: 20,
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	profileImageContainer: {
		marginBottom: 14,
	},
	profileImage: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 2,
		borderColor: '#1D4A79',
	},
	profilePlaceholder: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#1D4A79',
		justifyContent: 'center',
		alignItems: 'center',
	},
	initials: {
		fontSize: 28,
		fontWeight: '800',
		color: '#FFFFFF',
	},
	userName: {
		fontSize: 20,
		fontWeight: '800',
		color: '#163354',
		marginBottom: 4,
	},
	userEmail: {
		fontSize: 13.5,
		color: '#64748B',
		marginBottom: 6,
		fontWeight: '500',
	},
	userBio: {
		fontSize: 13,
		color: '#475569',
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
		color: '#163354',
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
		backgroundColor: '#FAF7F2',
		borderRadius: 16,
		borderWidth: 1.5,
		borderColor: '#EADBCE',
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
		backgroundColor: '#F5EFE6',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#EADBCE',
	},
	menuItemText: {
		flex: 1,
	},
	menuItemTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#163354',
		marginBottom: 2,
	},
	menuItemDescription: {
		fontSize: 12,
		color: '#64748B',
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
		backgroundColor: '#FDE8E8',
		borderWidth: 1.5,
		borderColor: '#FECACA',
	},
	logoutText: {
		fontSize: 15,
		fontWeight: '700',
		color: '#DC2626',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	modalContent: {
		backgroundColor: '#FAF7F2',
		borderRadius: 20,
		padding: 24,
		width: '100%',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#163354',
		marginBottom: 18,
	},
	inputLabel: {
		fontSize: 13,
		fontWeight: '700',
		color: '#163354',
		marginBottom: 6,
	},
	inputField: {
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		color: '#163354',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
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
