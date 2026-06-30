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
import { useRouter, useLocalSearchParams } from 'expo-router'
import DateTimePicker, {
	DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { RichEditor, actions } from 'react-native-pell-rich-editor'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import RecordingModal from './components/RecordingModal'

const BRAND = '#d4af37'
const BG = '#000000'
const PANEL = '#0f0f0f'
const TOOLBAR_HEIGHT = 55
const PUBLISH_STRIP_HEIGHT = 56
// Padding inside the editor body so the cursor never sits flush against
// the bottom — scrollToEnd then reliably parks the cursor above the toolbar.
const EDITOR_BOTTOM_PADDING = 420

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
	const params = useLocalSearchParams<{ record?: string }>()
	const editorRef = useRef<RichEditor>(null)
	const scrollRef = useRef<ScrollView>(null)
	const insets = useSafeAreaInsets()
	const [editorHeight, setEditorHeight] = useState(MIN_EDITOR_HEIGHT)
	const { isAuthenticated } = useAuth()
	const [content, setContent] = useState('')
	const [title, setTitle] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [showRecordingModal, setShowRecordingModal] = useState(false)

	// Auto-open the recording modal when arriving from the dashboard's
	// "Record your idea" card (create-post?record=1).
	useEffect(() => {
		if (params.record === '1') setShowRecordingModal(true)
	}, [params.record])

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

	// Append dictated text to the end of the editor content. Moves the
	// selection to the end of the editable body, then inserts the text so the
	// editor's own `input` event fires and onChange/autosave pick it up.
	const appendDictatedText = useCallback((text: string) => {
		const safe = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
		const js = `
		(function(){
		  var ed = document.querySelector('.pell-content');
		  if (!ed) return;
		  ed.focus();
		  var range = document.createRange();
		  range.selectNodeContents(ed);
		  range.collapse(false);
		  var sel = window.getSelection();
		  sel.removeAllRanges();
		  sel.addRange(range);
		  document.execCommand('insertText', false, '${safe} ');
		  ed.dispatchEvent(new Event('input', { bubbles: true }));
		})();
		true;
		`
		editorRef.current?.commandDOM(js)
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
				'Add a title so you can find this script later.',
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
			Alert.alert('Empty post', 'Write something before posting.')
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
					? 'Saved as script'
					: publishOption === 'schedule'
						? 'Scheduled'
						: 'Posted',
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
					<Ionicons name='close' size={24} color='#ffffff' />
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
						backgroundColor: BG,
						color: '#ffffff',
						caretColor: BRAND,
						placeholderColor: 'rgba(255,255,255,0.3)',
						contentCSSText: `font-size: 17px; line-height: 28px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #ffffff; padding: 8px 18px ${EDITOR_BOTTOM_PADDING}px 18px; margin: 0; } input[type="checkbox"] { accent-color: #d4af37; margin-right: 8px; transform: scale(1.15); vertical-align: middle; } .dummy-todo {`,
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
					<View style={styles.publishContainer}>
						<TouchableOpacity
							style={styles.micPill}
							onPress={() => setShowRecordingModal(true)}
							activeOpacity={0.85}
						>
							<Ionicons
								name='mic-outline'
								size={20}
								color={BRAND}
							/>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.publishStrip}
							onPress={() => setShowPublishModal(true)}
							activeOpacity={0.85}
						>
							<Text style={styles.publishStripText}>Post</Text>
							<Ionicons
								name='arrow-forward'
								size={16}
								color='#000000'
							/>
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
			{/* Recording / dictation modal */}
			<RecordingModal
				visible={showRecordingModal}
				onClose={() => setShowRecordingModal(false)}
				onFinalText={appendDictatedText}
			/>
			{/* Publish Modal */}
			<Modal
				visible={showPublishModal}
				transparent
				animationType='slide'
				onRequestClose={() => setShowPublishModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Post</Text>

						<PublishOptionRow
							icon='flash-outline'
							title='Post now'
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
							title='Save as script'
							desc='Edit and post later'
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
		backgroundColor: BG,
	},
	floatingDock: {
		backgroundColor: BG,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(255,255,255,0.08)',
	},
	publishContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: BG,
		paddingHorizontal: 12,
		paddingBottom: 4,
	},
	publishStrip: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		backgroundColor: BRAND,
		marginBottom: 8,
		paddingVertical: 12,
		borderRadius: 12,
	},
	micPill: {
		width: 52,
		height: 48,
		marginBottom: 8,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1.5,
		borderColor: BRAND,
		backgroundColor: 'rgba(212,175,55,0.08)',
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
