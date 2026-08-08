import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { api, postsEvents } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

const STAGES = [
  { key: 'IDEA', label: 'Idea', icon: 'bulb-outline', color: '#3b82f6' },
  { key: 'SCRIPTING', label: 'Scripting', icon: 'create-outline', color: COLORS.textSubtle },
  { key: 'RECORDING', label: 'Recording', icon: 'mic-outline', color: '#ec4899' },
  { key: 'EDITING', label: 'Editing', icon: 'cut-outline', color: COLORS.warning },
  { key: 'POSTED', label: 'Posted', icon: 'checkmark-done-outline', color: COLORS.success },
]

const STATUSES = STAGES

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

const isMatch = (postStatus: string, tab: string) => {
  const norm = getNormalizedStage(postStatus)
  return norm === tab
}

const getNormalizedStage = (status: string): string => {
  if (status === 'DRAFT') return 'SCRIPTING'
  if (status === 'SCHEDULED') return 'EDITING'
  if (status === 'PUBLISHED') return 'POSTED'
  return status || 'IDEA'
}

const getNextStage = (currentStatus: string): string => {
  const norm = getNormalizedStage(currentStatus)
  const idx = STAGES.findIndex((s) => s.key === norm)
  if (idx >= 0 && idx < STAGES.length - 1) {
    return STAGES[idx + 1].key
  }
  return STAGES[0].key
}

