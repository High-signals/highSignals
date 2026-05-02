import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

const STATUSES = [
  { key: 'DRAFT', label: 'Drafts', icon: 'document-outline' },
  { key: 'SCHEDULED', label: 'Scheduled', icon: 'time-outline' },
  { key: 'PUBLISHED', label: 'Published', icon: 'checkmark-circle-outline' },
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
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('DRAFT')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [allPosts, setAllPosts] = useState<Post[]>([])

  const fetchPosts = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const allPostsData = await api.posts.getAll()
      setAllPosts(allPostsData || [])
      const filtered = (allPostsData || []).filter(
        (p: Post) => p.status === activeTab
      )
      setPosts(filtered)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
      setAllPosts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTab, isAuthenticated])

  // Auto-refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchPosts()
    }, [fetchPosts])
  )

  useEffect(() => {
    if (allPosts.length > 0) {
      setPosts(allPosts.filter((p: Post) => p.status === activeTab))
    }
  }, [activeTab])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPosts()
  }, [fetchPosts])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return COLORS.textSubtle
      case 'SCHEDULED': return COLORS.warning
      case 'PUBLISHED': return COLORS.success
      default: return COLORS.textSubtle
    }
  }

  const PostCard = ({ post }: { post: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/(tabs)/post-detail?postId=${post.id}` as any)}
    >
      <View style={styles.postHeader}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {post.title || 'Untitled Post'}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(post.status) }]} />
      </View>

      <Text style={styles.postContent} numberOfLines={2}>
        {post.content}
      </Text>

      <View style={styles.postFooter}>
        <Text style={styles.dateText}>
          {new Date(post.createdAt).toLocaleDateString()}
        </Text>
        {post.scheduledAt && (
          <View style={styles.scheduledInfo}>
            <Ionicons name="time-outline" size={12} color={COLORS.warning} />
            <Text style={styles.scheduledText}>
              {new Date(post.scheduledAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  const getPostCount = (status: string) => {
    return allPosts.filter(p => p.status === status).length
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Content</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUSES.map(status => (
          <TouchableOpacity
            key={status.key}
            style={[styles.tab, activeTab === status.key && styles.activeTab]}
            onPress={() => setActiveTab(status.key)}
          >
            <Text style={[styles.tabLabel, activeTab === status.key && styles.activeTabLabel]}>
              {status.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === status.key && styles.activeTabBadge]}>
              <Text style={[styles.badgeText, activeTab === status.key && styles.activeBadgeText]}>
                {getPostCount(status.key)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Posts List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={STATUSES.find(s => s.key === activeTab)?.icon as any}
            size={48}
            color={COLORS.textSubtle}
          />
          <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} posts</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'DRAFT'
              ? 'Start creating your first post'
              : activeTab === 'SCHEDULED'
              ? 'Schedule posts to see them here'
              : 'Published posts will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.gold}
            />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 80,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  tabsContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  activeTab: {
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  tabLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  activeTabBadge: {
    backgroundColor: COLORS.goldBorder,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.textSubtle,
    fontWeight: '600',
  },
  activeBadgeText: {
    color: COLORS.gold,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  postContent: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  scheduledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduledText: {
    fontSize: 12,
    color: COLORS.warning,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    textAlign: 'center',
  },
})
