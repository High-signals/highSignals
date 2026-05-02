import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

const TEXT_COLORS = [
  { label: 'Default', value: COLORS.text },
  { label: 'Gold', value: COLORS.gold },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Gray', value: '#9ca3af' },
]

interface Post {
  id: string
  title?: string
  content: string
  status: string
  platforms: string[]
  hashtags: string[]
  mediaUrls: string[]
  createdAt: string
  scheduledAt?: string
  publishedAt?: string
}

export default function PostDetailScreen() {
  const router = useRouter()
  const { postId } = useLocalSearchParams()
  const { isAuthenticated } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>(COLORS.text)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false)
      setShowColorPicker(false)
    })
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

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
        setEditTitle(foundPost.title || '')
        setEditContent(foundPost.content)
      } else {
        Alert.alert('Error', 'Post not found')
        router.back()
      }
    } catch {
      Alert.alert('Error', 'Failed to load post')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const startEditing = () => {
    setEditTitle(post?.title || '')
    setEditContent(post?.content || '')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    Keyboard.dismiss()
  }

  const handleSave = async () => {
    if (!post) return
    try {
      setIsSaving(true)
      await api.posts.update(post.id, { title: editTitle, content: editContent })
      setPost({ ...post, title: editTitle, content: editContent })
      setIsEditing(false)
      Keyboard.dismiss()
    } catch {
      Alert.alert('Error', 'Failed to update post')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.posts.delete(post!.id)
            router.back()
          } catch {
            Alert.alert('Error', 'Failed to delete post')
          }
        },
      },
    ])
  }

  const insertText = (prefix: string, suffix: string = '') => {
    setEditContent(editContent + prefix + suffix)
  }

  const insertBlock = (block: string) => {
    const sep = editContent && !editContent.endsWith('\n') ? '\n' : ''
    setEditContent(editContent + sep + block)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return COLORS.textSubtle
      case 'SCHEDULED': return COLORS.warning
      case 'PUBLISHED': return COLORS.success
      default: return COLORS.textSubtle
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    )
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={isEditing ? cancelEditing : () => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name={isEditing ? 'close' : 'chevron-back'} size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{isEditing ? 'Editing' : ''}</Text>

        {isEditing ? (
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startEditing} style={styles.headerBtn}>
            <Ionicons name="create-outline" size={20} color={COLORS.gold} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(post.status) }]} />
          <Text style={[styles.statusLabel, { color: getStatusColor(post.status) }]}>
            {post.status}
          </Text>
          {post.scheduledAt && (
            <Text style={styles.scheduledLabel}>
              Scheduled {new Date(post.scheduledAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Title */}
        {isEditing ? (
          <TextInput
            style={styles.titleInput}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Title"
            placeholderTextColor={COLORS.textSubtle}
            multiline
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.titleText}>{post.title || 'Untitled Post'}</Text>
        )}

        {/* Content */}
        {isEditing ? (
          <TextInput
            style={[styles.contentInput, { color: selectedColor }]}
            value={editContent}
            onChangeText={setEditContent}
            placeholder="Write content..."
            placeholderTextColor={COLORS.textSubtle}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.contentText}>{post.content}</Text>
        )}

        {/* Meta */}
        {!isEditing && (
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              Created {new Date(post.createdAt).toLocaleDateString()}
            </Text>
            {post.publishedAt && (
              <Text style={styles.metaText}>
                Published {new Date(post.publishedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Delete */}
        {!isEditing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={styles.deleteText}>Delete Post</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Formatting Toolbar — edit mode only, keyboard visible */}
      {isEditing && keyboardVisible && (
        <View style={styles.toolbar}>
          {showColorPicker ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              <TouchableOpacity onPress={() => setShowColorPicker(false)} style={styles.toolBtn}>
                <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
              {TEXT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.colorDot, { backgroundColor: c.value }, selectedColor === c.value && styles.colorDotActive]}
                  onPress={() => { setSelectedColor(c.value); setShowColorPicker(false) }}
                />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarRow} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('# ')}><Text style={styles.toolText}>H1</Text></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('## ')}><Text style={styles.toolText}>H2</Text></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('### ')}><Text style={styles.toolText}>H3</Text></TouchableOpacity>
              <View style={styles.toolDivider} />
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('**', '**')}><Text style={[styles.toolText, { fontWeight: '800' }]}>B</Text></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('*', '*')}><Text style={[styles.toolText, { fontStyle: 'italic' }]}>I</Text></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('__', '__')}><Text style={[styles.toolText, { textDecorationLine: 'underline' }]}>U</Text></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('~~', '~~')}><Text style={[styles.toolText, { textDecorationLine: 'line-through' }]}>S</Text></TouchableOpacity>
              <View style={styles.toolDivider} />
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('- [ ] ')}><Ionicons name="checkbox-outline" size={18} color={COLORS.textMuted} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('• ')}><Ionicons name="list" size={18} color={COLORS.textMuted} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('1. ')}><Text style={styles.toolTextSm}>1.</Text></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertBlock('\n---\n')}><Ionicons name="remove-outline" size={18} color={COLORS.textMuted} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => insertText('[', '](url)')}><Ionicons name="link-outline" size={18} color={COLORS.textMuted} /></TouchableOpacity>
              <View style={styles.toolDivider} />
              <TouchableOpacity style={styles.toolBtn} onPress={() => setShowColorPicker(true)}>
                <View style={[styles.colorIndicator, { backgroundColor: selectedColor }]} />
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  saveBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },

  // Content
  content: {
    flex: 1,
  },
  contentInner: {
    padding: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scheduledLabel: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginLeft: 'auto',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: SPACING.md,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: SPACING.md,
  },
  contentText: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 26,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.text,
    minHeight: 300,
  },
  meta: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    marginTop: SPACING.lg,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
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
  toolText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  toolTextSm: {
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
  colorRow: {
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
