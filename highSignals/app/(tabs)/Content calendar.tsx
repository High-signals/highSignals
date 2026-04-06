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
  const scaleAnim = new Animated.Value(0.9);

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const today = new Date().getDate();

  const hasPost = (day: number) => {
    return scheduledPosts.some((post) => post.date === day);
  };

  const getPostsForDay = (day: number) => {
    return scheduledPosts.filter((post) => post.date === day);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Calendar</Text>
        <TouchableOpacity>
          <Text style={styles.icon}>📅</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
              } else {
                setCurrentMonth(currentMonth - 1);
              }
            }}
          >
            <Text style={styles.arrowButton}>←</Text>
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {monthNames[currentMonth]} {currentYear}
          </Text>

          <TouchableOpacity
            onPress={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
              } else {
                setCurrentMonth(currentMonth + 1);
              }
            }}
          >
            <Text style={styles.arrowButton}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <Animated.View style={[styles.calendar, { transform: [{ scale: scaleAnim }] }]}>
          {/* Day Labels */}
          <View style={styles.dayLabels}>
            {daysOfWeek.map((day) => (
              <Text key={day} style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}

            {/* Actual days */}
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
        </Animated.View>

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
                  <Text style={styles.postTime}>⏰ {post.time}</Text>
                  <Text style={styles.postPlatform}>📱 {post.platform}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editIcon}>✏️</Text>
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

  // Month Selector
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  arrowButton: {
    fontSize: 24,
    color: '#00D9FF',
    fontWeight: '600',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Calendar
  calendar: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: '#00D9FF',
    borderRadius: 8,
  },
  scheduledCell: {
    backgroundColor: 'rgba(0,217,255,0.2)',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  todayNumber: {
    color: '#000000',
    fontWeight: '800',
  },
  scheduledNumber: {
    color: '#00D9FF',
    fontWeight: '800',
  },
  postDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00FF00',
    position: 'absolute',
    bottom: 4,
  },

  // Upcoming Posts
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
  },
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  postDate: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  postDay: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
  },
  postMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    textTransform: 'uppercase',
  },
  postContent: {
    flex: 1,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  postMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  postTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  postPlatform: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 18,
  },
});