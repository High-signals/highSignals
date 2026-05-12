import React, { useRef, useState } from 'react'
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Modal,
	ActivityIndicator,
	Alert,
	Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import DateTimePicker, {
	DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const { width } = Dimensions.get('window')

type PublishOption = 'immediate' | 'schedule' | 'draft'

type TextStyleState = {
	bold: boolean
	italic: boolean
	underline: boolean
	strike: boolean
	size: number
}

const defaultTextStyleState: TextStyleState = {
	bold: false,
	italic: false,
	underline: false,
	strike: false,
	size: 16,
}

const tokenizeRichText = (text: string) => {
	type Segment = { text: string; style: TextStyleState }
	const segments: Segment[] = []

	let current = ''
	let i = 0
	let style: TextStyleState = { ...defaultTextStyleState }

	const flush = () => {
		if (current.length > 0) {
			segments.push({ text: current, style: { ...style } })
			current = ''
		}
	}

	while (i < text.length) {
		if (text.startsWith('[size=', i)) {
			const close = text.indexOf(']', i)
			if (close !== -1) {
				const value = Number(text.slice(i + 6, close))
				flush()
				style = {
					...style,
					size: Number.isFinite(value) ? value : style.size,
				}
				i = close + 1
				continue
			}
		}

		if (text.startsWith('[/size]', i)) {
			flush()
			style = { ...style, size: defaultTextStyleState.size }
			i += 7
			continue
		}

		if (text.startsWith('**', i)) {
			flush()
			style = { ...style, bold: !style.bold }
			i += 2
			continue
		}

		if (text.startsWith('__', i)) {
			flush()
			style = { ...style, underline: !style.underline }
			i += 2
			continue
		}

		if (text.startsWith('~~', i)) {
			flush()
			style = { ...style, strike: !style.strike }
			i += 2
			continue
		}

		if (text.startsWith('_', i)) {
			flush()
			style = { ...style, italic: !style.italic }
			i += 1
			continue
		}

		current += text[i]
		i += 1
	}

	flush()
	return segments
}

const renderRichText = (text: string, baseFontSize: number, color: string) => {
	const segments = tokenizeRichText(text)

	if (segments.length === 0) {
		return null
	}

	return segments.map((segment, index) => {
		const segmentStyle = {
			fontSize: segment.style.size || baseFontSize,
			fontWeight: segment.style.bold
				? ('700' as const)
				: ('400' as const),
			fontStyle: segment.style.italic
				? ('italic' as const)
				: ('normal' as const),
			textDecorationLine: [
				segment.style.underline ? 'underline' : null,
				segment.style.strike ? 'line-through' : null,
			]
				.filter(Boolean)
				.join(' ') as
				| 'none'
				| 'underline'
				| 'line-through'
				| 'underline line-through',
			color,
		}

		return (
			<Text key={`${index}-${segment.text}`} style={segmentStyle}>
				{segment.text}
			</Text>
		)
	})
}

export default function CreatePostScreen() {
	const router = useRouter()
	const editorRef = useRef<RichEditor>(null)
	const { isAuthenticated } = useAuth()
	const [content, setContent] = useState('')
	const [title, setTitle] = useState('')
	const [aiScore, setAiScore] = useState<number | null>(null)
	const [aiFeedback, setAiFeedback] = useState<string[]>([])
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	// Publishing options
	const [publishOption, setPublishOption] = useState<PublishOption>('draft')
	const [scheduleDate, setScheduleDate] = useState(new Date())
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [showPublishModal, setShowPublishModal] = useState(false)

	// Text formatting
	const [fontSize, setFontSize] = useState(16)
	const [selectedColor, setSelectedColor] = useState('#ffffff')
	const [editHistory, setEditHistory] = useState<string[]>([content])
	const [historyIndex, setHistoryIndex] = useState(0)
	const [selection, setSelection] = useState({ start: 0, end: 0 })

	const plainContent = content
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()

	const characterLimit = 2000
	const characterPercentage = Math.min(
		(plainContent.length / characterLimit) * 100,
		100,
	)
	const wordCount = plainContent ? plainContent.split(' ').length : 0

	const updateContentHistory = (newContent: string) => {
		const newHistory = editHistory.slice(0, historyIndex + 1)
		newHistory.push(newContent)
		setEditHistory(newHistory)
		setHistoryIndex(newHistory.length - 1)
		setContent(newContent)
	}

	const undo = () => {
		if (historyIndex > 0) {
			setHistoryIndex(historyIndex - 1)
			setContent(editHistory[historyIndex - 1])
		}
	}

	const redo = () => {
		if (historyIndex < editHistory.length - 1) {
			setHistoryIndex(historyIndex + 1)
			setContent(editHistory[historyIndex + 1])
		}
	}

	const applyFormatting = (prefix: string, suffix = prefix) => {
		const start = Math.min(selection.start, selection.end)
		const end = Math.max(selection.start, selection.end)

		if (start === end) {
			Alert.alert(
				'Select text first',
				'Highlight the word or sentence you want to format, then tap the toolbar button again.',
			)
			return
		}

		const before = content.slice(0, start)
		const selected = content.slice(start, end)
		const after = content.slice(end)
		const nextContent = `${before}${prefix}${selected}${suffix}${after}`
		updateContentHistory(nextContent)

		const cursor =
			before.length + prefix.length + selected.length + suffix.length
		setSelection({ start: cursor, end: cursor })
	}

	const applySizeToSelection = (nextSize: number) => {
		const start = Math.min(selection.start, selection.end)
		const end = Math.max(selection.start, selection.end)

		if (start === end) {
			setFontSize(nextSize)
			Alert.alert(
				'Select text first',
				'Highlight the word or sentence you want to resize, then tap the size control again.',
			)
			return
		}

		setFontSize(nextSize)
		const before = content.slice(0, start)
		const selected = content
			.slice(start, end)
			.replace(/\[size=\d+\]|\[\/size\]/g, '')
		const after = content.slice(end)
		const sizeStart = `[size=${nextSize}]`
		const sizeEnd = '[/size]'
		const nextContent = `${before}${sizeStart}${selected}${sizeEnd}${after}`
		updateContentHistory(nextContent)

		const cursor =
			before.length + sizeStart.length + selected.length + sizeEnd.length
		setSelection({ start: cursor, end: cursor })
	}

	const insertLink = () => {
		Alert.prompt(
			'Add Link',
			'Enter URL:',
			(url) => {
				if (url) {
					updateContentHistory(content + `\n🔗 ${url}`)
				}
			},
			'plain-text',
		)
	}

	const insertBulletList = () => {
		updateContentHistory(content + '\n• Item 1\n• Item 2\n• Item 3')
	}

	const insertNumberedList = () => {
		updateContentHistory(content + '\n1. Item 1\n2. Item 2\n3. Item 3')
	}

	const insertHeading = () => {
		updateContentHistory(content + '\n\n📌 HEADING\n')
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
									combineDateAndTime(selectedDate, selectedTime),
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

	const increaseFontSize = () => {
		if (fontSize < 28) applySizeToSelection(fontSize + 2)
	}

	const decreaseFontSize = () => {
		if (fontSize > 12) applySizeToSelection(fontSize - 2)
	}

	const handleAnalyze = async () => {
		if (!content) {
			Alert.alert('Error', 'Please write some content first')
			return
		}

		setIsAnalyzing(true)

		try {
			// TODO: Call AI API for content analysis
			// For now, simulate AI analysis
			await new Promise((resolve) => setTimeout(resolve, 1500))

			const score = Math.floor(Math.random() * 30) + 70 // Random score between 70-100
			setAiScore(score)
			setAiFeedback([
				'Strong opening that captures attention',
				`Consider adding a call-to-action`,
				'Good use of key insights',
			])
		} catch (error) {
			Alert.alert('Error', 'Failed to analyze content')
		} finally {
			setIsAnalyzing(false)
		}
	}

	const handlePublish = async () => {
		if (!title.trim()) {
			Alert.alert('Title required', 'Please add a title so you can find this post later.')
			return
		}

		if (!content) {
			Alert.alert('Error', 'Please write some content')
			return
		}

		if (!isAuthenticated) {
			Alert.alert('Error', 'Please login first')
			return
		}

		setIsSaving(true)
		try {
			const scheduleTime =
				publishOption === 'schedule' ? scheduleDate.toISOString() : null

			const postData = {
				title: title.trim(),
				content,
				hashtags: [],
				mediaUrls: [],
				scheduledAt: scheduleTime,
			}

			await api.posts.create(postData)

			Alert.alert(
				'Success',
				publishOption === 'draft'
					? 'Post saved as draft'
					: publishOption === 'schedule'
						? 'Post scheduled successfully'
						: 'Post published successfully',
			)
			router.back()
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to save post')
		} finally {
			setIsSaving(false)
			setShowPublishModal(false)
		}
	}

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			{/* Gradient Header */}
			<LinearGradient
				colors={['#0a192f', '#1a2f4f']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}
				style={styles.headerGradient}
			>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.headerButton}
					>
						<Text style={styles.closeButton}>← Back</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>✨ Create Content</Text>
					<TouchableOpacity
						onPress={() => console.log('Save draft')}
						style={styles.headerButton}
					>
						<Text style={styles.saveButton}>💾</Text>
					</TouchableOpacity>
				</View>
			</LinearGradient>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Title Section */}
				<View style={styles.card}>
					<Text style={styles.cardLabel}>📌 Title</Text>
					<TextInput
						style={styles.titleInput}
						placeholder='Add a catchy headline...'
						placeholderTextColor='rgba(255,255,255,0.4)'
						value={title}
						onChangeText={setTitle}
					/>
				</View>

				{/* Formatting Toolbar Card */}
				<View style={styles.card}>
					<Text style={styles.cardLabel}>🎨 Formatting Tools</Text>

					<View style={styles.toolbarRow}>
						<TouchableOpacity
							style={styles.toolButton}
							onPress={() => {
								if (fontSize > 1) {
									const next = (fontSize - 1) as
										| 1
										| 2
										| 3
										| 4
										| 5
										| 6
										| 7
									setFontSize((prev) => Math.max(1, prev - 1))
									editorRef.current?.setFontSize(next)
								}
							}}
						>
							<Text style={styles.toolIcon}>A</Text>
							<Text style={styles.toolSubtext}>-</Text>
						</TouchableOpacity>

						<View style={styles.fontSizeContainer}>
							<Text style={styles.fontSizeDisplay}>
								{fontSize}
							</Text>
						</View>

						<TouchableOpacity
							style={styles.toolButton}
							onPress={() => {
								if (fontSize < 7) {
									const next = (fontSize + 1) as
										| 1
										| 2
										| 3
										| 4
										| 5
										| 6
										| 7
									setFontSize((prev) => Math.min(7, prev + 1))
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
				</View>

				{/* Content Editor Card */}
				<View style={styles.card}>
					<Text style={styles.cardLabel}>✍️ Your Content</Text>
					<View style={styles.editorSection}>
						<RichEditor
							ref={editorRef}
							initialContentHTML={content || '<p></p>'}
							onChange={setContent}
							editorStyle={{
								backgroundColor: 'transparent',
								color: '#ffffff',
								caretColor: '#d4af37',
								placeholderColor: 'rgba(255,255,255,0.3)',
								contentCSSText:
									"font-size: 16px; line-height: 28px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #ffffff;",
							}}
							placeholder='Write your thoughts, insights, or ideas here...'
							useContainer={false}
							style={styles.richEditorInput}
						/>
					</View>

					<View style={styles.formatHintCompact}>
						<Text style={styles.formatHintCompactText}>
							Use the toolbar above to format selected text.
						</Text>
					</View>

					{/* Character Count Progress */}
					<View style={styles.statsContainer}>
						<View style={styles.progressBar}>
							<View
								style={[
									styles.progressFill,
									{
										width: `${characterPercentage}%`,
										backgroundColor:
											characterPercentage > 80
												? '#ff6b6b'
												: '#d4af37',
									},
								]}
							/>
						</View>
						<View style={styles.statsRow}>
							<Text style={styles.statText}>
								{plainContent.length}/{characterLimit} chars
							</Text>
							<Text style={styles.statText}>
								{wordCount} words
							</Text>
							<Text style={styles.readingTime}>
								~{Math.ceil(wordCount / 200)} min read
							</Text>
						</View>
					</View>
				</View>

				{/* AI Score Card */}
				{aiScore !== null && (
					<LinearGradient
						colors={['#1a1a2e', '#16213e']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.aiResultCard}
					>
						<View style={styles.scoreSection}>
							<View style={styles.scoreCircle}>
								<Text style={styles.scoreValue}>{aiScore}</Text>
								<Text style={styles.scoreMax}>/100</Text>
							</View>
							<View style={styles.scoreInfo}>
								<Text style={styles.scoreTitle}>
									AI Content Score
								</Text>
								<View style={styles.scoreBar}>
									<View
										style={[
											styles.scoreBarFill,
											{ width: `${aiScore}%` },
										]}
									/>
								</View>
								<Text style={styles.scoreQuality}>
									{aiScore >= 80
										? '🔥 Excellent'
										: aiScore >= 60
											? '👍 Good'
											: '🤔 Could be better'}
								</Text>
							</View>
						</View>

						<View style={styles.feedbackSection}>
							<Text style={styles.feedbackTitle}>
								💡 AI Suggestions
							</Text>
							{aiFeedback.map((feedback, index) => (
								<View key={index} style={styles.feedbackItem}>
									<Text style={styles.feedbackBullet}>→</Text>
									<Text style={styles.feedbackText}>
										{feedback}
									</Text>
								</View>
							))}
						</View>
					</LinearGradient>
				)}

				<View style={{ height: aiScore !== null ? 260 : 220 }} />
			</ScrollView>

			{/* Bottom Action Bar */}
			<LinearGradient
				colors={['rgba(10, 25, 47, 0)', '#0a192f']}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
				style={styles.bottomBar}
			>
				{aiScore === null ? (
					<TouchableOpacity
						style={[
							styles.analyzeButton,
							(!content || isAnalyzing) && styles.buttonDisabled,
						]}
						onPress={handleAnalyze}
						disabled={!content || isAnalyzing}
					>
						{isAnalyzing ? (
							<>
								<ActivityIndicator
									color='#0a192f'
									size='small'
								/>
								<Text style={styles.analyzeButtonText}>
									{' '}
									Analyzing...
								</Text>
							</>
						) : (
							<Text style={styles.analyzeButtonText}>
								🤖 Get AI Feedback
							</Text>
						)}
					</TouchableOpacity>
				) : (
					<TouchableOpacity
						style={styles.publishOptionsButton}
						onPress={() => setShowPublishModal(true)}
					>
						<Text style={styles.publishOptionsText}>
							✅ Ready to Publish →
						</Text>
					</TouchableOpacity>
				)}
			</LinearGradient>

			{/* Publish Options Modal */}
			<Modal
				visible={showPublishModal}
				transparent
				animationType='slide'
				onRequestClose={() => setShowPublishModal(false)}
			>
				<View style={styles.modalOverlay}>
					<LinearGradient
						colors={['#ffffff', '#f5f5f5']}
						start={{ x: 0, y: 0 }}
						end={{ x: 0, y: 1 }}
						style={styles.modalContent}
					>
						<Text style={styles.modalTitle}>
							📤 How would you like to publish?
						</Text>

						{/* Immediate */}
						<TouchableOpacity
							style={[
								styles.option,
								publishOption === 'immediate' &&
									styles.optionSelected,
							]}
							onPress={() => setPublishOption('immediate')}
						>
							<View style={styles.optionLeft}>
								<Text style={styles.optionIcon}>⚡</Text>
								<View>
									<Text style={styles.optionTitle}>
										Publish Immediately
									</Text>
									<Text style={styles.optionDesc}>
										Go live right now
									</Text>
								</View>
							</View>
							<View
								style={[
									styles.radioButton,
									publishOption === 'immediate' &&
										styles.radioButtonActive,
								]}
							>
								{publishOption === 'immediate' && (
									<View style={styles.radioDot} />
								)}
							</View>
						</TouchableOpacity>

						{/* Schedule */}
						<TouchableOpacity
							style={[
								styles.option,
								publishOption === 'schedule' &&
									styles.optionSelected,
							]}
							onPress={() => {
								setPublishOption('schedule')
								openScheduleDatePicker()
							}}
						>
							<View style={styles.optionLeft}>
								<Text style={styles.optionIcon}>📅</Text>
								<View>
									<Text style={styles.optionTitle}>
										Schedule for Later
									</Text>
									<Text style={styles.optionDesc}>
										{publishOption === 'schedule'
											? scheduleDate.toLocaleString()
											: 'Pick a date & time'}
									</Text>
								</View>
							</View>
							<View
								style={[
									styles.radioButton,
									publishOption === 'schedule' &&
										styles.radioButtonActive,
								]}
							>
								{publishOption === 'schedule' && (
									<View style={styles.radioDot} />
								)}
							</View>
						</TouchableOpacity>

						{/* Draft */}
						<TouchableOpacity
							style={[
								styles.option,
								publishOption === 'draft' &&
									styles.optionSelected,
							]}
							onPress={() => setPublishOption('draft')}
						>
							<View style={styles.optionLeft}>
								<Text style={styles.optionIcon}>📝</Text>
								<View>
									<Text style={styles.optionTitle}>
										Save as Draft
									</Text>
									<Text style={styles.optionDesc}>
										Edit and publish later
									</Text>
								</View>
							</View>
							<View
								style={[
									styles.radioButton,
									publishOption === 'draft' &&
										styles.radioButtonActive,
								]}
							>
								{publishOption === 'draft' && (
									<View style={styles.radioDot} />
								)}
							</View>
						</TouchableOpacity>

						{/* Action Buttons */}
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
										color='#0a192f'
										size='small'
									/>
								) : (
									<Text style={styles.confirmText}>
										Confirm & Publish
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</LinearGradient>
				</View>
			</Modal>

			{/* Date Picker */}
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
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0a192f',
	},
	headerGradient: {
		paddingTop: 30,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(212,175,55,0.2)',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	headerButton: {
		padding: 8,
	},
	closeButton: {
		fontSize: 16,
		color: '#ffffff',
		fontWeight: '600',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#d4af37',
		letterSpacing: 0.5,
	},
	saveButton: {
		fontSize: 20,
	},

	// Cards
	card: {
		marginHorizontal: 16,
		marginVertical: 12,
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.2)',
	},
	cardLabel: {
		fontSize: 13,
		fontWeight: '700',
		color: '#d4af37',
		letterSpacing: 0.5,
		marginBottom: 12,
		textTransform: 'uppercase',
	},
	scrollContent: {
		paddingBottom: 220,
	},

	// Title
	titleInput: {
		fontSize: 18,
		fontWeight: '700',
		color: '#ffffff',
		paddingVertical: 8,
	},

	// Toolbar
	toolbarRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	toolbarGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 12,
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
	toolbarSecondRow: {
		marginTop: 8,
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
	toolButtonActive: {
		backgroundColor: '#d4af37',
		borderColor: '#d4af37',
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
	toolDivider: {
		width: 1,
		height: 24,
		backgroundColor: 'rgba(212,175,55,0.2)',
		marginRight: 8,
	},

	// Editor
	editorSection: {
		minHeight: 320,
		paddingVertical: 8,
	},
	richEditorInput: {
		minHeight: 280,
	},
	formatHint: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		marginTop: 12,
		padding: 12,
		borderRadius: 12,
		backgroundColor: 'rgba(212,175,55,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.15)',
	},
	formatHintText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 18,
		color: 'rgba(255,255,255,0.75)',
		fontWeight: '500',
	},
	formatHintCompact: {
		marginTop: 12,
		paddingHorizontal: 4,
	},
	formatHintCompactText: {
		fontSize: 12,
		lineHeight: 18,
		color: 'rgba(255,255,255,0.55)',
	},

	// Stats
	statsContainer: {
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: 'rgba(212,175,55,0.2)',
	},
	progressBar: {
		height: 6,
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderRadius: 3,
		overflow: 'hidden',
		marginBottom: 12,
	},
	progressFill: {
		height: '100%',
		borderRadius: 3,
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	statText: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.6)',
		fontWeight: '500',
	},
	readingTime: {
		fontSize: 12,
		color: '#d4af37',
		fontWeight: '600',
	},

	// AI Results
	aiResultCard: {
		marginHorizontal: 16,
		borderRadius: 16,
		padding: 20,
		marginTop: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.3)',
	},
	scoreSection: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
		paddingBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(212,175,55,0.2)',
	},
	scoreCircle: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: 'rgba(212,175,55,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	scoreValue: {
		fontSize: 40,
		fontWeight: '800',
		color: '#d4af37',
	},
	scoreMax: {
		fontSize: 14,
		fontWeight: '600',
		color: 'rgba(212,175,55,0.8)',
	},
	scoreInfo: {
		flex: 1,
	},
	scoreTitle: {
		fontSize: 13,
		fontWeight: '700',
		color: 'rgba(255,255,255,0.8)',
		letterSpacing: 0.5,
		marginBottom: 8,
	},
	scoreBar: {
		height: 4,
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderRadius: 2,
		overflow: 'hidden',
		marginBottom: 8,
	},
	scoreBarFill: {
		height: '100%',
		backgroundColor: '#d4af37',
		borderRadius: 2,
	},
	scoreQuality: {
		fontSize: 13,
		fontWeight: '600',
		color: '#d4af37',
	},
	feedbackSection: {
		marginTop: 0,
	},
	feedbackTitle: {
		fontSize: 15,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 12,
	},
	feedbackItem: {
		flexDirection: 'row',
		marginBottom: 10,
		alignItems: 'flex-start',
	},
	feedbackBullet: {
		fontSize: 14,
		color: '#d4af37',
		marginRight: 10,
		fontWeight: '700',
		marginTop: 1,
	},
	feedbackText: {
		fontSize: 13,
		color: 'rgba(255,255,255,0.8)',
		lineHeight: 18,
		flex: 1,
	},

	// Bottom Bar
	bottomBar: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 32,
		borderTopWidth: 1,
		borderTopColor: 'rgba(212,175,55,0.1)',
	},
	analyzeButton: {
		backgroundColor: '#d4af37',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
		shadowColor: '#d4af37',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	analyzeButtonText: {
		color: '#0a192f',
		fontSize: 15,
		fontWeight: '700',
	},
	buttonDisabled: {
		backgroundColor: 'rgba(212,175,55,0.4)',
	},
	publishOptionsButton: {
		backgroundColor: '#d4af37',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		shadowColor: '#d4af37',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	publishOptionsText: {
		color: '#0a192f',
		fontSize: 15,
		fontWeight: '700',
	},

	// Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
		paddingBottom: 40,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#0a192f',
		marginBottom: 20,
	},
	option: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		backgroundColor: '#F5F5F5',
		marginBottom: 12,
		borderWidth: 2,
		borderColor: 'transparent',
	},
	optionSelected: {
		borderColor: '#d4af37',
		backgroundColor: 'rgba(212,175,55,0.08)',
	},
	optionLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	optionIcon: {
		fontSize: 28,
		marginRight: 16,
	},
	optionTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#0a192f',
		marginBottom: 4,
	},
	optionDesc: {
		fontSize: 13,
		color: '#666',
	},
	radioButton: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#d4af37',
		justifyContent: 'center',
		alignItems: 'center',
	},
	radioButtonActive: {
		borderColor: '#d4af37',
	},
	radioDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: '#d4af37',
	},
	checkmark: {
		fontSize: 20,
		color: '#d4af37',
		fontWeight: '800',
	},
	modalActions: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 24,
	},
	cancelButton: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		backgroundColor: '#E8E8E8',
	},
	cancelText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#666',
	},
	confirmButton: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		backgroundColor: '#d4af37',
	},
	confirmText: {
		fontSize: 15,
		fontWeight: '700',
		color: '#0a192f',
	},
})
