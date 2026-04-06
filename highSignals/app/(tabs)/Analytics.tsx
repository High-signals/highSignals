import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';

type TimePeriod = '7d' | '30d' | '90d';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const scaleAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity>
          <Text style={styles.icon}>📊</Text>
        </TouchableOpacity>
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
        <Animated.View style={[styles.statsGrid, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statEmoji}>👁️</Text>
            <Text style={styles.statNumber}>{stats.totalViews}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
            <View style={styles.statChange}>
              <Text style={styles.statChangeIcon}>↗️</Text>
              <Text style={styles.statChangeText}>+24% from last period</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={styles.statNumber}>{stats.totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNumber}>{stats.avgScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>❤️</Text>
            <Text style={styles.statNumber}>{stats.engagement}</Text>
            <Text style={styles.statLabel}>Engagement</Text>
          </View>
        </Animated.View>

        {/* Performance Chart Placeholder */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Performance Over Time</Text>
          <View style={styles.chartPlaceholder}>
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
          
          <View style={styles.platformCard}>
            <View style={styles.platformHeader}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformDot, { backgroundColor: '#000000' }]} />
                <Text style={styles.platformName}>TikTok</Text>
              </View>
              <Text style={styles.platformViews}>18.2K views</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%', backgroundColor: '#00D9FF' }]} />
            </View>
          </View>

          <View style={styles.platformCard}>
            <View style={styles.platformHeader}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformDot, { backgroundColor: '#E4405F' }]} />
                <Text style={styles.platformName}>Instagram</Text>
              </View>
              <Text style={styles.platformViews}>14.5K views</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '48%', backgroundColor: '#00D9FF' }]} />
            </View>
          </View>

          <View style={styles.platformCard}>
            <View style={styles.platformHeader}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformDot, { backgroundColor: '#FF0000' }]} />
                <Text style={styles.platformName}>YouTube</Text>
              </View>
              <Text style={styles.platformViews}>12.5K views</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '41%', backgroundColor: '#00D9FF' }]} />
            </View>
          </View>
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
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  icon: {
    fontSize: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  periodButtonActive: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  periodTextActive: {
    color: '#000000',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  primaryCard: {
    width: '100%',
    backgroundColor: 'rgba(0,217,255,0.1)',
    borderColor: '#00D9FF',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  statChangeIcon: {
    fontSize: 12,
  },
  statChangeText: {
    fontSize: 12,
    color: '#00FF00',
    fontWeight: '600',
  },

  // Chart
  chartCard: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 20,
  },
  chartPlaceholder: {
    // Chart container
  },
  chartBars: {
    flexDirection: 'row',
    height: 150,
    gap: 8,
    marginBottom: 12,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: '#00D9FF',
    borderRadius: 4,
    width: '100%',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chartLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
  },

  // Platform Cards
  platformCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  platformViews: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9FF',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Top Posts
  topPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topPostRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  topPostContent: {
    flex: 1,
  },
  topPostTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  topPostPlatform: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  topPostViews: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00D9FF',
  },
});