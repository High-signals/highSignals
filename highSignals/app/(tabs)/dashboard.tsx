import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { VictoryPie, VictoryChart, VictoryBar, VictoryTheme, VictoryAxis } from 'victory-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  // Real data for charts
  const contentByPlatform = [
    { platform: 'LinkedIn', posts: 12, color: '#0077B5' },
    { platform: 'Twitter', posts: 8, color: '#1DA1F2' },
    { platform: 'Instagram', posts: 5, color: '#E4405F' },
    { platform: 'Facebook', posts: 3, color: '#4267B2' },
  ];

  const weeklyActivity = [
    { day: 'Mon', posts: 2 },
    { day: 'Tue', posts: 1 },
    { day: 'Wed', posts: 3 },
    { day: 'Thu', posts: 0 },
    { day: 'Fri', posts: 2 },
    { day: 'Sat', posts: 1 },
    { day: 'Sun', posts: 0 },
  ];

  const scoreDistribution = [
    { range: '90-100', count: 8, color: '#00C853' },
    { range: '80-89', count: 12, color: '#d4af37' },
    { range: '70-79', count: 5, color: '#FF9800' },
    { range: '<70', count: 3, color: '#FF5252' },
  ];

  const userData = {
    name: 'Samuel',
    streak: 12,
    totalPosts: 28,
    averageScore: 87,
    postsThisWeek: 5,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userData.name} 👋</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakNumber}>{userData.streak}</Text>
          <Text style={styles.streakLabel}>🔥 Day Streak</Text>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatNumber}>{userData.totalPosts}</Text>
          <Text style={styles.quickStatLabel}>Total Posts</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatNumber}>{userData.averageScore}%</Text>
          <Text style={styles.quickStatLabel}>Avg Score</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatNumber}>{userData.postsThisWeek}</Text>
          <Text style={styles.quickStatLabel}>This Week</Text>
        </View>
      </View>

      {/* Content by Platform - Pie Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Content by Platform</Text>
        <View style={styles.pieChartContainer}>
          <VictoryPie
            data={contentByPlatform}
            x="platform"
            y="posts"
            width={width - 48}
            height={220}
            colorScale={contentByPlatform.map(d => d.color)}
            innerRadius={60}
            labelRadius={80}
            style={{
              labels: { fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }
            }}
          />
        </View>
        <View style={styles.legend}>
          {contentByPlatform.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.platform}: {item.posts}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Weekly Activity - Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Activity</Text>
        <VictoryChart
          theme={VictoryTheme.material}
          width={width - 48}
          height={200}
          domainPadding={{ x: 20 }}
        >
          <VictoryAxis
            style={{
              axis: { stroke: 'rgba(255,255,255,0.2)' },
              tickLabels: { fill: '#ffffff', fontSize: 12 }
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: 'rgba(255,255,255,0.2)' },
              tickLabels: { fill: '#ffffff', fontSize: 12 },
              grid: { stroke: 'rgba(255,255,255,0.1)' }
            }}
          />
          <VictoryBar
            data={weeklyActivity}
            x="day"
            y="posts"
            style={{
              data: { fill: '#d4af37' }
            }}
            cornerRadius={{ top: 4 }}
          />
        </VictoryChart>
      </View>

      {/* Score Distribution */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Score Distribution</Text>
        <View style={styles.scoreDistContainer}>
          {scoreDistribution.map((item, index) => (
            <View key={index} style={styles.scoreDistItem}>
              <View style={styles.scoreDistBar}>
                <View 
                  style={[
                    styles.scoreDistFill,
                    { 
                      width: `${(item.count / 28) * 100}%`,
                      backgroundColor: item.color
                    }
                  ]}
                />
              </View>
              <View style={styles.scoreDistInfo}>
                <Text style={styles.scoreDistRange}>{item.range}</Text>
                <Text style={styles.scoreDistCount}>{item.count} posts</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Posts</Text>
        
        <View style={styles.activityCard}>
          <View style={styles.activityLeft}>
            <View style={[styles.platformDot, { backgroundColor: '#0077B5' }]} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>LinkedIn Post - Growth Tips</Text>
              <Text style={styles.activityDate}>2 days ago</Text>
            </View>
          </View>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>94</Text>
          </View>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityLeft}>
            <View style={[styles.platformDot, { backgroundColor: '#1DA1F2' }]} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Twitter Thread - AI Tools</Text>
              <Text style={styles.activityDate}>4 days ago</Text>
            </View>
          </View>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>88</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  streakBadge: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#d4af37',
  },
  streakLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 2,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },

  // Chart Cards
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
  },

  // Pie Chart
  pieChartContainer: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },

  // Score Distribution
  scoreDistContainer: {
    gap: 12,
  },
  scoreDistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreDistBar: {
    flex: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scoreDistFill: {
    height: '100%',
    borderRadius: 12,
  },
  scoreDistInfo: {
    width: 80,
  },
  scoreDistRange: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  scoreDistCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },

  // Recent Activity
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
  activityCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  scoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.2)',
    borderWidth: 2,
    borderColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#d4af37',
  },
});