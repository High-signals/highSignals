import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Alert,
	TextInput,
	Modal,
	Platform,
} from 'react-native'
import DateTimePicker, {
	DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor'
import { LinearGradient } from 'expo-linear-gradient'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

interface Post {
	id: string
	title?: string
	content: string
	status: string
	platforms: string[]
	hashtags: string[]
	mediaUrls: string[]
	createdAt: string
	updatedAt?: string
	scheduledAt?: string | null
	publishedAt?: string | null
}

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')

const normalizeHtmlContent = (value?: string | null) => {
	if (!value) return '<p></p>'
	if (/<[a-z][\s\S]*>/i.test(value)) return value
	return `<p>${escapeHtml(value).replace(/\n/g, '<br/>')}</p>`
}

export default function PostDetailScreen() {
	const router = useRouter()
	const { postId } = useLocalSearchParams()
	const { isAuthenticated } = useAuth()
	const editorRef = useRef<RichEditor>(null)
	const [post, setPost] = useState<Post | null>(null)
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [editedPost, setEditedPost] = useState<Post | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [scheduleDate, setScheduleDate] = useState(new Date())
	const [editorFontSize, setEditorFontSize] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(3)
	const [pickerState, setPickerState] = useState<{
		visible: boolean
		type: 'status' | 'platform'
		index?: number
	}>({ visible: false, type: 'status' })

	useEffect(() => {
		if (!isAuthenticated || !postId) return
		fetchPost()
	}, [postId, isAuthenticated])

	const fetchPost = async () => {
		try {
			setLoading(true)
			const allPosts = await api.posts.getAll()
			const foundPost = allPosts.find((p: Post) => p.id === postId)
		if (foundPost) {
			setPost(foundPost)
			setEditedPost(foundPost)
			if (foundPost.scheduledAt) {
				setScheduleDate(new Date(foundPost.scheduledAt))
			}
		} else {
				Alert.alert('Error', 'Post not found')
				router.back()
			}
		} catch (error) {
			console.error('Error fetching post:', error)
			Alert.alert('Error', 'Failed to load post')
			router.back()
		} finally {
			setLoading(false)
		}
	}

	const handleSaveChanges = async () => {
		if (!editedPost) return

		try {
			setIsSaving(true)
			await api.posts.update(editedPost.id, {
				title: editedPost.title,
				content: editedPost.content,
				hashtags: editedPost.hashtags,
				platforms: editedPost.platforms,
				mediaUrls: editedPost.mediaUrls,
				status: editedPost.status,
				scheduledAt:
					editedPost.status === 'SCHEDULED'
						? scheduleDate.toISOString()
						: null,
			})
			setPost(editedPost)
			setIsEditing(false)
			Alert.alert('Success', 'Post updated successfully')
		} catch (error) {
			console.error('Error saving post:', error)
			Alert.alert('Error', 'Failed to update post')
		} finally {
			setIsSaving(false)
		}
	}

	const handleDeletePost = async () => {
		Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
			{ text: 'Cancel', onPress: () => {}, style: 'cancel' },
			{
				text: 'Delete',
				onPress: async () => {
					try {
						setIsSaving(true)
						await api.posts.delete(post!.id)
						Alert.alert('Success', 'Post deleted successfully')
						router.back()
					} catch (error) {
						console.error('Error deleting post:', error)
						Alert.alert('Error', 'Failed to delete post')
					} finally {
						setIsSaving(false)
					}
				},
				style: 'destructive',
			},
		])
	}

	const getPlatformIcon = (platform: string) => {
		const iconMap: { [key: string]: any } = {
			TWITTER: 'logo-twitter',
			INSTAGRAM: 'logo-instagram',
			FACEBOOK: 'logo-facebook',
			TIKTOK: 'logo-tiktok',
			YOUTUBE: 'logo-youtube',
			LINKEDIN: 'logo-linkedin',
		}
		return iconMap[platform] || 'logo-social'
	}

	const getStatusColor = (status: string) => {
		const colors: { [key: string]: string } = {
			DRAFT: '#8E8E93',
			SCHEDULED: '#FFB800',
			PUBLISHED: '#34C759',
			FAILED: '#FF6B6B',
		}
		return colors[status] || '#FFFFFF'
	}

	const displayPost = isEditing ? editedPost : post
	const statusColor = useMemo(
		() => getStatusColor(displayPost?.status || ''),
		[displayPost?.status],
	)
	const availableStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED']
	const availablePlatforms = [
		'LINKEDIN',
		'TWITTER',
		'INSTAGRAM',
		'FACEBOOK',
		'TIKTOK',
	]

	const openStatusPicker = () =>
		setPickerState({ visible: true, type: 'status' })
	const openPlatformPicker = (index: number) =>
		setPickerState({ visible: true, type: 'platform', index })
	const closePicker = () =>
		setPickerState((prev) => ({ ...prev, visible: false }))

	const openScheduleDatePicker = () => {
		if (Platform.OS === 'android') {
			DateTimePickerAndroid.open({
				value: scheduleDate,
				mode: 'date',
				onChange: (_event, selectedDate) => {
					if (!selectedDate || !editedPost) return

					DateTimePickerAndroid.open({
						value: selectedDate,
						mode: 'time',
						onChange: (_timeEvent, selectedTime) => {
							if (!selectedTime) return

							const next = new Date(selectedDate)
							next.setHours(
								selectedTime.getHours(),
								selectedTime.getMinutes(),
								selectedTime.getSeconds(),
								0,
							)
							setScheduleDate(next)
							setEditedPost({
								...editedPost,
								status: 'SCHEDULED',
								scheduledAt: next.toISOString(),
							})
						},
					})
				},
			})
			return
		}

		setShowDatePicker(true)
	}

	const chooseStatus = (status: string) => {
		if (!isEditing || !editedPost) return
		if (status === 'SCHEDULED') {
			setEditedPost({ ...editedPost, status })
			closePicker()
			openScheduleDatePicker()
			return
		}

		setEditedPost({
			...editedPost,
			status,
			scheduledAt: null,
		})
		closePicker()
	}

	const choosePlatform = (platform: string) => {
		if (!isEditing || !editedPost) return
		const idx = pickerState.index
		if (idx === undefined) return
		const nextPlatforms = [...editedPost.platforms]
		nextPlatforms[idx] = platform
		setEditedPost({ ...editedPost, platforms: nextPlatforms })
		closePicker()
	}

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#d4af37' />
				</View>
			</View>
		)
	}

	if (!post) {
		return (
			<View style={styles.container}>
				<View style={styles.emptyWrap}>
					<Ionicons
						name='alert-circle-outline'
						size={54}
						color='rgba(255,255,255,0.3)'
					/>
					<Text style={styles.errorText}>Post not found</Text>
				</View>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={['#0a192f', '#102845', '#0a192f']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.headerGradient}
			>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => (isEditing ? setIsEditing(false) : router.back())}
						style={styles.iconButton}
					>
						<Ionicons name='arrow-back' size={22} color='#ffffff' />
					</TouchableOpacity>

					<View style={styles.headerCenter}>
						<Text style={styles.headerKicker}>
							{isEditing ? 'Editing post' : 'Post details'}
						</Text>
						<Text style={styles.headerTitle}>
							{isEditing ? 'Refine your draft' : 'Content overview'}
						</Text>
					</View>

					{!isEditing ? (
						<TouchableOpacity
							onPress={() => {
								setEditedPost(post)
								setEditorFontSize(3)
								setIsEditing(true)
							}}
							style={styles.iconButton}
						>
							<Ionicons name='create-outline' size={22} color='#d4af37' />
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							onPress={handleSaveChanges}
							disabled={isSaving}
							style={styles.savePill}
						>
							<Text style={styles.saveText}>
								{isSaving ? 'Saving...' : 'Save'}
							</Text>
						</TouchableOpacity>
					)}
				</View>

				<View style={styles.statusRail}>
					<View style={[styles.statusDot, { backgroundColor: statusColor }]} />
					<Text style={[styles.statusText, { color: statusColor }]}>
						{displayPost?.status}
					</Text>
					<View style={styles.dotSeparator} />
					<Text style={styles.statusMeta}>
						{displayPost?.platforms?.length || 0} platform
						{(displayPost?.platforms?.length || 0) !== 1 ? 's' : ''}
					</Text>
				</View>
			</LinearGradient>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<View style={styles.heroCard}>
				<View style={styles.heroTopRow}>
						{isEditing ? (
							<TouchableOpacity
								style={[styles.badge, { borderColor: `${statusColor}33` }]}
								onPress={openStatusPicker}
								activeOpacity={0.8}
							>
								<View
									style={[styles.badgeDot, { backgroundColor: statusColor }]}
								/>
								<Text style={[styles.badgeText, { color: statusColor }]}>
									{displayPost?.status}
								</Text>
								<Ionicons
									name='chevron-down'
									size={14}
									color={statusColor}
								/>
							</TouchableOpacity>
						) : (
							<View style={[styles.badge, { borderColor: `${statusColor}33` }]}>
								<View
									style={[styles.badgeDot, { backgroundColor: statusColor }]}
								/>
								<Text style={[styles.badgeText, { color: statusColor }]}>
									{displayPost?.status}
								</Text>
							</View>
						)}
						<View style={styles.datePill}>
							<Ionicons
								name='calendar-outline'
								size={14}
								color='rgba(255,255,255,0.65)'
							/>
							<Text style={styles.datePillText}>
								{new Date(displayPost!.createdAt).toLocaleDateString()}
							</Text>
						</View>
					</View>

					{isEditing ? (
						<TextInput
							style={styles.titleInput}
							value={editedPost?.title || ''}
							onChangeText={(text) =>
								setEditedPost(
									editedPost ? { ...editedPost, title: text } : null,
								)
							}
							placeholder='Post title'
							placeholderTextColor='rgba(255,255,255,0.25)'
						/>
					) : (
						<Text style={styles.titleText}>
							{displayPost?.title || 'Untitled Post'}
						</Text>
					)}

					<Text style={styles.subtitleText}>
						{displayPost?.scheduledAt
							? `Scheduled for ${new Date(displayPost.scheduledAt).toLocaleString()}`
							: displayPost?.publishedAt
								? `Published ${new Date(displayPost.publishedAt).toLocaleString()}`
								: 'Saved as draft'}
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Content</Text>
					<View style={styles.card}>
						{isEditing ? (
							<>
								<View style={styles.toolbarRow}>
									<TouchableOpacity
										style={styles.toolButton}
										onPress={() => {
											if (editorFontSize > 1) {
												const next = (editorFontSize - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7
												setEditorFontSize(next)
												editorRef.current?.setFontSize(next)
											}
										}}
									>
										<Text style={styles.toolIcon}>A</Text>
										<Text style={styles.toolSubtext}>-</Text>
									</TouchableOpacity>

									<View style={styles.fontSizeContainer}>
										<Text style={styles.fontSizeDisplay}>
											{editorFontSize}
										</Text>
									</View>

									<TouchableOpacity
										style={styles.toolButton}
										onPress={() => {
											if (editorFontSize < 7) {
												const next = (editorFontSize + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7
												setEditorFontSize(next)
												editorRef.current?.setFontSize(next)
											}
										}}
									>
										<Text style={styles.toolIcon}>A</Text>
										<Text style={styles.toolSubtext}>+</Text>
									</TouchableOpacity>
								</View>

								<View style={styles.toolbarEditorWrap}>
									<RichToolbar
										editor={editorRef}
										actions={[
											actions.setBold,
											actions.setItalic,
											actions.setUnderline,
											actions.setStrikethrough,
											actions.heading1,
											actions.insertBulletsList,
											actions.insertOrderedList,
											actions.insertLink,
											actions.undo,
											actions.redo,
										]}
										iconTint='#ffffff'
										selectedIconTint='#0a192f'
										selectedButtonStyle={styles.richToolbarSelected}
										style={styles.richToolbar}
									/>
								</View>

								<View style={styles.editorSection}>
									<RichEditor
										ref={editorRef}
										key={`edit-${post?.id}-${post?.updatedAt || ''}`}
										initialContentHTML={normalizeHtmlContent(
											editedPost?.content || '',
										)}
										onChange={(html) =>
											setEditedPost(
												editedPost ? { ...editedPost, content: html } : null,
											)
										}
										editorStyle={{
											backgroundColor: 'transparent',
											color: '#ffffff',
											caretColor: '#d4af37',
											placeholderColor: 'rgba(255,255,255,0.25)',
											contentCSSText:
												"font-size: 16px; line-height: 24px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #ffffff;",
										}}
										placeholder='Write the post content here...'
										useContainer={false}
										style={styles.richEditorInput}
									/>
								</View>
							</>
						) : (
							<RichEditor
								key={`view-${post?.id}-${post?.updatedAt || ''}`}
								disabled
								initialContentHTML={normalizeHtmlContent(displayPost?.content)}
								editorStyle={{
									backgroundColor: 'transparent',
									color: '#ffffff',
									contentCSSText:
										"font-size: 15px; line-height: 24px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: rgba(255,255,255,0.88);",
								}}
								useContainer={false}
								style={styles.readOnlyEditor}
							/>
						)}
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Distribution</Text>
					<View style={styles.card}>
						<View style={styles.chipRow}>
							{displayPost?.platforms.map((platform, idx) =>
								isEditing ? (
									<TouchableOpacity
										key={idx}
										style={styles.platformChip}
										onPress={() => openPlatformPicker(idx)}
										activeOpacity={0.8}
									>
										<Ionicons
											name={getPlatformIcon(platform) as any}
											size={16}
											color='#d4af37'
										/>
										<Text style={styles.platformText}>{platform}</Text>
										<Ionicons
											name='chevron-down'
											size={12}
											color='rgba(212,175,55,0.9)'
										/>
									</TouchableOpacity>
								) : (
									<View key={idx} style={styles.platformChip}>
										<Ionicons
											name={getPlatformIcon(platform) as any}
											size={16}
											color='#d4af37'
										/>
										<Text style={styles.platformText}>{platform}</Text>
									</View>
								),
							)}
						</View>
					</View>
				</View>

				{displayPost?.hashtags && displayPost.hashtags.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionLabel}>Hashtags</Text>
						<View style={styles.card}>
							<View style={styles.chipRow}>
								{displayPost.hashtags.map((tag, idx) => (
									<View key={idx} style={styles.hashtagChip}>
										<Text style={styles.hashtagText}>{tag}</Text>
									</View>
								))}
							</View>
						</View>
					</View>
				)}

				{displayPost?.mediaUrls && displayPost.mediaUrls.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionLabel}>Media</Text>
						<View style={styles.card}>
							{displayPost.mediaUrls.map((url, idx) => (
								<View key={idx} style={styles.mediaRow}>
									<Ionicons
										name='image-outline'
										size={16}
										color='rgba(255,255,255,0.55)'
									/>
									<Text style={styles.urlText}>{url}</Text>
								</View>
							))}
						</View>
					</View>
				)}

				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Timeline</Text>
					<View style={styles.card}>
						<View style={styles.timelineRow}>
							<Text style={styles.timelineKey}>Created</Text>
							<Text style={styles.timelineValue}>
								{new Date(displayPost!.createdAt).toLocaleString()}
							</Text>
						</View>

						{displayPost!.scheduledAt && (
							<View style={styles.timelineRow}>
								<Text style={styles.timelineKey}>Scheduled</Text>
								<Text style={styles.timelineValue}>
									{new Date(displayPost!.scheduledAt).toLocaleString()}
								</Text>
							</View>
						)}

						{displayPost!.publishedAt && (
							<View style={styles.timelineRow}>
								<Text style={styles.timelineKey}>Published</Text>
								<Text style={styles.timelineValue}>
									{new Date(displayPost!.publishedAt).toLocaleString()}
								</Text>
							</View>
						)}
					</View>
				</View>

				{!isEditing && (
					<TouchableOpacity
						style={styles.deleteButton}
						onPress={handleDeletePost}
						disabled={isSaving}
					>
						<Ionicons name='trash-outline' size={20} color='#FF6B6B' />
						<Text style={styles.deleteButtonText}>Delete Post</Text>
					</TouchableOpacity>
				)}

				<View style={{ height: 40 }} />
			</ScrollView>

			<Modal
				visible={pickerState.visible}
				transparent
				animationType='fade'
				onRequestClose={closePicker}
			>
				<TouchableOpacity style={styles.modalOverlay} onPress={closePicker} activeOpacity={1}>
					<View style={styles.pickerSheet}>
						<Text style={styles.pickerTitle}>
							{pickerState.type === 'status'
								? 'Update status'
								: 'Update platform'}
						</Text>
						{pickerState.type === 'status'
							? availableStatuses.map((status) => (
									<TouchableOpacity
										key={status}
										style={styles.pickerOption}
										onPress={() => chooseStatus(status)}
									>
										<View
											style={[
												styles.pickerDot,
												{ backgroundColor: getStatusColor(status) },
											]}
										/>
										<Text style={styles.pickerOptionText}>{status}</Text>
									</TouchableOpacity>
								))
							: availablePlatforms.map((platform) => (
									<TouchableOpacity
										key={platform}
										style={styles.pickerOption}
										onPress={() => choosePlatform(platform)}
									>
										<Ionicons
											name={getPlatformIcon(platform) as any}
											size={16}
											color='#d4af37'
										/>
										<Text style={styles.pickerOptionText}>{platform}</Text>
									</TouchableOpacity>
								))}
					</View>
				</TouchableOpacity>
			</Modal>

			{showDatePicker && Platform.OS === 'ios' && (
				<DateTimePicker
					value={scheduleDate}
					mode='datetime'
					display='default'
					onChange={(event, selectedDate) => {
						if (event?.type === 'dismissed') {
							setShowDatePicker(false)
							return
						}

						if (selectedDate && editedPost) {
							setScheduleDate(selectedDate)
							setEditedPost({
								...editedPost,
								status: 'SCHEDULED',
								scheduledAt: selectedDate.toISOString(),
							})
						}
						setShowDatePicker(false)
					}}
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0a192f',
	},
	headerGradient: {
		paddingTop: 56,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(212,175,55,0.14)',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		gap: 12,
	},
	iconButton: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
	},
	headerCenter: {
		flex: 1,
	},
	headerKicker: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.6)',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginBottom: 4,
		fontWeight: '700',
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: '800',
		color: '#ffffff',
	},
	savePill: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 999,
		backgroundColor: '#d4af37',
	},
	saveText: {
		color: '#0a192f',
		fontSize: 13,
		fontWeight: '800',
	},
	statusRail: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 20,
		marginTop: 14,
	},
	statusDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	statusText: {
		fontSize: 12,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},
	dotSeparator: {
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: 'rgba(255,255,255,0.25)',
	},
	statusMeta: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.55)',
	},
	content: {
		flex: 1,
		padding: 20,
	},
	loadingWrap: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
	},
	errorText: {
		color: '#FF6B6B',
		fontSize: 16,
		textAlign: 'center',
		marginTop: 16,
		fontWeight: '700',
	},
	heroCard: {
		padding: 20,
		borderRadius: 20,
		backgroundColor: 'rgba(212,175,55,0.06)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.16)',
		marginBottom: 18,
	},
	heroTopRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 10,
		marginBottom: 16,
		flexWrap: 'wrap',
	},
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
	},
	badgeDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	badgeText: {
		fontSize: 12,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 0.7,
	},
	datePill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: 'rgba(255,255,255,0.05)',
	},
	datePillText: {
		fontSize: 12,
		fontWeight: '600',
		color: 'rgba(255,255,255,0.7)',
	},
	titleText: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 10,
	},
	titleInput: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: '800',
		color: '#ffffff',
		paddingVertical: 0,
		marginBottom: 10,
	},
	toolbarRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	toolButton: {
		width: 44,
		height: 44,
		borderRadius: 10,
		backgroundColor: 'rgba(255,255,255,0.1)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.1)',
	},
	toolIcon: {
		fontSize: 16,
		color: '#ffffff',
		fontWeight: '700',
	},
	toolSubtext: {
		fontSize: 10,
		color: '#ffffff',
		fontWeight: '700',
		marginTop: -2,
	},
	fontSizeContainer: {
		backgroundColor: 'rgba(212,175,55,0.15)',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		marginRight: 8,
	},
	fontSizeDisplay: {
		fontSize: 13,
		color: '#d4af37',
		fontWeight: '700',
	},
	toolbarEditorWrap: {
		borderRadius: 14,
		overflow: 'hidden',
		backgroundColor: 'rgba(255,255,255,0.04)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.12)',
	},
	richToolbar: {
		backgroundColor: 'transparent',
		borderTopWidth: 0,
		borderBottomWidth: 0,
	},
	richToolbarSelected: {
		backgroundColor: '#d4af37',
	},
	subtitleText: {
		fontSize: 13,
		color: 'rgba(255,255,255,0.6)',
		lineHeight: 20,
	},
	section: {
		marginBottom: 18,
	},
	sectionLabel: {
		fontSize: 13,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		color: '#d4af37',
		marginBottom: 12,
	},
	card: {
		padding: 16,
		borderRadius: 18,
		backgroundColor: 'rgba(255,255,255,0.04)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
	},
	contentText: {
		fontSize: 15,
		lineHeight: 24,
		color: 'rgba(255,255,255,0.88)',
	},
	editorSection: {
		minHeight: 280,
		paddingVertical: 8,
	},
	richEditorInput: {
		minHeight: 240,
	},
	readOnlyEditor: {
		minHeight: 180,
	},
	input: {
		backgroundColor: 'rgba(255,255,255,0.03)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.18)',
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 12,
		color: '#ffffff',
		fontSize: 15,
	},
	contentInput: {
		minHeight: 180,
		textAlignVertical: 'top',
		lineHeight: 24,
	},
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	platformChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: 999,
		backgroundColor: 'rgba(212,175,55,0.09)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.22)',
	},
	platformText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#d4af37',
	},
	hashtagChip: {
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: 999,
		backgroundColor: 'rgba(0,217,255,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(0,217,255,0.2)',
	},
	hashtagText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#00D9FF',
	},
	mediaRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		paddingVertical: 6,
	},
	urlText: {
		flex: 1,
		fontSize: 13,
		color: 'rgba(255,255,255,0.7)',
		lineHeight: 19,
	},
	timelineRow: {
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255,255,255,0.06)',
	},
	timelineKey: {
		fontSize: 12,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 0.7,
		color: 'rgba(255,255,255,0.5)',
		marginBottom: 4,
	},
	timelineValue: {
		fontSize: 14,
		lineHeight: 22,
		color: '#ffffff',
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 14,
		borderRadius: 14,
		backgroundColor: 'rgba(255,107,107,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(255,107,107,0.35)',
		marginTop: 12,
	},
	deleteButtonText: {
		fontSize: 16,
		fontWeight: '800',
		color: '#FF6B6B',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.55)',
		justifyContent: 'flex-end',
	},
	pickerSheet: {
		backgroundColor: '#0f223d',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		borderTopWidth: 1,
		borderColor: 'rgba(212,175,55,0.18)',
	},
	pickerTitle: {
		fontSize: 16,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 16,
	},
	pickerOption: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255,255,255,0.06)',
	},
	pickerOptionText: {
		fontSize: 14,
		color: '#ffffff',
		fontWeight: '600',
	},
	pickerDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
})

