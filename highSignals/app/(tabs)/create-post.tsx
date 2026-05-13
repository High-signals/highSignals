import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Keyboard,
	Platform,
	Modal,
	ActivityIndicator,
	Alert,
	ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import DateTimePicker, {
	DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { RichEditor, actions } from 'react-native-pell-rich-editor'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const BRAND = '#d4af37'
const BG = '#000000'
const PANEL = '#0f0f0f'

type PublishOption = 'immediate' | 'schedule' | 'draft'

const COLOR_SWATCHES = [
	BRAND,
	'#ffffff',
	'#9ca3af',
	'#ef4444',
	'#f97316',
	'#facc15',
	'#22c55e',
	'#3b82f6',
	'#a855f7',
	'#ec4899',
]

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function CreatePostScreen() {
	const router = useRouter()
	const editorRef = useRef<RichEditor>(null)
	const scrollRef = useRef<ScrollView>(null)
	const [editorHeight, setEditorHeight] = useState(500)
	const { isAuthenticated } = useAuth()
	const [content, setContent] = useState('')
	const [title, setTitle] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	// Publishing options
	const [publishOption, setPublishOption] = useState<PublishOption>('draft')
	const [scheduleDate, setScheduleDate] = useState(new Date())
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [showPublishModal, setShowPublishModal] = useState(false)

	// Toolbar UI
	const [showColors, setShowColors] = useState(false)
	const [keyboardHeight, setKeyboardHeight] = useState(0)

	useEffect(() => {
		const showEvent =
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
		const hideEvent =
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
		const showSub = Keyboard.addListener(showEvent, (e) => {
			const height = e.endCoordinates?.height ?? 0
			setKeyboardHeight(height + 20)
			console.log('🎹 Keyboard Height set:', setKeyboardHeight) // Add this line
		})
		const hideSub = Keyboard.addListener(hideEvent, () => {
			setKeyboardHeight(0 + 0)
		})
		return () => {
			showSub.remove()
			hideSub.remove()
		}
	}, [])

	// Auto-save plumbing
	const draftIdRef = useRef<string | null>(null)
	const inFlightRef = useRef(false)
	const pendingRef = useRef(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastSavedSnapshotRef = useRef<string>('')
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

	const performSave = useCallback(async () => {
		const snapshot = JSON.stringify({ title, content })
		if (snapshot === lastSavedSnapshotRef.current) return
		if (!isAuthenticated) return

		const plainText = content
			.replace(/<[^>]+>/g, '')
			.replace(/&nbsp;/g, '')
			.trim()
		if (!plainText && !title.trim()) return
		if (!plainText) return

		if (inFlightRef.current) {
			pendingRef.current = true
			return
		}

		inFlightRef.current = true
		setSaveStatus('saving')
		try {
			if (draftIdRef.current) {
				await api.posts.update(draftIdRef.current, {
					title: title.trim() || 'Untitled',
					content,
				})
			} else {
				const created = await api.posts.create({
					title: title.trim() || 'Untitled',
					content,
					platforms: [],
					mediaUrls: [],
					status: 'DRAFT',
					scheduledAt: null,
				})
				const newId = created?.post?.id || created?.id
				if (newId) draftIdRef.current = newId
			}
			lastSavedSnapshotRef.current = snapshot
			setSaveStatus('saved')
		} catch (err) {
			console.warn('autosave failed', err)
			setSaveStatus('error')
		} finally {
			inFlightRef.current = false
			if (pendingRef.current) {
				pendingRef.current = false
				performSave()
			}
		}
	}, [title, content, isAuthenticated])

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		if (!title && !content) return
		debounceRef.current = setTimeout(() => {
			performSave()
		}, 1500)
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [title, content, performSave])

	const sendAction = (actionName: string, param?: string) => {
		editorRef.current?.sendAction(actionName, 'result', param)
	}

	const insertDivider = () => {
		editorRef.current?.insertHTML('<hr />')
	}

	const insertLink = () => {
		Alert.prompt?.(
			'Insert link',
			'Paste a URL',
			(url) => {
				if (!url) return
				editorRef.current?.insertLink(url, url)
			},
			'plain-text',
		)
	}

	const applyColor = (hex: string) => {
		setShowColors(false)
		editorRef.current?.sendAction(actions.foreColor, 'result', hex)
		setTimeout(() => {
			editorRef.current?.commandDOM(
				`document.execCommand('foreColor', false, '${hex}')`,
			)
		}, 30)
	}

	const combineDateAndTime = (datePart: Date, timePart: Date) => {
		const next = new Date(datePart)
		next.setHours(
			timePart.getHours(),
			timePart.getMinutes(),
			timePart.getSeconds(),
			0,
		)
		return next
	}

	const openScheduleDatePicker = () => {
		if (Platform.OS === 'android') {
			DateTimePickerAndroid.open({
				value: scheduleDate,
				mode: 'date',
				onChange: (_event, selectedDate) => {
					if (!selectedDate) return
					DateTimePickerAndroid.open({
						value: selectedDate,
						mode: 'time',
						onChange: (_timeEvent, selectedTime) => {
							if (selectedTime) {
								setScheduleDate(
									combineDateAndTime(
										selectedDate,
										selectedTime,
									),
								)
							}
						},
					})
				},
			})
			return
		}
		setShowDatePicker(true)
	}

	const handleHeaderSavePress = async () => {
		if (!title.trim()) {
			Alert.alert(
				'Title required',
				'Add a title so you can find this draft later.',
			)
			return
		}
		await performSave()
	}

	const handlePublish = async () => {
		if (!title.trim()) {
			Alert.alert('Title required', 'Please add a title.')
			return
		}
		if (!content) {
			Alert.alert('Empty post', 'Write something before publishing.')
			return
		}
		if (!isAuthenticated) {
			Alert.alert('Not signed in', 'Please log in first.')
			return
		}

		setIsSaving(true)
		try {
			const scheduleTime =
				publishOption === 'schedule' ? scheduleDate.toISOString() : null
			const status =
				publishOption === 'draft'
					? 'DRAFT'
					: publishOption === 'schedule'
						? 'SCHEDULED'
						: 'PUBLISHED'

			if (draftIdRef.current) {
				await api.posts.update(draftIdRef.current, {
					title: title.trim(),
					content,
					status,
					scheduledAt: scheduleTime,
				})
			} else {
				await api.posts.create({
					title: title.trim(),
					content,
					platforms: [],
					mediaUrls: [],
					status,
					scheduledAt: scheduleTime,
				})
			}

			Alert.alert(
				'Success',
				publishOption === 'draft'
					? 'Saved as draft'
					: publishOption === 'schedule'
						? 'Scheduled'
						: 'Published',
			)
			router.back()
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to save post')
		} finally {
			setIsSaving(false)
			setShowPublishModal(false)
		}
	}

	const saveLabel =
		saveStatus === 'saving'
			? 'Saving…'
			: saveStatus === 'saved'
				? 'Saved'
				: saveStatus === 'error'
					? 'Save failed'
					: ''

	return (
		<View style={styles.container}>
			{/* Header strip */}
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.headerIconBtn}
				>
					<Ionicons name='close' size={24} color='#ffffff' />
				</TouchableOpacity>

				<View style={styles.headerCenter}>
					<Text style={styles.headerTitle}>New post</Text>
					{!!saveLabel && (
						<Text
							style={[
								styles.saveLabel,
								saveStatus === 'error' && styles.saveLabelError,
							]}
						>
							{saveLabel}
						</Text>
					)}
				</View>

				<TouchableOpacity
					onPress={handleHeaderSavePress}
					style={styles.headerIconBtn}
				>
					<Ionicons name='save-outline' size={22} color={BRAND} />
				</TouchableOpacity>
			</View>
			{/* Title input — no card */}
			<TextInput
				style={styles.titleInput}
				placeholder='Title'
				placeholderTextColor='rgba(255,255,255,0.35)'
				value={title}
				onChangeText={setTitle}
			/>
			{/* Full-page editor */}
			<ScrollView
				ref={scrollRef}
				style={styles.editorScroll}
				contentContainerStyle={{
					paddingBottom: keyboardHeight + 20,
				}}
				keyboardShouldPersistTaps='handled'
			>
				<RichEditor
					ref={editorRef}
					initialContentHTML={'<p></p>'}
					onChange={setContent}
					onCursorPosition={(scrollY) => {
						scrollRef.current?.scrollTo({
							y: scrollY - 100,
							animated: true,
						})
					}}
					onHeightChange={(h) => {
						if (h && h > 0) {
							setEditorHeight(Math.max(h, 500))
							setTimeout(() => {
								scrollRef.current?.scrollToEnd({
									animated: true,
								})
							}, 50)
						}
					}}
					editorStyle={{
						backgroundColor: BG,
						color: '#ffffff',
						caretColor: BRAND,
						placeholderColor: 'rgba(255,255,255,0.3)',
						contentCSSText:
							"font-size: 17px; line-height: 28px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #ffffff; padding: 8px 0;",
					}}
					placeholder='Start writing…'
					useContainer={false}
					initialHeight={500}
					style={[styles.richEditor, { height: editorHeight }]}
				/>
			</ScrollView>
			{/* Floating dock: publish strip + color tray + toolbar, lifts above keyboard */}
			<View style={styles.publishContainer}>
				<TouchableOpacity
					style={styles.publishStrip}
					onPress={() => setShowPublishModal(true)}
					activeOpacity={0.85}
				>
					<Text style={styles.publishStripText}>Publish</Text>
					<Ionicons name='arrow-forward' size={16} color='#000000' />
				</TouchableOpacity>
			</View>
			<View
				style={[styles.floatingDock, { bottom: keyboardHeight }]}
				pointerEvents='box-none'
			>
				{showColors && (
					<View style={styles.swatchTray}>
						{COLOR_SWATCHES.map((hex) => (
							<TouchableOpacity
								key={hex}
								onPress={() => applyColor(hex)}
								style={[
									styles.swatch,
									{ backgroundColor: hex },
								]}
							/>
						))}
					</View>
				)}

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					keyboardShouldPersistTaps='always'
					contentContainerStyle={styles.toolbar}
					style={styles.toolbarOuter}
				>
					<ToolbarText
						label='H1'
						onPress={() => sendAction(actions.heading1)}
					/>
					<ToolbarText
						label='H2'
						onPress={() => sendAction(actions.heading2)}
					/>
					<ToolbarText
						label='H3'
						onPress={() => sendAction(actions.heading3)}
					/>
					<ToolbarText
						label='N'
						onPress={() => sendAction(actions.setParagraph)}
					/>
					<Divider />
					<ToolbarStyled
						label='B'
						textStyle={{ fontWeight: '900' }}
						onPress={() => sendAction(actions.setBold)}
					/>
					<ToolbarStyled
						label='I'
						textStyle={{ fontStyle: 'italic' }}
						onPress={() => sendAction(actions.setItalic)}
					/>
					<ToolbarStyled
						label='U'
						textStyle={{ textDecorationLine: 'underline' }}
						onPress={() => sendAction(actions.setUnderline)}
					/>
					<ToolbarStyled
						label='S'
						textStyle={{ textDecorationLine: 'line-through' }}
						onPress={() => sendAction(actions.setStrikethrough)}
					/>
					<Divider />
					<ToolbarIcon
						name='checkbox-outline'
						onPress={() => sendAction(actions.checkboxList)}
					/>
					<ToolbarIcon
						name='list-outline'
						onPress={() => sendAction(actions.insertBulletsList)}
					/>
					<ToolbarIcon
						name='list-circle-outline'
						onPress={() => sendAction(actions.insertOrderedList)}
					/>
					<ToolbarIcon
						name='remove-outline'
						onPress={insertDivider}
					/>
					<ToolbarIcon name='link-outline' onPress={insertLink} />
					<ToolbarIcon
						name='color-palette-outline'
						onPress={() => setShowColors((v) => !v)}
					/>
					<Divider />
					<ToolbarIcon
						name='arrow-undo-outline'
						onPress={() => sendAction(actions.undo)}
					/>
					<ToolbarIcon
						name='arrow-redo-outline'
						onPress={() => sendAction(actions.redo)}
					/>
				</ScrollView>
			</View>
			{/* Publish Modal */}
			<Modal
				visible={showPublishModal}
				transparent
				animationType='slide'
				onRequestClose={() => setShowPublishModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Publish</Text>

						<PublishOptionRow
							icon='flash-outline'
							title='Publish now'
							desc='Go live immediately'
							selected={publishOption === 'immediate'}
							onPress={() => setPublishOption('immediate')}
						/>
						<PublishOptionRow
							icon='calendar-outline'
							title='Schedule'
							desc={
								publishOption === 'schedule'
									? scheduleDate.toLocaleString()
									: 'Pick a date & time'
							}
							selected={publishOption === 'schedule'}
							onPress={() => {
								setPublishOption('schedule')
								openScheduleDatePicker()
							}}
						/>
						<PublishOptionRow
							icon='document-text-outline'
							title='Save as draft'
							desc='Edit and publish later'
							selected={publishOption === 'draft'}
							onPress={() => setPublishOption('draft')}
						/>

						<View style={styles.modalActions}>
							<TouchableOpacity
								style={styles.cancelButton}
								onPress={() => setShowPublishModal(false)}
							>
								<Text style={styles.cancelText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.confirmButton,
									isSaving && styles.buttonDisabled,
								]}
								onPress={handlePublish}
								disabled={isSaving}
							>
								{isSaving ? (
									<ActivityIndicator
										color='#000000'
										size='small'
									/>
								) : (
									<Text style={styles.confirmText}>
										Confirm
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
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
						if (selectedDate) setScheduleDate(selectedDate)
						setShowDatePicker(false)
					}}
				/>
			)}
		</View>
	)
}

