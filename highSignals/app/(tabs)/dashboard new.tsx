import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

interface Post {
  id: string;
  title?: string;
  content: string;
  status: string;
  createdAt: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const userName = user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const userAvatar = user?.avatar || null;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useFocusEffect(
    useCallback(() => {
      fetchRecentPosts();
    }, [])
  );

  const fetchRecentPosts = async () => {
    try {
      setLoadingPosts(true);
      const allPosts = await api.posts.getAll();
      setRecentPosts((allPosts || []).slice(0, 3));
    } catch {
      setRecentPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return COLORS.textSubtle;
      case 'SCHEDULED': return COLORS.warning;
      case 'PUBLISHED': return COLORS.success;
      default: return COLORS.textSubtle;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.profileIconWrap}
                onPress={() => router.push('/(tabs)/profile' as any)}
              >
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileInitialWrap}>
                    <Text style={styles.profileInitial}>{userInitial}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.userName}>{userName}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.dateSection}>
            <Text style={styles.date}>{today}</Text>
          </View>

          {/* Action Cards */}
          <View style={styles.mainCards}>
            <TouchableOpacity
              style={[styles.actionCard, styles.goldCard]}
              onPress={() => router.push('/(tabs)/create-post')}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="create-outline" size={24} color={COLORS.background} />
                </View>
                <Text style={styles.goldCardTitle}>New content</Text>
                <Text style={styles.goldCardSub}>Create a post</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={COLORS.background} style={styles.cardArrow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.surfaceCard]}
              onPress={() => router.push('/(tabs)/posts')}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIconWrapOutline}>
                  <Ionicons name="documents-outline" size={24} color={COLORS.gold} />
                </View>
                <Text style={styles.surfaceCardTitle}>View drafts</Text>
                <Text style={styles.surfaceCardSub}>Manage posts</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={COLORS.gold} style={styles.cardArrow} />
            </TouchableOpacity>
          </View>

          {/* Recent Posts */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent</Text>
              {recentPosts.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/posts')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingPosts ? (
              <ActivityIndicator size="small" color={COLORS.gold} style={{ marginTop: SPACING.md }} />
            ) : recentPosts.length === 0 ? (
              <View style={styles.emptyRecent}>
                <Text style={styles.emptyRecentText}>No posts yet. Create your first one!</Text>
              </View>
            ) : (
              recentPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.recentCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/(tabs)/post-detail?postId=${post.id}` as any)}
                >
                  <View style={styles.recentCardLeft}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(post.status) }]} />
                    <View style={styles.recentCardContent}>
                      <Text style={styles.recentCardTitle} numberOfLines={1}>
                        {post.title || 'Untitled'}
                      </Text>
                      <Text style={styles.recentCardPreview} numberOfLines={1}>
                        {post.content}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textSubtle} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileInitialWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  date: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  mainCards: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  goldCard: {
    backgroundColor: COLORS.gold,
  },
  surfaceCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  cardContent: {
    gap: SPACING.xs,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(10,25,47,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardIconWrapOutline: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  goldCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
  goldCardSub: {
    fontSize: 13,
    color: 'rgba(10,25,47,0.6)',
  },
  surfaceCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  surfaceCardSub: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  cardArrow: {
    alignSelf: 'flex-end',
  },

  // Recent Posts
  recentSection: {
    paddingHorizontal: SPACING.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: '500',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACING.sm,
  },
  recentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  recentCardContent: {
    flex: 1,
  },
  recentCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  recentCardPreview: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  emptyRecent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
});