export default function PostsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ tab?: string }>()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('IDEA')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [selectedPostForStatus, setSelectedPostForStatus] = useState<Post | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  useEffect(() => {
    if (params.tab && STATUSES.some(s => s.key === params.tab)) {
      setActiveTab(params.tab)
    }
  }, [params.tab])

  const fetchPosts = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const allPostsData = await api.posts.getAll()
      setAllPosts(allPostsData || [])
      const filtered = (allPostsData || []).filter(
        (p: Post) => isMatch(p.status, activeTab)
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

  useFocusEffect(
    useCallback(() => {
      fetchPosts()
    }, [fetchPosts])
  )

  useEffect(() => {
    const unsubscribe = postsEvents.onChange(() => {
      fetchPosts()
    })
    return unsubscribe
  }, [fetchPosts])

  useEffect(() => {
    if (allPosts.length > 0) {
      setPosts(allPosts.filter((p: Post) => isMatch(p.status, activeTab)))
    }
  }, [activeTab, allPosts])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPosts()
  }, [fetchPosts])

  const handleUpdateStatus = async (post: Post, newStatus: string) => {
    if (post.status === newStatus) {
      setSelectedPostForStatus(null)
      return
    }

    setUpdatingStatusId(post.id)
    try {
      await api.posts.update(post.id, { status: newStatus })
      setSelectedPostForStatus(null)
      fetchPosts()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const getStatusColor = (status: string) => {
    const norm = getNormalizedStage(status)
    return STAGES.find(s => s.key === norm)?.color || COLORS.textSubtle
  }

  const getStatusLabel = (status: string) => {
    const norm = getNormalizedStage(status)
    const found = STAGES.find((s) => s.key === norm)
    return found ? found.label : status
  }

  const SwipeablePostCard = ({ post }: { post: Post }) => {
    const pan = useRef(new Animated.ValueXY()).current

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 70) {
            const next = getNextStage(post.status)
            Animated.timing(pan, {
              toValue: { x: 300, y: 0 },
              duration: 150,
              useNativeDriver: false,
            }).start(() => {
              pan.setValue({ x: 0, y: 0 })
              handleUpdateStatus(post, next)
            })
          } else if (gestureState.dx < -70) {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start()
            setSelectedPostForStatus(post)
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start()
          }
        },
      })
    ).current

    return (
      <Animated.View
        style={[
          styles.postCardContainer,
          { transform: [{ translateX: pan.x }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.postCard}
          activeOpacity={0.85}
          onPress={() =>
            router.push(`/(tabs)/post-detail?postId=${post.id}` as any)
          }
        >
          <View style={styles.postHeader}>
            <Text style={styles.postTitle} numberOfLines={1}>
              {post.title || 'Untitled Post'}
            </Text>

            <TouchableOpacity
              style={[
                styles.statusPill,
                { borderColor: getStatusColor(post.status) + '44' },
              ]}
              onPress={(e) => {
                e.stopPropagation()
                setSelectedPostForStatus(post)
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(post.status) },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: getStatusColor(post.status) },
                ]}
              >
                {getStatusLabel(post.status)}
              </Text>
              <Ionicons
                name='chevron-down'
                size={12}
                color={getStatusColor(post.status)}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.postContent} numberOfLines={2}>
            {post.content.replace(/<[^>]*>?/gm, '')}
          </Text>

          <View style={styles.postFooter}>
            <Text style={styles.dateText}>
              {new Date(post.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.swipeHintText}>Swipe → next stage</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const getPostCount = (statusKey: string) => {
    return allPosts.filter((p) => isMatch(p.status, statusKey)).length
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Content Pipeline</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUSES.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[styles.tab, activeTab === status.key && styles.activeTab]}
            onPress={() => setActiveTab(status.key)}
          >
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
              <Text
                style={[
                  styles.badgeText,
                  activeTab === status.key && styles.activeBadgeText,
                ]}
              >
                {getPostCount(status.key)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.gold} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={STATUSES.find((s) => s.key === activeTab)?.icon as any}
            size={48}
            color={COLORS.textSubtle}
          />
          <Text style={styles.emptyTitle}>
            No {STATUSES.find((s) => s.key === activeTab)?.label.toLowerCase() || 'content'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'IDEA'
              ? 'Capture your thoughts and initial ideas here'
              : activeTab === 'SCRIPTING'
              ? 'Start writing and structuring your script'
              : activeTab === 'RECORDING'
              ? 'Record voice or audio for your posts'
              : activeTab === 'EDITING'
              ? 'Refine and edit content before posting'
              : 'Posted content will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => <SwipeablePostCard post={item} />}
          keyExtractor={(item) => item.id}
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

      <Modal
        visible={!!selectedPostForStatus}
        transparent
        animationType='fade'
        onRequestClose={() => setSelectedPostForStatus(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPostForStatus(null)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {selectedPostForStatus?.title
                  ? `Update status: ${selectedPostForStatus.title}`
                  : 'Update Post Status'}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedPostForStatus(null)}
              >
                <Ionicons name='close-circle' size={24} color='#666666' />
              </TouchableOpacity>
            </View>

            <View style={styles.stageOptionsList}>
              {STAGES.map((stage) => {
                const isCurrent =
                  getNormalizedStage(selectedPostForStatus?.status || '') ===
                  stage.key
                const isUpdatingThis =
                  updatingStatusId === selectedPostForStatus?.id

                return (
                  <TouchableOpacity
                    key={stage.key}
                    style={[
                      styles.stageOptionRow,
                      isCurrent && styles.stageOptionRowActive,
                    ]}
                    onPress={() =>
                      selectedPostForStatus &&
                      handleUpdateStatus(selectedPostForStatus, stage.key)
                    }
                    disabled={isUpdatingThis}
                  >
                    <View style={styles.stageLeft}>
                      <View
                        style={[
                          styles.stageIconBg,
                          { backgroundColor: stage.color + '22' },
                        ]}
                      >
                        <Ionicons
                          name={stage.icon as any}
                          size={18}
                          color={stage.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.stageLabel,
                          isCurrent && styles.stageLabelActive,
                        ]}
                      >
                        {stage.label}
                      </Text>
                    </View>

                    {isCurrent && (
                      <Ionicons
                        name='checkmark'
                        size={18}
                        color={COLORS.gold}
                      />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  postCardContainer: {
    marginBottom: SPACING.sm,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  swipeHintText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#161618',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  stageOptionsList: {
    gap: 8,
    paddingBottom: 10,
  },
  stageOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  stageOptionRowActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: COLORS.goldBorder,
  },
  stageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  stageLabelActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },
})