function ToolbarIcon({
	name,
	onPress,
}: {
	name: keyof typeof Ionicons.glyphMap
	onPress: () => void
}) {
	return (
		<TouchableOpacity onPress={onPress} style={styles.toolBtn}>
			<Ionicons name={name} size={22} color={BRAND} />
		</TouchableOpacity>
	)
}

function ToolbarStyled({
	label,
	textStyle,
	onPress,
}: {
	label: string
	textStyle: any
	onPress: () => void
}) {
	return (
		<TouchableOpacity onPress={onPress} style={styles.toolBtn}>
			<Text style={[styles.toolBtnLabel, textStyle]}>{label}</Text>
		</TouchableOpacity>
	)
}

function ToolbarText({
	label,
	onPress,
}: {
	label: string
	onPress: () => void
}) {
	return (
		<TouchableOpacity onPress={onPress} style={styles.toolBtn}>
			<Text style={styles.toolBtnLabel}>{label}</Text>
		</TouchableOpacity>
	)
}

function Divider() {
	return <View style={styles.toolDivider} />
}

function PublishOptionRow({
	icon,
	title,
	desc,
	selected,
	onPress,
}: {
	icon: keyof typeof Ionicons.glyphMap
	title: string
	desc: string
	selected: boolean
	onPress: () => void
}) {
	return (
		<TouchableOpacity
			style={[styles.option, selected && styles.optionSelected]}
			onPress={onPress}
		>
			<View style={styles.optionLeft}>
				<Ionicons name={icon} size={22} color={BRAND} />
				<View style={{ marginLeft: 12 }}>
					<Text style={styles.optionTitle}>{title}</Text>
					<Text style={styles.optionDesc}>{desc}</Text>
				</View>
			</View>
			<View style={[styles.radio, selected && styles.radioActive]}>
				{selected && <View style={styles.radioDot} />}
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: BG,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingTop: 16,
		paddingBottom: 8,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(255,255,255,0.08)',
	},
	headerCenter: {
		flex: 1,
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#ffffff',
	},
	saveLabel: {
		fontSize: 11,
		color: 'rgba(255,255,255,0.45)',
		marginTop: 2,
	},
	saveLabelError: {
		color: '#ef4444',
	},
	headerIconBtn: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
	},
	titleInput: {
		fontSize: 26,
		fontWeight: '800',
		color: '#ffffff',
		paddingHorizontal: 18,
		paddingTop: 14,
		paddingBottom: 8,
	},
	editorScroll: {
		flex: 1,
		paddingHorizontal: 12,
		// bottom: 10,
	},
	richEditor: {
		backgroundColor: BG,
	},
	floatingDock: {
		position: 'fixed',
		left: 0,
		right: 0,
		backgroundColor: BG,
	},
	publishContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 40,
		zIndex: 900,
	},
	publishStrip: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		backgroundColor: BRAND,
		marginHorizontal: 12,
		marginBottom: 8,
		paddingVertical: 12,
		borderRadius: 12,
	},
	publishStripText: {
		color: '#000000',
		fontWeight: '800',
		fontSize: 15,
	},
	swatchTray: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		paddingHorizontal: 14,
		paddingVertical: 10,
		backgroundColor: PANEL,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(255,255,255,0.08)',
	},
	swatch: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.15)',
	},
	toolbarOuter: {
		backgroundColor: PANEL,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(255,255,255,0.08)',
		maxHeight: 55,
	},
	toolbar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 6,
		gap: 2,
	},
	toolBtn: {
		minWidth: 40,
		height: 40,
		paddingHorizontal: 8,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
	},
	toolBtnLabel: {
		color: BRAND,
		fontWeight: '800',
		fontSize: 14,
	},
	toolBtnTextLabel: {
		color: BRAND,
		fontWeight: '800',
		fontSize: 16,
		textDecorationLine: 'underline',
	},
	toolDivider: {
		width: 1,
		height: 22,
		backgroundColor: 'rgba(255,255,255,0.1)',
		marginHorizontal: 4,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#0f0f0f',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		paddingBottom: 32,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(255,255,255,0.1)',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 16,
	},
	option: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderRadius: 12,
		backgroundColor: 'rgba(255,255,255,0.04)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.06)',
		marginBottom: 8,
	},
	optionSelected: {
		borderColor: BRAND,
		backgroundColor: 'rgba(212,175,55,0.08)',
	},
	optionLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	optionTitle: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 14,
	},
	optionDesc: {
		color: 'rgba(255,255,255,0.5)',
		fontSize: 12,
		marginTop: 2,
	},
	radio: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 2,
		borderColor: 'rgba(255,255,255,0.25)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioActive: {
		borderColor: BRAND,
	},
	radioDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: BRAND,
	},
	modalActions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 12,
	},
	cancelButton: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255,0.06)',
	},
	cancelText: {
		color: '#ffffff',
		fontWeight: '700',
	},
	confirmButton: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		backgroundColor: BRAND,
	},
	confirmText: {
		color: '#000000',
		fontWeight: '800',
	},
	buttonDisabled: {
		opacity: 0.6,
	},
})
