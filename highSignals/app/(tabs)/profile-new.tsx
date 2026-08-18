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
} from 'react-native'
import Toast from 'react-native-toast-message'
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
			Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load profile' })
		} finally {
			setLoading(false)
		}
	}

	const handleImagePick = async () => {
		const permission =
			await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (!permission.granted) {
			Toast.show({ type: 'error', text1: 'Permission needed', text2: 'Please allow photo access to change your avatar.' })
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
			Toast.show({ type: 'error', text1: 'Upload failed', text2: error?.message || 'Could not upload avatar' })
			setForm((prev) => ({ ...prev, avatar: previousAvatar }))
		} finally {
			setUploadingAvatar(false)
		}
	}

	const handleSave = async () => {
		if (!form.name.trim()) {
			Toast.show({ type: 'error', text1: 'Error', text2: 'Name is required' })
			return
		}

		try {
			setSaving(true)
			await api.profile.update({
				name: form.name.trim(),
				bio: form.bio,
			})
			Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully' })
			router.back()
		} catch (error: any) {
			console.error('Error saving profile:', error)
			Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to save profile' })
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<View style={[styles.container, styles.center]}>
				<ActivityIndicator size='large' color='#1D4A79' />
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
							placeholderTextColor='#8E9BAE'
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Email</Text>
						<TextInput
							style={[styles.input, styles.disabledInput]}
							value={form.email}
							editable={false}
							placeholderTextColor='#8E9BAE'
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
							placeholderTextColor='#8E9BAE'
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
					activeOpacity={0.85}
				>
					{saving ? (
						<ActivityIndicator color='#FFFFFF' />
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
		backgroundColor: '#FBF9F5',
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
		paddingBottom: 24,
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
	imageSection: {
		alignItems: 'center',
		marginBottom: 32,
	},
	imageContainer: {
		position: 'relative',
	},
	profileImage: {
		width: 110,
		height: 110,
		borderRadius: 55,
		borderWidth: 3,
		borderColor: '#1D4A79',
	},
	placeholderImage: {
		width: 110,
		height: 110,
		borderRadius: 55,
		backgroundColor: '#1D4A79',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 3,
		borderColor: '#1D4A79',
	},
	placeholderInitial: {
		fontSize: 44,
		fontWeight: '800',
		color: '#FFFFFF',
	},
	cameraIcon: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: '#F5EFE6',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#EADBCE',
	},
	avatarOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 55,
		backgroundColor: 'rgba(22, 51, 84, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	cameraEmoji: {
		fontSize: 14,
	},
	form: {
		paddingHorizontal: 24,
		gap: 18,
	},
	inputGroup: {},
	label: {
		fontSize: 13.5,
		fontWeight: '700',
		color: '#163354',
		marginBottom: 8,
	},
	input: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 13,
		fontSize: 15,
		color: '#163354',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	disabledInput: {
		backgroundColor: '#F5EFE6',
		opacity: 0.8,
	},
	bioInput: {
		minHeight: 110,
		textAlignVertical: 'top',
	},
	saveButton: {
		marginHorizontal: 24,
		marginTop: 36,
		backgroundColor: '#1D4A79',
		borderRadius: 14,
		paddingVertical: 15,
		alignItems: 'center',
	},
	saveButtonDisabled: {
		opacity: 0.7,
	},
	saveButtonText: {
		fontSize: 15,
		fontWeight: '800',
		color: '#FFFFFF',
	},
})
