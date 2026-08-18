import React, { useState } from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Switch,
	Animated,
	Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import CustomAlert from './components/CustomAlert'

export default function SettingsScreen() {
	const router = useRouter()
	const [notifications, setNotifications] = useState(true)
	const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' })
	const slideAnim = new Animated.Value(-300)

	const handleAction = (title: string, message: string) => {
		setAlertConfig({ visible: true, title, message })
	}

	const handleNavigate = (route?: string) => {
		if (!route) {
			handleAction('Coming Soon', 'This feature is not available yet')
			return
		}

		router.push(route as any)
	}

	React.useEffect(() => {
		Animated.spring(slideAnim, {
			toValue: 0,
			tension: 50,
			friction: 8,
			useNativeDriver: true,
		}).start()
	}, [])

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={styles.backButton}>{'⟵'}</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Settings</Text>
				<View style={{ width: 30 }} />
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Account Section */}
				<Animated.View
					style={[
						styles.section,
						{ transform: [{ translateX: slideAnim }] },
					]}
				>
					<Text style={styles.sectionTitle}>Account</Text>

					{/* Edit Profile */}
					<TouchableOpacity
						style={styles.menuItem}
						onPress={() => handleNavigate('/profile-new')}
					>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>👤</Text>
							<Text style={styles.menuText}>Edit Profile</Text>
						</View>
						<Text style={styles.menuArrow}>→</Text>
					</TouchableOpacity>

					{/* Edit ICP Profile */}
					<TouchableOpacity
						style={styles.menuItem}
						onPress={() => router.push('/icp-profile')}
					>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>📝</Text>
							<Text style={styles.menuText}>
								Edit ICP Profile
							</Text>
						</View>
						<Text style={styles.menuArrow}>→</Text>
					</TouchableOpacity>

					{/* Change Password - not ready yet */}
					<TouchableOpacity
						style={styles.menuItem}
						onPress={() => handleNavigate()} // no route passed
					>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>🔒</Text>
							<Text style={styles.menuText}>Change Password</Text>
						</View>
						<Text style={styles.menuArrow}>→</Text>
					</TouchableOpacity>

				</Animated.View>

				{/* Preferences */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Preferences</Text>

					<View style={styles.menuItem}>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>🔔</Text>
							<Text style={styles.menuText}>
								Push Notifications
							</Text>
						</View>
						<Switch
							value={notifications}
							onValueChange={setNotifications}
							trackColor={{ false: '#3e3e3e', true: '#00D9FF' }}
							thumbColor={notifications ? '#ffffff' : '#f4f3f4'}
						/>
					</View>

				</View>

				{/* Content */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Content</Text>

					<TouchableOpacity style={styles.menuItem}>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>🎯</Text>
							<Text style={styles.menuText}>Content Goals</Text>
						</View>
						<Text style={styles.menuArrow}>→</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.menuItem}>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>📱</Text>
							<Text style={styles.menuText}>
								Connected Platforms
							</Text>
						</View>
						<Text style={styles.menuArrow}>→</Text>
					</TouchableOpacity>
				</View>

				{/* Support */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Support</Text>

					<TouchableOpacity style={styles.menuItem}>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>❓</Text>
							<Text style={styles.menuText}>Help Center</Text>
						</View>
						<Text style={styles.menuArrow}>→</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.menuItem}>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>💬</Text>
							<Text style={styles.menuText}>Send Feedback</Text>
						</View>
						<Text style={styles.menuArrow}>→</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.menuItem}>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>📄</Text>
							<Text style={styles.menuText}>Privacy Policy</Text>
						</View>
						<Text style={styles.menuArrow}>→</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.menuItem}>
						<View style={styles.menuLeft}>
							<Text style={styles.menuIcon}>⚖️</Text>
							<Text style={styles.menuText}>
								Terms of Service
							</Text>
						</View>
						<Text style={styles.menuArrow}>→</Text>
					</TouchableOpacity>
				</View>

				{/* Premium */}
				<TouchableOpacity style={styles.premiumCard}>
					<View style={styles.premiumIcon}>
						<Text style={styles.premiumEmoji}>💎</Text>
					</View>
					<View style={styles.premiumContent}>
						<Text style={styles.premiumTitle}>
							Upgrade to Premium
						</Text>
						<Text style={styles.premiumDesc}>
							Unlock advanced analytics & AI features
						</Text>
					</View>
					<Text style={styles.premiumArrow}>→</Text>
				</TouchableOpacity>

				{/* Version */}
				<Text style={styles.versionText}>Scripnals v1.0.0</Text>

				<View style={{ height: 100 }} />
			</ScrollView>
			
			<CustomAlert 
				visible={alertConfig.visible}
				title={alertConfig.title}
				message={alertConfig.message}
				onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBF9F5',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingTop: 60,
		paddingBottom: 20,
	},
	backButton: {
		fontSize: 26,
		color: '#163354',
		fontWeight: '700',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#163354',
	},
	scrollContent: {
		paddingBottom: 40,
	},

	// Sections
	section: {
		paddingHorizontal: 24,
		marginBottom: 28,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '800',
		color: '#163354',
		marginBottom: 12,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
	},

	// Menu Items
	menuItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#FAF7F2',
		borderRadius: 16,
		padding: 16,
		marginBottom: 10,
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	menuLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	menuIcon: {
		fontSize: 20,
		marginRight: 12,
	},
	menuText: {
		fontSize: 15,
		fontWeight: '700',
		color: '#163354',
	},
	menuArrow: {
		fontSize: 18,
		color: '#8E9BAE',
		fontWeight: '600',
	},

	// Premium Card
	premiumCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FAF7F2',
		borderRadius: 18,
		padding: 20,
		marginHorizontal: 24,
		marginBottom: 24,
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	premiumIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: '#F5EFE6',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
		borderWidth: 1,
		borderColor: '#EADBCE',
	},
	premiumEmoji: {
		fontSize: 22,
	},
	premiumContent: {
		flex: 1,
	},
	premiumTitle: {
		fontSize: 16,
		fontWeight: '800',
		color: '#163354',
		marginBottom: 4,
	},
	premiumDesc: {
		fontSize: 13,
		color: '#64748B',
	},
	premiumArrow: {
		fontSize: 20,
		color: '#1D4A79',
		fontWeight: '700',
	},

	// Version
	versionText: {
		fontSize: 12,
		color: '#8E9BAE',
		textAlign: 'center',
		fontWeight: '500',
	},
})
