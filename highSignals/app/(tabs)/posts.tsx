import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const STATUSES = [
  { key: 'DRAFT', label: 'Drafts', icon: 'document-outline' },
  { key: 'SCHEDULED', label: 'Scheduled', icon: 'time-outline' },
  { key: 'PUBLISHED', label: 'Published', icon: 'checkmark-circle-outline' },
  { key: 'FAILED', label: 'Failed', icon: 'alert-circle-outline' },
]

interface Post {
  id: string
  title?: string
  content: string
  status: string
  platforms: string[]
  createdAt: string
  scheduledAt?: string
  publishedAt?: string
}

export default function PostsScreen() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('DRAFT')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [allPosts, setAllPosts] = useState<Post[]>([])

  // Fetch posts from backend
  const fetchPosts = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      // Get all posts first
      const allPostsData = await api.posts.getAll()
      setAllPosts(allPostsData || [])

      // Filter by status
      const filtered = (allPostsData || []).filter(
        (p: Post) => p.status === activeTab
      )
      setPosts(filtered)
    } catch (error) {
      console.error('Error fetching posts:', error)
      // Show empty state
      setPosts([])
      setAllPosts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTab, isAuthenticated])

  useEffect(() => {
    fetchPosts()
  }, [activeTab])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPosts()
  }, [fetchPosts])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return '#8E8E93'
      case 'SCHEDULED':
        return '#FFB800'
      case 'PUBLISHED':
        return '#34C759'
      case 'FAILED':
        return '#FF3B30'
      default:
        return '#999'
    }
  }

  const getPlatformIcon = (platform: string) => {
    const iconMap: { [key: string]: string } = {
      LINKEDIN: 'logo-linkedin',
      TWITTER: 'logo-twitter',
      INSTAGRAM: 'logo-instagram',
      FACEBOOK: 'logo-facebook',
      TIKTOK: 'logo-tiktok',
    }
    return iconMap[platform] || 'logo-social'
  }

  const PostCard = ({ post }: { post: Post }) => (
    <TouchableOpacity style={styles.postCard} activeOpacity={0.8}>
      <View style={styles.postHeader}>
        <View style={styles.postTitleSection}>
          <Text style={styles.postTitle} numberOfLines={2}>
            {post.title || 'Untitled Post'}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(post.status) },
            ]}
          >
            <Text style={styles.statusText}>{post.status}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.postContent} numberOfLines={3}>
        {post.content}
      </Text>

      <View style={styles.postFooter}>
        <View style={styles.platformsContainer}>
          {post.platforms.map((platform, idx) => (
            <View key={idx} style={styles.platformTag}>
              <Ionicons
                name={getPlatformIcon(platform) as any}
                size={14}
                color='#d4af37'
              />
              <Text style={styles.platformText}>{platform}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.dateText}>
          {new Date(post.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {post.scheduledAt && (
        <View style={styles.scheduledInfo}>
          <Ionicons name='time-outline' size={14} color='#FFB800' />
          <Text style={styles.scheduledText}>
            Scheduled for {new Date(post.scheduledAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const getPostCount = (status: string) => {
    return allPosts.filter(p => p.status === status).length
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Posts</Text>
        <Text style={styles.headerSubtitle}>
          Manage drafts, scheduled, and published posts
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUSES.map(status => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.tab,
              activeTab === status.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(status.key)}
          >
            <Ionicons
              name={status.icon as any}
              size={20}
              color={activeTab === status.key ? '#d4af37' : 'rgba(255,255,255,0.5)'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === status.key && styles.activeTabLabel,
              ]}
            >
              {status.label}
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === status.key && styles.activeTabBadge,
              ]}
            >
              <Text style={styles.badgeText}>{getPostCount(status.key)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Posts List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#d4af37' />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={
              STATUSES.find(s => s.key === activeTab)?.icon as any
            }
            size={64}
            color='rgba(255,255,255,0.2)'
          />
          <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} posts</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'DRAFT'
              ? 'Start creating your first post'
              : activeTab === 'SCHEDULED'
              ? 'Schedule your posts to see them here'
              : activeTab === 'PUBLISHED'
              ? 'Your published posts will appear here'
              : 'No failed posts'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  tabsScroll: {
    marginBottom: 20,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeTab: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderColor: '#d4af37',
  },
  tabLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#d4af37',
  },
  tabBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(212,175,55,0.3)',
  },
  badgeText: {
    fontSize: 11,
    color: '#d4af37',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  postContent: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  platformTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  platformText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#d4af37',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  scheduledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.2)',
  },
  scheduledText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#FFB800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
})
