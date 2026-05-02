import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

const TEXT_COLORS = [
  { label: 'Default', value: COLORS.text },
  { label: 'Gold', value: COLORS.gold },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Gray', value: '#9ca3af' },
]

export default function CreatePostScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const contentRef = useRef<TextInput>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedPostId, setSavedPostId] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>(COLORS.text)

  // Undo/Redo
  const [history, setHistory] = useState<string[]>([''])
  const [historyIndex, setHistoryIndex] = useState(0)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false)
      setShowColorPicker(false)
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  // Auto-save on content/title change (debounced 1.5s)
  useEffect(() => {
    if (!title && !content) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      autoSave()
    }, 1500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [title, content])

  const autoSave = async () => {
    if (!isAuthenticated || (!title && !content)) return
    if (isSaving) return

    try {
      setIsSaving(true)
      if (savedPostId) {
        await api.posts.update(savedPostId, {
          title: title || undefined,
          content,
        })
      } else {
        const result = await api.posts.create({
          title: title || undefined,
          content,
          platforms: [],
          hashtags: [],
          mediaUrls: [],
        })
        if (result?.id) {
          setSavedPostId(result.id)
        }
      }
      setLastSavedAt(new Date())
    } catch {
      // Silent fail for auto-save
    } finally {
      setIsSaving(false)
    }
  }

  const updateContent = useCallback((text: string) => {
    setContent(text)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(text)
    if (newHistory.length > 50) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex])
    }
  }

  const insertText = (prefix: string, suffix: string = '') => {
    const newContent = content + prefix + suffix
    updateContent(newContent)
  }

  const insertBlock = (block: string) => {
    const separator = content && !content.endsWith('\n') ? '\n' : ''
    updateContent(content + separator + block)
  }

  const handleDone = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please add a title for your content')
      return
    }
    if (!content.trim()) {
      Alert.alert('Content required', 'Please write some content')
      return
    }

    // Force a final save
    setIsSaving(true)
    try {
      if (savedPostId) {
        await api.posts.update(savedPostId, { title, content })
      } else {
        await api.posts.create({
          title,
          content,
          platforms: [],
          hashtags: [],
          mediaUrls: [],
        })
      }
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 5) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`
    return `${Math.floor(seconds / 60)}m ago`
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {isSaving ? (
            <View style={styles.saveStatus}>
              <ActivityIndicator size="small" color={COLORS.textSubtle} />
              <Text style={styles.saveStatusText}>Saving...</Text>
            </View>
          ) : lastSavedAt ? (
            <Text style={styles.saveStatusText}>Saved {formatTimeAgo(lastSavedAt)}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={handleDone}
          style={[styles.doneBtn, (!title.trim() || !content.trim()) && styles.doneBtnDisabled]}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Editor */}
      <ScrollView
        style={styles.editorScroll}
        contentContainerStyle={styles.editorContent}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          placeholderTextColor={COLORS.textSubtle}
          value={title}
          onChangeText={setTitle}
          multiline
          scrollEnabled={false}
        />

        <TextInput
          ref={contentRef}
          style={[styles.contentInput, { color: selectedColor }]}
          placeholder="Start writing..."
          placeholderTextColor={COLORS.textSubtle}
          value={content}
          onChangeText={updateContent}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Formatting Toolbar — only visible when keyboard is up */}
      {keyboardVisible && (
        <View style={styles.toolbar}>
          {showColorPicker ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorPickerRow}
            >
              <TouchableOpacity onPress={() => setShowColorPicker(false)} style={styles.toolBtn}>
                <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
              {TEXT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c.value },
                    selectedColor === c.value && styles.colorDotActive,
                  ]}
                  onPress={() => {
                    setSelectedColor(c.value)
                    setShowColorPicker(false)
                  }}
                />
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toolbarRow}
              keyboardShouldPersistTaps="handled"
            >
              {/* Text Styles */}
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('\n# ')}>
                <Text style={styles.toolText}>H1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('\n## ')}>
                <Text style={styles.toolText}>H2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('\n### ')}>
                <Text style={styles.toolText}>H3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('\n')}>
                <Text style={styles.toolTextSmall}>Aa</Text>
              </TouchableOpacity>

              <View style={styles.toolDivider} />

              {/* Inline Formatting */}
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('**', '**')}>
                <Text style={[styles.toolText, { fontWeight: '800' }]}>B</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('*', '*')}>
                <Text style={[styles.toolText, { fontStyle: 'italic' }]}>I</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('__', '__')}>
                <Text style={[styles.toolText, { textDecorationLine: 'underline' }]}>U</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('~~', '~~')}>
                <Text style={[styles.toolText, { textDecorationLine: 'line-through' }]}>S</Text>
              </TouchableOpacity>

              <View style={styles.toolDivider} />

              {/* Blocks */}
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('- [ ] ')}>
                <Ionicons name="checkbox-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('• ')}>
                <Ionicons name="list" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('1. ')}>
                <Text style={styles.toolTextSmall}>1.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('\n---\n')}>
                <Ionicons name="remove-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('[', '](url)')}>
                <Ionicons name="link-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={styles.toolDivider} />

              {/* Color */}
              <TouchableOpacity style={styles.toolBtn} onPress={() => setShowColorPicker(true)}>
                <View style={[styles.colorIndicator, { backgroundColor: selectedColor }]} />
              </TouchableOpacity>

              <View style={styles.toolDivider} />

              {/* Undo / Redo */}
              <TouchableOpacity
                style={[styles.toolBtn, historyIndex <= 0 && styles.toolBtnDisabled]}
                onPress={undo}
                disabled={historyIndex <= 0}
              >
                <Ionicons name="arrow-undo" size={18} color={historyIndex <= 0 ? COLORS.textSubtle : COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolBtn, historyIndex >= history.length - 1 && styles.toolBtnDisabled]}
                onPress={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Ionicons name="arrow-redo" size={18} color={historyIndex >= history.length - 1 ? COLORS.textSubtle : COLORS.textMuted} />
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 56,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  saveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveStatusText: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  doneBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  doneBtnDisabled: {
    opacity: 0.4,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },

  // Editor
  editorScroll: {
    flex: 1,
  },
  editorContent: {
    padding: SPACING.lg,
    paddingBottom: 200,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 34,
    marginBottom: SPACING.md,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.text,
    minHeight: 400,
  },

  // Toolbar
  toolbar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: SPACING.sm,
  },
  toolbarRow: {
    paddingHorizontal: SPACING.md,
    gap: 2,
    alignItems: 'center',
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtnDisabled: {
    opacity: 0.3,
  },
  toolText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  toolTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  toolDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 4,
  },

  // Color picker
  colorPickerRow: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotActive: {
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  colorIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
})
