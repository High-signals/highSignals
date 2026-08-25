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
	Dimensions,
	useWindowDimensions,
} from 'react-native'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MIN_EDITOR_HEIGHT = Math.max(400, SCREEN_HEIGHT - 320)
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter, useLocalSearchParams } from 'expo-router'
import DateTimePicker, {
	DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { RichEditor, actions } from 'react-native-pell-rich-editor'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import RecordingModal from './components/RecordingModal'





const TOOLBAR_HEIGHT = 55
const PUBLISH_STRIP_HEIGHT = 56
// Padding inside the editor body so the cursor never sits flush against
// the bottom — scrollToEnd then reliably parks the cursor above the toolbar.
const EDITOR_BOTTOM_PADDING = 420

type PublishOption = 'immediate' | 'schedule' | 'draft'

// AsyncStorage key for an unfinished voice idea (see dashboard resume popup).
export const VOICE_DRAFT_KEY = 'voiceDraft'
type VoiceDraft = { filePath: string; createdAt: number }

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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function CreatePostScreen() {
	const { colors, theme } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	const router = useRouter()
	const params = useLocalSearchParams<{
		record?: string
		resumeVoice?: string
	}>()
	const editorRef = useRef<RichEditor>(null)
	const scrollRef = useRef<ScrollView>(null)
	const insets = useSafeAreaInsets()
	const [editorHeight, setEditorHeight] = useState(MIN_EDITOR_HEIGHT)
	const { isAuthenticated } = useAuth()
	const [content, setContent] = useState('')
	const [title, setTitle] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [showRecordingModal, setShowRecordingModal] = useState(false)
	// When resuming an unfinished idea, this holds the cached audio file URI so
	// the modal can prime its Retry button with it.
	const [resumeFilePath, setResumeFilePath] = useState<string | null>(null)

	// Auto-open the recording modal when arriving from the dashboard's
	// "Record your idea" card (create-post?record=1) or the draft-resume popup
	// (create-post?resumeVoice=1).
	useEffect(() => {
		if (params.record === '1') {
			setResumeFilePath(null)
			setShowRecordingModal(true)
		}
	}, [params.record])

	useEffect(() => {
		if (params.resumeVoice !== '1') return
		let cancelled = false
		;(async () => {
			try {
				const raw = await AsyncStorage.getItem(VOICE_DRAFT_KEY)
				if (!raw || cancelled) return
				const draft: VoiceDraft = JSON.parse(raw)
				if (draft?.filePath) {
					setResumeFilePath(draft.filePath)
					setShowRecordingModal(true)
				}
			} catch (err) {
				console.warn('failed to load voice draft', err)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [params.resumeVoice])

	// Content Type options
	const CONTENT_TYPES = ['Storytelling', 'Listicles', 'Quick Tip', 'Contrarian', 'Before and After', 'POV', 'Voice Over', 'Skit', 'Problem Solution', 'Other']
	const [contentType, setContentType] = useState<string>('')
	const [customContentType, setCustomContentType] = useState('')
	const [showContentTypeModal, setShowContentTypeModal] = useState(false)
	const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' })
	const showAlert = (title: string, message: string) => setCustomAlert({ visible: true, title, message })

	// Toolbar UI
	const [showColors, setShowColors] = useState(false)
	const [keyboardHeight, setKeyboardHeight] = useState(0)

	useEffect(() => {
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
	}, [])

	// Auto-save plumbing
	const draftIdRef = useRef<string | null>(null)
	const inFlightRef = useRef(false)
	const pendingRef = useRef(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastSavedSnapshotRef = useRef<string>('')
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
	const [showAiText, setShowAiText] = useState(false)

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
				const initialStatus = params.record === '1' ? 'RECORDING' : 'SCRIPTING'
				const created = await api.posts.create({
					title: title.trim() || 'Untitled',
					content,
					platforms: [],
					mediaUrls: [],
					status: initialStatus,
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

	// --- Live voice dictation into the editor ---------------------------------
	// Interim (partial) transcripts are shown in a single grey placeholder span
	// pinned at the end of the content, updated in place as Google refines them.
	// A final phrase replaces that span with permanent text, so the editor's
	// `input` event fires and onChange/autosave pick it up.

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
		    span.setAttribute('style','color:rgba(255,255,255,0.45);font-style:italic;');
		    ed.appendChild(span);
		  }
		  span.textContent = '${safe}';
		})();
		true;
		`
		editorRef.current?.commandDOM(js)
	}, [])

	// Mark the start of a dictation session (live start or retry). If the editor
	// already holds text, the first committed phrase should begin on a new line
	// so voice input doesn't run into whatever the user typed before. A fresh /
	// empty draft gets no leading blank line. The decision is resolved at commit
	// time inside the WebView, where the live DOM content is authoritative.
	const beginVoiceSession = useCallback(() => {
		const js = `
		(function(){
		  var ed = document.querySelector('.pell-content');
		  if (!ed) return;
		  var span = document.getElementById('__interim');
		  var hadInterim = !!span;
		  if (span) span.remove();
		  var hasText = ed.textContent.replace(/\\u00a0|\\s/g,'').length > 0;
		  // Newline needed only if there's pre-existing text this session hasn't
		  // already broken onto a new line.
		  window.__voiceNewline = hasText;
		})();
		true;
		`
		editorRef.current?.commandDOM(js)
	}, [])

	// Commit a stabilized phrase: drop the interim span and append permanent text.
	// The first commit of a session prepends a paragraph break when the editor
	// already had content (see beginVoiceSession).
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

	// Remove any lingering interim span (e.g. on cancel) without committing.
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

	// --- Voice draft persistence (device) -------------------------------------
	const saveVoiceDraft = useCallback(async (fileUri: string) => {
		try {
			const draft: VoiceDraft = { filePath: fileUri, createdAt: Date.now() }
			await AsyncStorage.setItem(VOICE_DRAFT_KEY, JSON.stringify(draft))
		} catch (err) {
			console.warn('failed to save voice draft', err)
		}
	}, [])

	const clearVoiceDraft = useCallback(async () => {
		try {
			await AsyncStorage.removeItem(VOICE_DRAFT_KEY)
		} catch {}
	}, [])

	const insertDivider = () => {
		editorRef.current?.insertHTML('<hr />')
	}
	const installChecklistExitHandler = () => {
		// pell.js's checklist doesn't exit on empty enter or backspace.
		// Inject a keydown listener that detects an empty checklist <li>
		// and breaks out into a fresh paragraph.
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
		      // split: move siblings after li into a new ul after the paragraph
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
		        background: rgba(15, 23, 42, 0.95);
		        border: 1px solid rgba(212, 175, 55, 0.4);
		        border-radius: 8px;
		        padding: 4px;
		        z-index: 99999;
		        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
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
		        color: #e2e8f0;
		        padding: 6px 10px;
		        font-size: 13px;
		        font-weight: bold;
		        border-radius: 4px;
		        cursor: pointer;
		        display: flex;
		        align-items: center;
		        justify-content: center;
		        min-width: 30px;
		        height: 30px;
		        outline: none;
		      }
		      .floating-btn:active, .floating-btn.active {
		        background: rgba(212, 175, 55, 0.2);
		        color: #d4af37;
		      }
		      .floating-divider {
		        width: 1px;
		        height: 18px;
		        background: rgba(255, 255, 255, 0.15);
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
		      // Gap large enough to clear the native selection handles so our
		      // toolbar doesn't collide with Android's copy/paste menu (which
		      // sits above the selection). Default below the selection.
		      var gap = 30;

		      var absoluteLeft = rect.left + (rect.width / 2) - (toolbarWidth / 2) + window.pageXOffset;
		      var absoluteTop = rect.bottom + window.pageYOffset + gap;

		      if (absoluteLeft < 8) absoluteLeft = 8;
		      if (absoluteLeft + toolbarWidth > window.innerWidth - 8) {
		        absoluteLeft = window.innerWidth - toolbarWidth - 8;
		      }
		      // If placing below would push it off the bottom of the viewport,
		      // fall back to above the selection.
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

	const combineDateAndTime = (date: Date, time: Date) => {
		const next = new Date(date)
		next.setHours(
			time.getHours(),
			time.getMinutes(),
			time.getSeconds(),
			0,
		)
		return next
	}

	const handleHeaderSavePress = async () => {
		if (!title.trim()) {
			showAlert(
				'Title required',
				'Add a title so you can find this script later.',
			)
			return
		}
		await performSave()
	}

	const handleFinish = async () => {
		if (!contentType) {
			Toast.show({ type: 'error', text1: 'Content Type', text2: 'Please select a content type.' })
			return
		}
		if (!title.trim() && !content) {
			Toast.show({ type: 'error', text1: 'Empty', text2: 'Write something before finishing.' })
			return
		}
		if (!isAuthenticated) {
			Toast.show({ type: 'error', text1: 'Not signed in', text2: 'Please log in first.' })
			return
		}

		setIsSaving(true)
		try {
			const finalContentType = contentType === 'Other' ? customContentType.trim() : contentType;
			const status = params.record === '1' ? 'RECORDING' : 'SCRIPTING'

			if (draftIdRef.current) {
				await api.posts.update(draftIdRef.current, {
					title: title.trim(),
					content,
					status,
					contentType: finalContentType,
				})
			} else {
				await api.posts.create({
					title: title.trim(),
					content,
					platforms: [],
					mediaUrls: [],
					status,
					contentType: finalContentType,
				})
			}

			Toast.show({ type: 'success', text1: 'Success', text2: 'Saved!' })
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
			setShowContentTypeModal(false)
			router.push('/(tabs)/GetContent')
		} catch (error: any) {
			Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to save post' })
		} finally {
			setIsSaving(false)
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

	const kbHeight = Platform.OS === 'ios' ? keyboardHeight : 0

	const { height: windowHeight } = useWindowDimensions()
	const maxWindowHeightRef = useRef(windowHeight)

	if (keyboardHeight === 0 && windowHeight > maxWindowHeightRef.current) {
		maxWindowHeightRef.current = windowHeight
	}

	const keyboardActive = keyboardHeight > 0
	const viewportShrunk = keyboardActive && (windowHeight < maxWindowHeightRef.current - 80)
	const bottomPadding = keyboardActive && !viewportShrunk ? keyboardHeight : 0

	return (
		<View style={[styles.container, { paddingBottom: bottomPadding }]}>
			{/* Header strip */}
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.headerIconBtn}
				>
					<Ionicons name='close' size={24} color={colors.primaryIcon} />
				</TouchableOpacity>

				<View style={styles.headerCenter}>
					<Text style={styles.headerTitle}>New script</Text>
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

				<View style={styles.headerIconBtn}>
					<TouchableOpacity onPress={handleHeaderSavePress}>
						<Ionicons name='create-outline' size={22} color={colors.primaryIcon} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Title input — no card */}
			<TextInput
				style={styles.titleInput}
				placeholder='Title'
				placeholderTextColor={colors.textSubtle}
				value={title}
				onChangeText={setTitle}
			/>
			{/* Full-page editor */}
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
					initialContentHTML={'<p></p>'}
					editorInitializedCallback={installChecklistExitHandler}
					onChange={setContent}
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
				{/* Publish strip — hidden while typing so the toolbar can sit at the bottom.
				    Record mic sits side-by-side with the Post button; it opens the
				    recording modal that transcribes speech into the editor. */}
				{keyboardHeight === 0 && (
					<View style={[styles.publishContainer, { justifyContent: 'space-between' }]}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
							<TouchableOpacity
								style={styles.micPill}
								onPress={() => setShowRecordingModal(true)}
								activeOpacity={0.85}
							>
								<Ionicons name='mic-outline' size={22} color={colors.primaryIcon} />
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.publishStrip, { backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 16, flex: 0 }]}
								onPress={() => setShowContentTypeModal(true)}
								activeOpacity={0.85}
							>
								<Text style={[styles.publishStripText, { color: colors.text, fontSize: 13 }]} numberOfLines={1}>
									{contentType ? (contentType === 'Other' && customContentType ? customContentType : contentType) : 'Content type'}
								</Text>
								<Ionicons name='chevron-down' size={14} color={colors.primaryIcon} style={{ marginLeft: 4 }} />
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							style={[styles.publishStrip, { backgroundColor: colors.primaryAction, paddingVertical: 10, paddingHorizontal: 24, flex: 0, opacity: !contentType ? 0.5 : 1 }]}
							onPress={handleFinish}
							activeOpacity={0.85}
							disabled={isSaving || !contentType}
						>
							{isSaving ? (
								<ActivityIndicator color={colors.primaryActionText} size='small' />
							) : (
								<Text style={[styles.publishStripText, { color: colors.black }]}>Done</Text>
							)}
						</TouchableOpacity>
						<TouchableOpacity 
							style={styles.aiButton}
							activeOpacity={0.8}
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
								setShowAiText(true)
								setTimeout(() => setShowAiText(false), 10000)
							}}
						>
							<Ionicons name="sparkles" size={14} color={colors.primaryIcon} />
							<Text style={styles.aiButtonText}>AI</Text>
						</TouchableOpacity>
					</View>
				)}
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
			{/* Recording / dictation modal — transcript is written into the editor
			    behind this sheet (interim as a grey span, finals as permanent text). */}
			<RecordingModal
				visible={showRecordingModal}
				onClose={() => {
					clearInterimText()
					setResumeFilePath(null)
					setShowRecordingModal(false)
				}}
				onLiveTranscript={updateInterimText}
				onFinalText={commitFinalText}
				onSessionStart={beginVoiceSession}
				resumeFilePath={resumeFilePath}
				onDraftSave={saveVoiceDraft}
				onDraftClear={clearVoiceDraft}
			/>
			{/* Content Type Modal */}
			<Modal
				visible={showContentTypeModal}
				transparent
				animationType='slide'
				onRequestClose={() => setShowContentTypeModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Select Content Type</Text>

						<ScrollView style={{ maxHeight: 300, width: '100%', marginBottom: 16 }} showsVerticalScrollIndicator={false}>
							{CONTENT_TYPES.map((type) => {
								const isSelected = contentType === type
								return (
									<TouchableOpacity
										key={type}
										style={[
											styles.contentTypeItem,
											isSelected && styles.contentTypeItemSelected,
										]}
										onPress={() => setContentType(type)}
									>
										<Text style={[
											styles.contentTypeText,
											isSelected && styles.contentTypeTextSelected,
										]}>
											{type}
										</Text>
									</TouchableOpacity>
								)
							})}
						</ScrollView>

						{contentType === 'Other' && (
							<TextInput
								style={[styles.searchInput, { width: '100%', marginBottom: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.text, backgroundColor: colors.surfaceCard, padding: 12 }]}
								placeholder='Type your custom content format'
								placeholderTextColor={colors.textSubtle}
								value={customContentType}
								onChangeText={setCustomContentType}
								maxLength={30}
							/>
						)}

						<View style={styles.modalActions}>
							<TouchableOpacity
								style={styles.cancelButton}
								onPress={() => setShowContentTypeModal(false)}
							>
								<Text style={styles.cancelText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.confirmButton}
								onPress={() => setShowContentTypeModal(false)}
								disabled={contentType === 'Other' && !customContentType.trim()}
							>
								<Text style={styles.confirmText}>Confirm</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Custom Alert Modal */}
			<Modal
				visible={customAlert.visible}
				transparent
				animationType='fade'
				onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
			>
				<View style={[styles.modalOverlay, { backgroundColor: colors.navyMuted, justifyContent: 'center', alignItems: 'center' }]}>
					<View style={[styles.modalContent, { alignItems: 'center', width: '80%', paddingVertical: 28, borderRadius: 20, borderTopWidth: 0, borderWidth: 1, borderColor: colors.border }]}>
						<Ionicons name="information-circle-outline" size={44} color={colors.primaryIcon} style={{ marginBottom: 12 }} />
						<Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 6 }]}>{customAlert.title}</Text>
						<Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
							{customAlert.message}
						</Text>
						<TouchableOpacity
							style={[styles.confirmButton, { width: '100%' }]}
							onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
						>
							<Text style={styles.confirmText}>Okay</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
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

function ToolbarStyled({ label, textStyle, onPress }: { label: string, textStyle: any, onPress: () => void }) {
	const { colors } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	return (
		<TouchableOpacity onPress={onPress} style={styles.toolBtn}>
			<Text style={[styles.toolBtnLabel, textStyle]}>{label}</Text>
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

function Divider() {
	const { colors } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	return <View style={styles.toolDivider} />
}

function PublishOptionRow({ icon, title, desc, selected, onPress }: { icon: keyof typeof Ionicons.glyphMap, title: string, desc: string, selected: boolean, onPress: () => void }) {
	const { colors } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	return (
		<TouchableOpacity
			style={[styles.option, selected && styles.optionSelected]}
			onPress={onPress}
		>
			<View style={styles.optionLeft}>
				<Ionicons name={icon} size={22} color={colors.primaryIcon} />
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

const getStyles = (colors: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	header: {
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
	floatingDock: {
		backgroundColor: colors.surfaceLight,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	publishContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: colors.background,
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	publishStrip: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		backgroundColor: colors.navyLight,
		paddingVertical: 12,
		borderRadius: 12,
	},
	aiButton: {
		position: 'absolute',
		right: 16,
		top: -46,
		backgroundColor: colors.surfaceCard,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 6,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		elevation: 3,
		shadowColor: colors.text,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
	},
	aiButtonText: {
		color: colors.text,
		fontSize: 12,
		fontWeight: '700',
	},
	micPill: {
		width: 48,
		height: 44,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surfaceCard,
	},
	publishStripText: {
		color: colors.white,
		fontWeight: '700',
		fontSize: 15,
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
	toolBtnTextLabel: {
		color: colors.text,
		fontWeight: '700',
		fontSize: 15,
		textDecorationLine: 'underline',
	},
	toolDivider: {
		width: 1,
		height: 20,
		backgroundColor: colors.border,
		marginHorizontal: 4,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: colors.navyMuted,
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: colors.surfaceLight,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		paddingBottom: 32,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 16,
	},
	contentTypeItem: {
		width: '100%',
		marginVertical: 4,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
	},
	contentTypeItemSelected: {
		backgroundColor: colors.primaryAction,
	},
	contentTypeText: {
		color: colors.textSecondary,
		fontSize: 15,
		fontWeight: '600',
	},
	contentTypeTextSelected: {
		color: colors.black,
		fontWeight: '700',
	},
	option: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderRadius: 12,
		backgroundColor: colors.surfaceCard,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: 8,
	},
	optionSelected: {
		borderColor: colors.navyLight,
		backgroundColor: colors.surfaceCard,
	},
	optionLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	optionTitle: {
		color: colors.text,
		fontWeight: '700',
		fontSize: 14,
	},
	optionDesc: {
		color: colors.textMuted,
		fontSize: 12,
		marginTop: 2,
	},
	radio: {
		width: 20,
		height: 20,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#CBD5E1',
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioActive: {
		borderColor: colors.navyLight,
	},
	radioDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: colors.navyLight,
	},
	modalActions: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 12,
	},
	cancelButton: {
		flex: 1,
		paddingVertical: 13,
		borderRadius: 12,
		alignItems: 'center',
		backgroundColor: colors.surfaceCard,
		borderWidth: 1,
		borderColor: colors.border,
	},
	cancelText: {
		color: colors.text,
		fontWeight: '700',
		fontSize: 15,
	},
	confirmButton: {
		flex: 1,
		paddingVertical: 13,
		borderRadius: 12,
		alignItems: 'center',
		backgroundColor: colors.navyLight,
	},
	confirmText: {
		color: colors.white,
		fontWeight: '700',
		fontSize: 15,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
})
