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

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const scheduledPosts = [
  { date: 15, title: 'Morning Routine', time: '9:00 AM', platform: 'TikTok' },
  { date: 18, title: 'Cooking Tutorial', time: '2:00 PM', platform: 'Instagram' },
  { date: 22, title: 'Tech Review', time: '10:00 AM', platform: 'YouTube' },
  { date: 25, title: 'Q&A Session', time: '6:00 PM', platform: 'TikTok' },
];

export default function ContentCalendarScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const today = new Date().getDate();

  const hasPost = (day: number) => scheduledPosts.some((post) => post.date === day);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Calendar</Text>
        <View style={styles.headerIconWrap}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.gold} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
              } else {
                setCurrentMonth(currentMonth - 1);
              }
            }}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.gold} />
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {monthNames[currentMonth]} {currentYear}
          </Text>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
              } else {
                setCurrentMonth(currentMonth + 1);
              }
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendar}>
          <View style={styles.dayLabels}>
            {daysOfWeek.map((day) => (
              <Text key={day} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: firstDay }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const isToday = day === today && currentMonth === new Date().getMonth();
              const hasScheduled = hasPost(day);

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    hasScheduled && styles.scheduledCell,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isToday && styles.todayNumber,
                      hasScheduled && styles.scheduledNumber,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasScheduled && <View style={styles.postDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Upcoming Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Posts</Text>

          {scheduledPosts.map((post, index) => (
            <View key={index} style={styles.postCard}>
              <View style={styles.postDate}>
                <Text style={styles.postDay}>{post.date}</Text>
                <Text style={styles.postMonth}>{monthNames[currentMonth]}</Text>
              </View>

              <View style={styles.postContent}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <View style={styles.postMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textSubtle} />
                    <Text style={styles.metaText}>{post.time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="phone-portrait-outline" size={12} color={COLORS.textSubtle} />
                    <Text style={styles.metaText}>{post.platform}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="create-outline" size={18} color={COLORS.gold} />
              </TouchableOpacity>
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
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  calendar: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  todayCell: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.sm,
  },
  scheduledCell: {
    backgroundColor: COLORS.goldMuted,
    borderRadius: RADIUS.sm,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  todayNumber: {
    color: COLORS.background,
    fontWeight: '700',
  },
  scheduledNumber: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  postDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    position: 'absolute',
    bottom: 4,
  },
  section: {
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  postDate: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  postDay: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gold,
  },
  postMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gold,
    textTransform: 'uppercase',
  },
  postContent: {
    flex: 1,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  postMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
