import React, { useEffect, useState } from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	TextInput,
	Image,
	ActivityIndicator,
	Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

export default function ProfileEditScreen() {
	const router = useRouter()
	const { isAuthenticated } = useAuth()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [uploadingAvatar, setUploadingAvatar] = useState(false)
	const [form, setForm] = useState({
		name: '',
		email: '',
		bio: '',
		avatar: null as string | null,
	})

	useEffect(() => {
		if (isAuthenticated) {
			loadProfile()
		}
	}, [isAuthenticated])

	const loadProfile = async () => {
		try {
			setLoading(true)
			const profileData = await api.profile.get()
			setForm({
				name: profileData.name || '',
				email: profileData.email || '',
				bio: profileData.bio || '',
				avatar: profileData.avatar || null,
			})
		} catch (error) {
			console.error('Error loading profile:', error)
			Alert.alert('Error', 'Failed to load profile')
		} finally {
			setLoading(false)
		}
	}

	const handleImagePick = async () => {
		const permission =
			await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (!permission.granted) {
			Alert.alert(
				'Permission needed',
				'Please allow photo access to change your avatar.',
			)
			return
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		})

		if (result.canceled) return
		const asset = result.assets[0]
		const previousAvatar = form.avatar
		setForm((prev) => ({ ...prev, avatar: asset.uri }))
		setUploadingAvatar(true)
		try {
			const updated = await api.profile.uploadAvatar({
				uri: asset.uri,
				mimeType: asset.mimeType,
				fileName: asset.fileName,
			})
			setForm((prev) => ({ ...prev, avatar: updated.avatar || null }))
		} catch (error: any) {
			console.error('Avatar upload failed', error)
			Alert.alert(
				'Upload failed',
				error?.message || 'Could not upload avatar',
			)
			setForm((prev) => ({ ...prev, avatar: previousAvatar }))
		} finally {
			setUploadingAvatar(false)
		}
	}

	const handleSave = async () => {
		if (!form.name.trim()) {
			Alert.alert('Error', 'Name is required')
			return
		}

		try {
			setSaving(true)
			await api.profile.update({
				name: form.name.trim(),
				bio: form.bio,
			})
			Alert.alert('Success', 'Profile updated successfully')
			router.back()
		} catch (error: any) {
			console.error('Error saving profile:', error)
			Alert.alert('Error', error.message || 'Failed to save profile')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<View style={[styles.container, styles.center]}>
				<ActivityIndicator size='large' color='#d4af37' />
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backButton}>{'←'}</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Edit Profile</Text>
					<View style={{ width: 30 }} />
				</View>

				<View style={styles.imageSection}>
					<TouchableOpacity
						style={styles.imageContainer}
						onPress={handleImagePick}
						disabled={uploadingAvatar}
						activeOpacity={0.85}
					>
						{form.avatar ? (
							<Image
								source={{ uri: form.avatar }}
								style={styles.profileImage}
							/>
						) : (
							<View style={styles.placeholderImage}>
								<Text style={styles.placeholderInitial}>
									{form.name?.[0] || 'U'}
								</Text>
							</View>
						)}
						{uploadingAvatar && (
							<View style={styles.avatarOverlay}>
								<ActivityIndicator color='#ffffff' />
							</View>
						)}
						<View style={styles.cameraIcon}>
							<Text style={styles.cameraEmoji}>📷</Text>
						</View>
					</TouchableOpacity>
				</View>

				<View style={styles.form}>
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Name</Text>
						<TextInput
							style={styles.input}
							value={form.name}
							onChangeText={(text) =>
								setForm((prev) => ({ ...prev, name: text }))
							}
							placeholder='Your name'
							placeholderTextColor='rgba(255,255,255,0.3)'
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Email</Text>
						<TextInput
							style={[styles.input, styles.disabledInput]}
							value={form.email}
							editable={false}
							placeholderTextColor='rgba(255,255,255,0.3)'
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Bio</Text>
						<TextInput
							style={[styles.input, styles.bioInput]}
							value={form.bio}
							onChangeText={(text) =>
								setForm((prev) => ({ ...prev, bio: text }))
							}
							placeholder='Tell people a bit about you'
							placeholderTextColor='rgba(255,255,255,0.3)'
							multiline
							numberOfLines={4}
						/>
					</View>
				</View>

				<TouchableOpacity
					style={[
						styles.saveButton,
						saving && styles.saveButtonDisabled,
					]}
					onPress={handleSave}
					disabled={saving}
				>
					{saving ? (
						<ActivityIndicator color='#0a192f' />
					) : (
						<Text style={styles.saveButtonText}>Save changes</Text>
					)}
				</TouchableOpacity>

				<View style={{ height: 60 }} />
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#1a2b4a',
	},
	center: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingTop: 60,
		paddingBottom: 30,
	},
	backButton: {
		fontSize: 28,
		color: '#ffffff',
		fontWeight: '600',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#ffffff',
	},
	imageSection: {
		alignItems: 'center',
		marginBottom: 40,
	},
	imageContainer: {
		position: 'relative',
	},
	profileImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
		borderWidth: 4,
		borderColor: '#ffffff',
	},
	placeholderImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: '#ffffff',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 4,
		borderColor: '#ffffff',
	},
	placeholderInitial: {
		fontSize: 48,
		fontWeight: '800',
		color: '#1a2b4a',
	},
	cameraIcon: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#ffffff',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 3,
		borderColor: '#1a2b4a',
	},
	avatarOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 60,
		backgroundColor: 'rgba(0,0,0,0.45)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	cameraEmoji: {
		fontSize: 16,
	},
	form: {
		paddingHorizontal: 24,
		gap: 20,
	},
	inputGroup: {},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#ffffff',
		marginBottom: 10,
	},
	input: {
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 15,
		color: '#ffffff',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.1)',
	},
	disabledInput: {
		opacity: 0.65,
	},
	bioInput: {
		minHeight: 120,
		textAlignVertical: 'top',
	},
	saveButton: {
		marginHorizontal: 24,
		marginTop: 40,
		backgroundColor: '#d4af37',
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
	},
	saveButtonDisabled: {
		opacity: 0.7,
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0a192f',
	},
})
