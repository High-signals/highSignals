import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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
  const [editedPost, setEditedPost] = useState<Post | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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
      DRAFT: '#888888',
      SCHEDULED: '#FFD700',
      PUBLISHED: '#00FF00',
      FAILED: '#FF6B6B',
    }
    return colors[status] || '#FFFFFF'
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size='large' color='#d4af37' />
      </View>
    )
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    )
  }

  const displayPost = isEditing ? editedPost : post

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (isEditing ? setIsEditing(false) : router.back())}>
          <Ionicons name='arrow-back' size={24} color='#ffffff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Post' : 'Post Details'}</Text>
        {!isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name='create-outline' size={24} color='#d4af37' />
          </TouchableOpacity>
        )}
        {isEditing && (
          <TouchableOpacity onPress={handleSaveChanges} disabled={isSaving}>
            <Text style={styles.saveButton}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(displayPost!.status) + '30' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(displayPost!.status) }]}>
            {displayPost!.status}
          </Text>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedPost?.title || ''}
              onChangeText={(text) =>
                setEditedPost(
                  editedPost ? { ...editedPost, title: text } : null
                )
              }
              placeholderTextColor='rgba(255,255,255,0.3)'
            />
          ) : (
            <Text style={styles.titleText}>{displayPost?.title || 'Untitled Post'}</Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.section}>
          <Text style={styles.label}>Content</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.contentInput]}
              value={editedPost?.content || ''}
              onChangeText={(text) =>
                setEditedPost(
                  editedPost ? { ...editedPost, content: text } : null
                )
              }
              placeholderTextColor='rgba(255,255,255,0.3)'
              multiline
              numberOfLines={8}
            />
          ) : (
            <Text style={styles.contentText}>{displayPost?.content}</Text>
          )}
        </View>

        {/* Platforms */}
        <View style={styles.section}>
          <Text style={styles.label}>Platforms</Text>
          <View style={styles.platformsList}>
            {displayPost?.platforms.map((platform, idx) => (
              <View key={idx} style={styles.platformTag}>
                <Ionicons name={getPlatformIcon(platform) as any} size={16} color='#d4af37' />
                <Text style={styles.platformText}>{platform}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hashtags */}
        {displayPost?.hashtags && displayPost.hashtags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Hashtags</Text>
            <View style={styles.hashtagsList}>
              {displayPost.hashtags.map((tag, idx) => (
                <View key={idx} style={styles.hashtagTag}>
                  <Text style={styles.hashtagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Media URLs */}
        {displayPost?.mediaUrls && displayPost.mediaUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Media URLs</Text>
            {displayPost.mediaUrls.map((url, idx) => (
              <Text key={idx} style={styles.urlText}>
                {url}
              </Text>
            ))}
          </View>
        )}

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.dateText}>
            {new Date(displayPost!.createdAt).toLocaleString()}
          </Text>
        </View>

        {displayPost!.scheduledAt && (
          <View style={styles.section}>
            <Text style={styles.label}>Scheduled For</Text>
            <Text style={styles.dateText}>
              {new Date(displayPost!.scheduledAt).toLocaleString()}
            </Text>
          </View>
        )}

        {displayPost!.publishedAt && (
          <View style={styles.section}>
            <Text style={styles.label}>Published</Text>
            <Text style={styles.dateText}>
              {new Date(displayPost!.publishedAt).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Delete Button */}
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

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d4af37',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d4af37',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 32,
  },
  contentText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 16,
  },
  contentInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  platformsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  platformText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d4af37',
  },
  hashtagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,217,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.3)',
  },
  hashtagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D9FF',
  },
  urlText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    marginTop: 24,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
})
