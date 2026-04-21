import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

type FilterType = 'all' | 'PUBLISHED' | 'SCHEDULED' | 'DRAFT' | 'FAILED'

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

export default function GetContentScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts()
    }
  }, [isAuthenticated])

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const allPosts = await api.posts.getAll()
      setPosts(allPosts || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const allPosts = await api.posts.getAll()
      setPosts(allPosts || [])
    } catch (error) {
      console.error('Error refreshing posts:', error)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const filteredPosts = posts.filter((post) => {
    const matchesFilter = filter === 'all' || post.status === filter
    const matchesSearch = (post.title || 'Untitled')
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PUBLISHED: '#00FF00',
      SCHEDULED: '#FFD700',
      DRAFT: '#888888',
      FAILED: '#FF6B6B',
    }
    return colors[status] || '#FFFFFF'
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

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => router.push(`/(tabs)/post-detail?postId=${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.postHeader}>
        <View style={styles.postLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <Text style={styles.platformName}>{item.platforms?.[0] || 'N/A'}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.postTitle} numberOfLines={2}>
        {item.title || 'Untitled Post'}
      </Text>

      <Text style={styles.postContent} numberOfLines={2}>
        {item.content}
      </Text>

      <View style={styles.postFooter}>
        <Text style={styles.postDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.platformTags}>
          {item.platforms?.slice(0, 2).map((platform, idx) => (
            <View key={idx} style={styles.platformTag}>
              <Ionicons
                name={getPlatformIcon(platform) as any}
                size={12}
                color='#d4af37'
              />
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  )

  const emptyComponent = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyText}>
        {filter === 'all' ? 'No content found' : `No ${filter.toLowerCase()} posts`}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try adjusting your search' : 'Create your first post to get started'}
      </Text>
    </View>
  )

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size='large' color='#d4af37' />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Content</Text>
          <Text style={styles.headerSubtitle}>
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/create-post')}>
          <Ionicons name='add-circle-outline' size={28} color='#d4af37' />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name='search-outline' size={20} color='rgba(255,255,255,0.4)' />
        <TextInput
          style={styles.searchInput}
          placeholder='Search content...'
          placeholderTextColor='rgba(255,255,255,0.4)'
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['all', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === 'all' ? 'All' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Post List */}
      {filteredPosts.length === 0 ? (
        emptyComponent
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor='#d4af37'
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#ffffff',
    fontSize: 14,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterButtonActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  filterTextActive: {
    color: '#0a192f',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 22,
  },
  postContent: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  platformTags: {
    flexDirection: 'row',
    gap: 4,
  },
  platformTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
})
