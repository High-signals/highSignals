import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

type TimePeriod = '7d' | '30d' | '90d';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<TimePeriod>('7d');

  const stats = {
    totalViews: '45.2K',
    totalPosts: 28,
    avgScore: 87,
    engagement: '12.4%',
  };

  const topPosts = [
    { title: '5 Quick Breakfast Ideas', views: '12.5K', platform: 'TikTok' },
    { title: 'Morning Routine', views: '8.2K', platform: 'Instagram' },
    { title: 'Video Editing Tips', views: '6.1K', platform: 'YouTube' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.headerIconWrap}>
          <Ionicons name="bar-chart-outline" size={20} color={COLORS.gold} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['7d', '30d', '90d'] as TimePeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <View style={styles.statIconWrap}>
              <Ionicons name="eye-outline" size={22} color={COLORS.gold} />
            </View>
            <Text style={styles.statNumber}>{stats.totalViews}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
            <View style={styles.statChange}>
              <Ionicons name="trending-up" size={14} color={COLORS.success} />
              <Text style={styles.statChangeText}>+24% from last period</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconSmall}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.gold} />
            </View>
            <Text style={styles.statNumber}>{stats.totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconSmall}>
              <Ionicons name="star-outline" size={18} color={COLORS.gold} />
            </View>
            <Text style={styles.statNumber}>{stats.avgScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconSmall}>
              <Ionicons name="heart-outline" size={18} color={COLORS.gold} />
            </View>
            <Text style={styles.statNumber}>{stats.engagement}</Text>
            <Text style={styles.statLabel}>Engagement</Text>
          </View>
        </View>

        {/* Performance Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Performance Over Time</Text>
          <View>
            <View style={styles.chartBars}>
              {[40, 65, 55, 80, 70, 90, 75].map((height, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={[styles.bar, { height: `${height}%` }]} />
                </View>
              ))}
            </View>
            <View style={styles.chartLabels}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <Text key={day} style={styles.chartLabel}>{day}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Platform Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Breakdown</Text>

          {[
            { name: 'TikTok', views: '18.2K', pct: 60, color: '#69C9D0' },
            { name: 'Instagram', views: '14.5K', pct: 48, color: '#E4405F' },
            { name: 'YouTube', views: '12.5K', pct: 41, color: '#FF0000' },
          ].map((platform) => (
            <View key={platform.name} style={styles.platformCard}>
              <View style={styles.platformHeader}>
                <View style={styles.platformLeft}>
                  <View style={[styles.platformDot, { backgroundColor: platform.color }]} />
                  <Text style={styles.platformName}>{platform.name}</Text>
                </View>
                <Text style={styles.platformViews}>{platform.views} views</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${platform.pct}%`, backgroundColor: COLORS.gold }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Top Performing Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Posts</Text>

          {topPosts.map((post, index) => (
            <View key={index} style={styles.topPostCard}>
              <View style={styles.topPostRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.topPostContent}>
                <Text style={styles.topPostTitle}>{post.title}</Text>
                <Text style={styles.topPostPlatform}>{post.platform}</Text>
              </View>
              <Text style={styles.topPostViews}>{post.views}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.gold,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  periodTextActive: {
    color: COLORS.background,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: 12,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  primaryCard: {
    width: '100%',
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statIconSmall: {
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: 4,
  },
  statChangeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },

  // Chart
  chartCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chartBars: {
    flexDirection: 'row',
    height: 150,
    gap: SPACING.sm,
    marginBottom: 12,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: COLORS.gold,
    borderRadius: 3,
    width: '100%',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chartLabel: {
    fontSize: 11,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },

  // Sections
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Platform Cards
  platformCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  platformViews: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gold,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Top Posts
  topPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACING.sm,
  },
  topPostRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gold,
  },
  topPostContent: {
    flex: 1,
  },
  topPostTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  topPostPlatform: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  topPostViews: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gold,
  },
});
