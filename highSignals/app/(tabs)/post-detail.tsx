import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
	Keyboard,
	Dimensions,
	useWindowDimensions,
} from 'react-native'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MIN_EDITOR_HEIGHT = Math.max(400, SCREEN_HEIGHT - 320)
import DateTimePicker, {
	DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { RichEditor, actions } from 'react-native-pell-rich-editor'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import RecordingModal from './components/RecordingModal'





const TOOLBAR_HEIGHT = 52
// Padding inside the editor body so the cursor never sits flush against
// the bottom — scrollToEnd then reliably parks the cursor above the toolbar.
const EDITOR_BOTTOM_PADDING = 360

interface Post {
	id: string
	title?: string
	content: string
	status: string
	platforms?: string[]
	hashtags?: string[]
	mediaUrls?: string[]
	createdAt: string
	updatedAt?: string
	scheduledAt?: string | null
	publishedAt?: string | null
}

const COLOR_SWATCHES = [
	'#163354',
	'#1D4A79',
	'#D4AF37',
	'#64748B',
	'#EF4444',
	'#F97316',
	'#FACC15',
	'#10B981',
	'#3B82F6',
	'#8B5CF6',
	'#EC4899',
]

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
	const { colors, theme } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	const router = useRouter()
	const { postId } = useLocalSearchParams()
	const { isAuthenticated } = useAuth()
	const editorRef = useRef<RichEditor>(null)
	const scrollRef = useRef<ScrollView>(null)
	const insets = useSafeAreaInsets()
	const [editorHeight, setEditorHeight] = useState(MIN_EDITOR_HEIGHT)
	const [viewHeight, setViewHeight] = useState(500)
	const [post, setPost] = useState<Post | null>(null)
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [editedPost, setEditedPost] = useState<Post | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [scheduleDate, setScheduleDate] = useState(new Date())
	const [showColors, setShowColors] = useState(false)
	const [showRecordingModal, setShowRecordingModal] = useState(false)
	const [keyboardHeight, setKeyboardHeight] = useState(0)
	const kbHeight = Platform.OS === 'ios' ? keyboardHeight : 0
	const [showStatusPicker, setShowStatusPicker] = useState(false)

	const { height: windowHeight } = useWindowDimensions()
	const maxWindowHeightRef = useRef(windowHeight)

	if (keyboardHeight === 0 && windowHeight > maxWindowHeightRef.current) {
		maxWindowHeightRef.current = windowHeight
	}

	const keyboardActive = keyboardHeight > 0
	const viewportShrunk = keyboardActive && (windowHeight < maxWindowHeightRef.current - 80)
	const bottomPadding = Platform.OS === 'ios' ? (keyboardActive && !viewportShrunk ? keyboardHeight : 0) : 0

	type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
	const inFlightRef = useRef(false)
	const pendingRef = useRef(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastSavedSnapshotRef = useRef<string>('')

	useEffect(() => {
		if (!isAuthenticated || !postId) return
		fetchPost()
	}, [postId, isAuthenticated])

	useEffect(() => {
		if (!isEditing) {
			setKeyboardHeight(0)
			return
		}
		const showEvent =
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
		const hideEvent =
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
		const showSub = Keyboard.addListener(showEvent, (e) => {
			setKeyboardHeight(e.endCoordinates?.height ?? 0)
		})
		const hideSub = Keyboard.addListener(hideEvent, () => {
			setKeyboardHeight(0)
		})
		return () => {
			showSub.remove()
			hideSub.remove()
		}
	}, [isEditing])

	const fetchPost = async () => {
		try {
			setLoading(true)
			const allPosts = await api.posts.getAll()
			const foundPost = allPosts.find((p: Post) => p.id === postId)
			if (foundPost) {
				setPost(foundPost)
				setEditedPost(foundPost)
				lastSavedSnapshotRef.current = JSON.stringify({
					title: foundPost.title || '',
					content: foundPost.content || '',
					status: foundPost.status,
					scheduledAt: foundPost.scheduledAt || null,
				})
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

	const performAutoSave = useCallback(async () => {
		if (!editedPost) return
		const snapshot = JSON.stringify({
			title: editedPost.title || '',
			content: editedPost.content || '',
			status: editedPost.status,
			scheduledAt: editedPost.scheduledAt || null,
		})
		if (snapshot === lastSavedSnapshotRef.current) return

		const plainText = (editedPost.content || '')
			.replace(/<[^>]+>/g, '')
			.replace(/&nbsp;/g, '')
			.trim()
		if (!plainText && !(editedPost.title || '').trim()) return

		if (inFlightRef.current) {
			pendingRef.current = true
			return
		}
		inFlightRef.current = true
		setSaveStatus('saving')
		try {
			await api.posts.update(editedPost.id, {
				title: editedPost.title,
				content: editedPost.content,
				status: editedPost.status,
				scheduledAt:
					editedPost.status === 'SCHEDULED'
						? scheduleDate.toISOString()
						: null,
			})
			lastSavedSnapshotRef.current = snapshot
			setPost(editedPost)
			setSaveStatus('saved')
		} catch (err) {
			console.warn('autosave failed', err)
			setSaveStatus('error')
		} finally {
			inFlightRef.current = false
			if (pendingRef.current) {
				pendingRef.current = false
				performAutoSave()
			}
		}
	}, [editedPost, scheduleDate])

	useEffect(() => {
		if (!isEditing) return
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			performAutoSave()
		}, 1500)
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [
		isEditing,
		editedPost?.title,
		editedPost?.content,
		editedPost?.status,
		editedPost?.scheduledAt,
		performAutoSave,
	])

	const handleSaveChanges = async () => {
		if (!editedPost) return
		try {
			setIsSaving(true)
			await api.posts.update(editedPost.id, {
				title: editedPost.title,
				content: editedPost.content,
				status: editedPost.status,
				scheduledAt:
					editedPost.status === 'SCHEDULED'
						? scheduleDate.toISOString()
						: null,
			})
			lastSavedSnapshotRef.current = JSON.stringify({
				title: editedPost.title || '',
				content: editedPost.content || '',
				status: editedPost.status,
				scheduledAt: editedPost.scheduledAt || null,
			})
			setPost(editedPost)
			setIsEditing(false)
		} catch (error: any) {
			console.error('Error saving post:', error)
			Alert.alert('Error', error?.message || 'Failed to update post')
		} finally {
			setIsSaving(false)
		}
	}

	const handleDeletePost = () => {
		Alert.alert(
			'Delete Post',
			'Are you sure you want to delete this post?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							setIsSaving(true)
							await api.posts.delete(post!.id)
							router.back()
						} catch (error) {
							console.error('Error deleting post:', error)
							Alert.alert('Error', 'Failed to delete post')
						} finally {
							setIsSaving(false)
						}
					},
				},
			],
		)
	}
	const getStatusColor = (status: string) => {
		const statusColorsMap: { [key: string]: string } = {
			IDEA: colors.ideaText,
			SCRIPTING: colors.scriptingText,
			DRAFT: colors.scriptingText,
			RECORDING: colors.recordingText,
			EDITING: colors.editingText,
			SCHEDULED: colors.editingText,
			POSTED: colors.postedText,
			PUBLISHED: colors.postedText,
		}
		return statusColorsMap[status] || colors.text
	}

	const getStatusLabel = (status: string) => {
		const labels: { [key: string]: string } = {
			IDEA: 'IDEA',
			SCRIPTING: 'SCRIPTING',
			DRAFT: 'SCRIPTING',
			RECORDING: 'RECORDING',
			EDITING: 'EDITING',
			SCHEDULED: 'EDITING',
			POSTED: 'POSTED',
			PUBLISHED: 'POSTED',
		}
		return labels[status] || status
	}

	const displayPost = isEditing ? editedPost : post
	const statusColor = useMemo(
		() => getStatusColor(displayPost?.status || ''),
		[displayPost?.status],
	)

	const sendAction = (actionName: string, param?: string) => {
		editorRef.current?.sendAction(actionName, 'result', param)
	}

	// --- Live voice dictation into the editor ---------------------------------
	// Interim transcripts render in a grey placeholder span pinned to the end of
	// the content; a final phrase replaces it with permanent text so the editor's
	// `input` event fires and onChange picks it up. Mirrors create-post.tsx.

	const updateInterimText = useCallback((text: string) => {
		const safe = text
			.replace(/\\/g, '\\\\')
			.replace(/'/g, "\\'")
			.replace(/\n/g, ' ')
		const js = `
		(function(){
		  var ed = document.querySelector('.pell-content');
		  if (!ed) return;
		  var span = document.getElementById('__interim');
		  if (!span) {
		    span = document.createElement('span');
		    span.id = '__interim';
		    span.setAttribute('style','color:#8E9BAE;font-style:italic;');
		    ed.appendChild(span);
		  }
		  span.textContent = '${safe}';
		})();
		true;
		`
		editorRef.current?.commandDOM(js)
	}, [])

	// Mark the start of a dictation session. If the editor already holds text,
	// the first committed phrase begins on a new line so voice input doesn't run
	// into existing content. Decision resolved at commit time in the WebView.
	const beginVoiceSession = useCallback(() => {
		const js = `
		(function(){
		  var ed = document.querySelector('.pell-content');
		  if (!ed) return;
		  var span = document.getElementById('__interim');
		  if (span) span.remove();
		  var hasText = ed.textContent.replace(/\\u00a0|\\s/g,'').length > 0;
		  window.__voiceNewline = hasText;
		})();
		true;
		`
		editorRef.current?.commandDOM(js)
	}, [])

	const commitFinalText = useCallback((text: string) => {
		const safe = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
		const js = `
		(function(){
		  var ed = document.querySelector('.pell-content');
		  if (!ed) return;
		  var span = document.getElementById('__interim');
		  if (span) span.parentNode && span.parentNode.removeChild(span);
		  ed.focus();
		  var range = document.createRange();
		  range.selectNodeContents(ed);
		  range.collapse(false);
		  var sel = window.getSelection();
		  sel.removeAllRanges();
		  sel.addRange(range);
		  if (window.__voiceNewline) {
		    document.execCommand('insertParagraph');
		    window.__voiceNewline = false;
		  }
		  document.execCommand('insertText', false, '${safe} ');
		  ed.dispatchEvent(new Event('input', { bubbles: true }));
		})();
		true;
		`
		editorRef.current?.commandDOM(js)
	}, [])

	const clearInterimText = useCallback(() => {
		const js = `
		(function(){
		  var span = document.getElementById('__interim');
		  if (span && span.parentNode) span.parentNode.removeChild(span);
		})();
		true;
		`
		editorRef.current?.commandDOM(js)
	}, [])

	const insertDivider = () => {
		editorRef.current?.insertHTML('<hr />')
	}

	const installChecklistExitHandler = () => {
		const js = `
		(function(){
		  if (window.__checklistExitInstalled) return;
		  window.__checklistExitInstalled = true;
		  var ed = document.querySelector('.pell-content') || document.body;
		  function getCheckboxLi(node){
		    while (node && node !== ed){
		      if (node.nodeType === 1 && node.tagName === 'LI' && node.querySelector('input[type="checkbox"]')) return node;
		      node = node.parentNode;
		    }
		    return null;
		  }
		  function liIsEmpty(li){
		    var clone = li.cloneNode(true);
		    var cb = clone.querySelector('input[type="checkbox"]');
		    if (cb) cb.remove();
		    return clone.textContent.replace(/\\u00a0|\\s/g,'') === '';
		  }
		  function exitChecklist(li){
		    var ul = li.parentNode;
		    var p = document.createElement('div');
		    p.innerHTML = '<br/>';
		    if (li.nextSibling){
		      var newUl = ul.cloneNode(false);
		      var n = li.nextSibling;
		      while (n){ var nx = n.nextSibling; newUl.appendChild(n); n = nx; }
		      ul.parentNode.insertBefore(p, ul.nextSibling);
		      p.parentNode.insertBefore(newUl, p.nextSibling);
		    } else {
		      ul.parentNode.insertBefore(p, ul.nextSibling);
		    }
		    li.remove();
		    if (!ul.children.length) ul.remove();
		    var range = document.createRange();
		    range.setStart(p, 0); range.collapse(true);
		    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
		  }
		  ed.addEventListener('keydown', function(e){
		    var sel = window.getSelection();
		    if (!sel || !sel.rangeCount) return;
		    var node = sel.anchorNode;
		    var li = getCheckboxLi(node);
		    if (!li) return;
		    if (e.key === 'Enter' && liIsEmpty(li)){
		      e.preventDefault();
		      exitChecklist(li);
		    } else if (e.key === 'Backspace' && liIsEmpty(li)){
		      e.preventDefault();
		      exitChecklist(li);
		    }
		  }, true);

		  // --- FLOATING TOOLBAR INJECTION ---
		  if (!window.__floatingToolbarInstalled) {
		    window.__floatingToolbarInstalled = true;
		    
		    var style = document.createElement('style');
		    style.innerHTML = \`
		      .floating-toolbar {
		        position: absolute;
		        display: none;
		        background: rgba(250, 247, 242, 0.98);
		        border: 1.5px solid #EADBCE;
		        border-radius: 10px;
		        padding: 4px;
		        z-index: 99999;
		        box-shadow: 0 4px 16px rgba(22, 51, 84, 0.12);
		        flex-direction: row;
		        align-items: center;
		        gap: 2px;
		        pointer-events: auto;
		        backdrop-filter: blur(10px);
		        transition: opacity 0.15s ease;
		        opacity: 0;
		      }
		      .floating-toolbar.active {
		        display: flex;
		        opacity: 1;
		      }
		      .floating-btn {
		        background: transparent;
		        border: none;
		        color: ${colors.text};
		        padding: 6px 10px;
		        font-size: 13px;
		        font-weight: bold;
		        border-radius: 6px;
		        cursor: pointer;
		        display: flex;
		        align-items: center;
		        justify-content: center;
		        min-width: 30px;
		        height: 30px;
		        outline: none;
		      }
		      .floating-btn:active, .floating-btn.active {
		        background: #EBDCB9;
		        color: ${colors.text};
		      }
		      .floating-divider {
		        width: 1px;
		        height: 18px;
		        background: #EADBCE;
		        margin: 0 4px;
		      }
		    \`;
		    document.head.appendChild(style);
		    
		    var toolbar = document.createElement('div');
		    toolbar.className = 'floating-toolbar';
		    
		    var buttons = [
		      { label: 'B', cmd: 'bold', style: 'font-weight: 900;' },
		      { label: 'I', cmd: 'italic', style: 'font-style: italic;' },
		      { label: 'U', cmd: 'underline', style: 'text-decoration: underline;' },
		      { label: 'S', cmd: 'strikeThrough', style: 'text-decoration: line-through;' },
		      { divider: true },
		      { label: 'H1', cmd: 'formatBlock', val: '<h1>' },
		      { label: 'H2', cmd: 'formatBlock', val: '<h2>' }
		    ];
		    
		    buttons.forEach(function(b) {
		      if (b.divider) {
		        var d = document.createElement('div');
		        d.className = 'floating-divider';
		        toolbar.appendChild(d);
		        return;
		      }
		      var btn = document.createElement('button');
		      btn.className = 'floating-btn';
		      btn.innerHTML = b.label;
		      if (b.style) btn.setAttribute('style', b.style);
		      
		      btn.addEventListener('mousedown', function(e) {
		        e.preventDefault();
		        document.execCommand(b.cmd, false, b.val || null);
		        var ed = document.querySelector('.pell-content');
		        if (ed) ed.dispatchEvent(new Event('input', { bubbles: true }));
		        setTimeout(updatePosition, 10);
		      });
		      toolbar.appendChild(btn);
		    });
		    
		    document.body.appendChild(toolbar);
		    
		    function updatePosition() {
		      var sel = window.getSelection();
		      if (!sel || sel.rangeCount === 0 || sel.toString().trim() === '') {
		        toolbar.classList.remove('active');
		        return;
		      }
		      var range = sel.getRangeAt(0);
		      var rect = range.getBoundingClientRect();
		      if (rect.width === 0 || rect.height === 0) {
		        toolbar.classList.remove('active');
		        return;
		      }
		      
		      var toolbarWidth = toolbar.offsetWidth || 240;
		      var toolbarHeight = toolbar.offsetHeight || 38;
		      var gap = 30;

		      var absoluteLeft = rect.left + (rect.width / 2) - (toolbarWidth / 2) + window.pageXOffset;
		      var absoluteTop = rect.bottom + window.pageYOffset + gap;

		      if (absoluteLeft < 8) absoluteLeft = 8;
		      if (absoluteLeft + toolbarWidth > window.innerWidth - 8) {
		        absoluteLeft = window.innerWidth - toolbarWidth - 8;
		      }
		      if (rect.bottom + gap + toolbarHeight > window.innerHeight - 8) {
		        absoluteTop = rect.top + window.pageYOffset - toolbarHeight - gap;
		      }

		      toolbar.style.left = absoluteLeft + 'px';
		      toolbar.style.top = absoluteTop + 'px';
		      toolbar.classList.add('active');
		    }
		    
		    document.addEventListener('selectionchange', function() {
		      setTimeout(updatePosition, 50);
		    });
		    
		    document.addEventListener('mousedown', function(e) {
		      if (!toolbar.contains(e.target)) {
		        setTimeout(updatePosition, 100);
		      }
		    });
		  }
		})();
		true;
		`
		editorRef.current?.commandDOM(js)
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
								status: 'EDITING',
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
		if (!editedPost) return
		setShowStatusPicker(false)
		setEditedPost({ ...editedPost, status })
	}

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color={colors.gold} />
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
						color={colors.textSubtle}
					/>
					<Text style={styles.errorText}>Post not found</Text>
				</View>
			</View>
		)
	}

	// EDIT MODE — full-page editor with floating toolbar
	if (isEditing && editedPost) {
		return (
			<View style={[styles.container, { paddingBottom: bottomPadding }]}>
				<View style={styles.editHeader}>
					<TouchableOpacity
						onPress={() => {
							setEditedPost(post)
							setIsEditing(false)
						}}
						style={styles.headerIconBtn}
					>
						<Ionicons name='close' size={24} color={colors.primaryIcon} />
					</TouchableOpacity>

					<View style={styles.headerCenter}>
						<TouchableOpacity
							onPress={() => setShowStatusPicker(true)}
						>
							<Text
								style={[
									styles.statusInline,
									{ color: statusColor },
								]}
							>
								{getStatusLabel(editedPost.status)}{' '}
								<Ionicons
									name='chevron-down'
									size={11}
									color={statusColor}
								/>
							</Text>
						</TouchableOpacity>
						{saveStatus !== 'idle' && (
							<Text
								style={[
									styles.saveLabel,
									saveStatus === 'error' &&
										styles.saveLabelError,
								]}
							>
								{saveStatus === 'saving'
									? 'Saving…'
									: saveStatus === 'saved'
										? 'Saved'
										: 'Save failed'}
							</Text>
						)}
					</View>

					<View style={styles.headerRight}>
						<TouchableOpacity
							onPress={() => setShowRecordingModal(true)}
							style={styles.headerIconBtn}
						>
							<Ionicons name='mic-outline' size={22} color={colors.primaryIcon}
							/>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleSaveChanges}
							disabled={isSaving}
							style={styles.headerIconBtn}
						>
							{isSaving ? (
								<ActivityIndicator color={colors.gold} />
							) : (
								<Ionicons
									name='checkmark'
									size={24}
									color={colors.gold}
								/>
							)}
						</TouchableOpacity>
					</View>
				</View>

					<TextInput
						style={styles.titleInput}
						value={editedPost.title || ''}
						onChangeText={(text) =>
							setEditedPost({ ...editedPost, title: text })
						}
						placeholder='Title'
						placeholderTextColor={colors.textSubtle}
					/>

					<ScrollView
						ref={scrollRef}
						style={styles.editorScroll}
						contentContainerStyle={{
							flexGrow: 1,
							paddingBottom: keyboardActive ? 150 : 40,
						}}
						keyboardShouldPersistTaps='handled'
					>
						<RichEditor
							ref={editorRef}
							key={`edit-${post.id}-${post.updatedAt || ''}`}
							initialContentHTML={normalizeHtmlContent(
								editedPost.content,
							)}
							editorInitializedCallback={installChecklistExitHandler}
							onChange={(html) =>
								setEditedPost({ ...editedPost, content: html })
							}
							onCursorPosition={(scrollY) => {
								scrollRef.current?.scrollTo({
									y: Math.max(0, scrollY - 120),
									animated: true,
								})
							}}
							onHeightChange={(h) => {
								if (h && h > 0) {
									setEditorHeight(Math.max(h, MIN_EDITOR_HEIGHT))
								}
							}}
							editorStyle={{
								backgroundColor: colors.background,
								color: colors.text,
								caretColor: colors.navyLight,
								placeholderColor: colors.textSubtle,
								contentCSSText: `font-size: 17px; line-height: 28px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${colors.text}; padding: 8px 18px ${EDITOR_BOTTOM_PADDING}px 18px; margin: 0; } input[type="checkbox"] { accent-color: ${colors.navyLight}; margin-right: 8px; transform: scale(1.15); vertical-align: middle; } .dummy-todo {`,
							}}
							placeholder='Start writing…'
							useContainer={false}
							initialHeight={MIN_EDITOR_HEIGHT}
							style={[styles.richEditor, { height: editorHeight }]}
						/>
					</ScrollView>

					<View style={[styles.floatingDock, { paddingBottom: keyboardActive ? 0 : (insets.bottom ?? 0) }]}>
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
							onPress={() =>
								sendAction(actions.insertBulletsList)
							}
						/>
						<ToolbarIcon
							name='list-circle-outline'
							onPress={() =>
								sendAction(actions.insertOrderedList)
							}
						/>
						<ToolbarIcon
							name='remove-outline'
							onPress={insertDivider}
						/>
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

				<RecordingModal
					visible={showRecordingModal}
					onClose={() => {
						clearInterimText()
						setShowRecordingModal(false)
					}}
					onLiveTranscript={updateInterimText}
					onFinalText={commitFinalText}
					onSessionStart={beginVoiceSession}
				/>

				<Modal
					visible={showStatusPicker}
					transparent
					animationType='fade'
					onRequestClose={() => setShowStatusPicker(false)}
				>
					<TouchableOpacity
						style={styles.modalOverlay}
						onPress={() => setShowStatusPicker(false)}
						activeOpacity={1}
					>
						<View style={styles.pickerSheet}>
							<Text style={styles.pickerTitle}>
								Update status
							</Text>
							{['IDEA', 'SCRIPTING', 'RECORDING', 'EDITING', 'POSTED'].map((s) => (
								<TouchableOpacity
									key={s}
									style={styles.pickerOption}
									onPress={() => chooseStatus(s)}
								>
									<View
										style={[
											styles.pickerDot,
											{
												backgroundColor:
													getStatusColor(s),
											},
										]}
									/>
									<Text style={styles.pickerOptionText}>
										{getStatusLabel(s)}
									</Text>
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
									status: 'EDITING',
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

	// VIEW MODE — clean reader (Screens 6 & bottom-left)
	return (
		<View style={styles.container}>
			<View style={styles.viewHeader}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.headerIconBtn}
				>
					<Ionicons name='arrow-back' size={22} color={colors.primaryIcon} />
				</TouchableOpacity>

				<View style={styles.headerCenter}>
					<View style={styles.statusBadgePill}>
						<Text style={[styles.statusInline, { color: statusColor }]}>
							{getStatusLabel(displayPost?.status || '')}
						</Text>
					</View>
				</View>

				<TouchableOpacity
					onPress={() => {
						setEditedPost(post)
						setIsEditing(true)
					}}
					style={styles.headerIconBtn}
				>
					<Ionicons name='create-outline' size={22} color={colors.primaryIcon} />
				</TouchableOpacity>
			</View>

			<View style={styles.viewTitleBlock}>
				<Text style={styles.viewTitle}>
					{displayPost?.title || 'Untitled Post'}
				</Text>
				<Text style={styles.viewMeta}>
					{displayPost?.scheduledAt
						? `Scheduled for ${new Date(displayPost.scheduledAt).toLocaleString()}`
						: displayPost?.publishedAt
							? `Posted ${new Date(displayPost.publishedAt).toLocaleString()}`
							: `Created ${new Date(displayPost!.createdAt).toLocaleDateString()}`}
				</Text>
			</View>

			<ScrollView
				style={styles.viewBodyFull}
				contentContainerStyle={styles.viewBodyContent}
				showsVerticalScrollIndicator={false}
			>
				<RichEditor
					key={`view-${post.id}-${post.updatedAt || ''}`}
					disabled
					initialContentHTML={normalizeHtmlContent(
						displayPost?.content,
					)}
					onHeightChange={(h) => {
						if (h && h > 0) setViewHeight(Math.max(h, 200))
					}}
					editorStyle={{
						backgroundColor: colors.background,
						color: colors.text,
						contentCSSText: `font-size: 16px; line-height: 26px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${colors.text}; padding: 0 20px 24px 20px; margin: 0; } input[type="checkbox"] { accent-color: ${colors.navyLight}; margin-right: 8px; transform: scale(1.15); vertical-align: middle; } .dummy-todo {`,
					}}
					useContainer={false}
					initialHeight={500}
					style={[styles.readOnlyEditorFull, { height: viewHeight }]}
				/>
			</ScrollView>

			<View style={styles.deleteBar}>
				<TouchableOpacity
					style={styles.deleteButton}
					onPress={handleDeletePost}
					disabled={isSaving}
				>
					<Ionicons name='trash-outline' size={18} color={colors.error} />
					<Text style={styles.deleteButtonText}>Delete post</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

function ToolbarIcon({ name, onPress }: { name: keyof typeof Ionicons.glyphMap, onPress: () => void }) {
	const { colors } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	return (
		<TouchableOpacity onPress={onPress} style={styles.toolBtn}>
			<Ionicons name={name} size={20} color={colors.primaryIcon} />
		</TouchableOpacity>
	)
}

function ToolbarText({ label, onPress }: { label: string, onPress: () => void }) {
	const { colors } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	return (
		<TouchableOpacity onPress={onPress} style={styles.toolBtn}>
			<Text style={styles.toolBtnLabel}>{label}</Text>
		</TouchableOpacity>
	)
}

function ToolbarStyled({ label, textStyle, onPress }: { label: string, textStyle: any, onPress: () => void }) {
	const { colors } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	return (
		<TouchableOpacity onPress={onPress} style={styles.toolBtn}>
			<Text style={[styles.toolBtnLabel, textStyle]}>{label}</Text>
		</TouchableOpacity>
	)
}

function Divider() {
	const { colors } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	return <View style={styles.toolDivider} />
}

const getStyles = (colors: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
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
		color: colors.error,
		fontSize: 16,
		textAlign: 'center',
		marginTop: 16,
		fontWeight: '700',
	},
	viewHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	editHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	headerCenter: {
		flex: 1,
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: colors.text,
	},
	statusBadgePill: {
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: 8,
		backgroundColor: colors.surfaceCard,
	},
	statusInline: {
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.7,
	},
	saveLabel: {
		fontSize: 11,
		color: colors.textSubtle,
		marginTop: 2,
	},
	saveLabelError: {
		color: colors.error,
	},
	headerIconBtn: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	viewTitleBlock: {
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 8,
		width: '100%',
		maxWidth: 800,
		alignSelf: 'center',
	},
	viewTitle: {
		fontSize: 26,
		lineHeight: 32,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 4,
	},
	viewMeta: {
		fontSize: 12,
		color: colors.textSubtle,
		fontWeight: '500',
	},
	viewBodyFull: {
		flex: 1,
		paddingHorizontal: 0,
		width: '100%',
		maxWidth: 800,
		alignSelf: 'center',
	},
	viewBodyContent: {
		paddingBottom: 24,
	},
	readOnlyEditorFull: {
		backgroundColor: colors.background,
	},
	editorScroll: {
		flex: 1,
		paddingHorizontal: 0,
		width: '100%',
		maxWidth: 800,
		alignSelf: 'center',
	},
	richEditor: {
		backgroundColor: colors.background,
	},
	deleteBar: {
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 28,
		borderTopWidth: 1,
		borderTopColor: colors.borderLight,
		backgroundColor: colors.background,
	},
	titleInput: {
		fontSize: 24,
		fontWeight: '700',
		color: colors.text,
		paddingHorizontal: 18,
		paddingTop: 14,
		paddingBottom: 8,
		width: '100%',
		maxWidth: 800,
		alignSelf: 'center',
	},
	floatingDock: {
		backgroundColor: colors.surfaceLight,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	swatchTray: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		paddingHorizontal: 14,
		paddingVertical: 10,
		backgroundColor: colors.surfaceLight,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	swatch: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: colors.border,
	},
	toolbarOuter: {
		backgroundColor: colors.surfaceLight,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		maxHeight: 52,
	},
	toolbar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 6,
		gap: 2,
	},
	toolBtn: {
		minWidth: 38,
		height: 38,
		paddingHorizontal: 6,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
	},
	toolBtnLabel: {
		color: colors.text,
		fontWeight: '700',
		fontSize: 13.5,
	},
	toolDivider: {
		width: 1,
		height: 20,
		backgroundColor: colors.border,
		marginHorizontal: 4,
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 13,
		borderRadius: 14,
		backgroundColor: 'rgba(239, 68, 68, 0.15)',
		borderWidth: 1,
		borderColor: colors.error,
	},
	deleteButtonText: {
		fontSize: 14,
		fontWeight: '700',
		color: colors.error,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: colors.navyMuted,
		justifyContent: 'flex-end',
	},
	pickerSheet: {
		backgroundColor: colors.surfaceLight,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		paddingBottom: 32,
		borderWidth: 1,
		borderColor: colors.border,
	},
	pickerTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 16,
	},
	pickerOption: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
	},
	pickerOptionText: {
		fontSize: 14,
		color: colors.text,
		fontWeight: '600',
	},
	pickerDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
})
