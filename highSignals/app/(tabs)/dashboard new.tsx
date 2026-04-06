import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const userData = {
    name: 'Samuel',
    initial: 'S',
    streak: 12,
    date: 'Sunday, March 29, 2026',
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
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                style={styles.profileIcon}
                onPress={() => router.push('/tabs/profile')}
              >
                <Text style={styles.profileInitial}>{userData.initial}</Text>
              </TouchableOpacity>
              <View style={styles.streakBadge}>
                <Text style={styles.streakIcon}>✨</Text>
                <Text style={styles.streakText}>v{userData.streak}</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton}>
                <Text style={styles.icon}>⚡</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Text style={styles.icon}>🔔</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>My HighSignals</Text>
            <Text style={styles.date}>{userData.date}</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Find any post, idea or draft"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            <Text style={styles.searchIcon}>🔍</Text>
          </View>

          {/* Main Action Cards */}
          <Animated.View 
            style={[
              styles.mainCards,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* New Content Card */}
            <TouchableOpacity 
              style={[styles.actionCard, styles.greenCard]}
              onPress={() => router.push('/tabs/create-post')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>+</Text>
                <Text style={styles.cardTitle}>New content</Text>
              </View>
              <View style={styles.cardIllustration}>
                <View style={styles.illustrationBox}>
                  <View style={styles.illustrationLine} />
                  <View style={styles.illustrationLine} />
                  <View style={styles.illustrationLine} />
                </View>
              </View>
            </TouchableOpacity>

            {/* View Drafts Card */}
            <TouchableOpacity 
              style={[styles.actionCard, styles.purpleCard]}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>+</Text>
                <Text style={styles.cardTitle}>View drafts</Text>
              </View>
              <View style={styles.cardIllustration}>
                <View style={styles.draftIllustration}>
                  <View style={styles.draftItem}>
                    <View style={styles.draftCheck}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <View style={styles.draftLines}>
                      <View style={styles.draftLine} />
                      <View style={styles.draftLine} />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickIcon}>📅</Text>
              </View>
              <Text style={styles.quickActionLabel}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickIcon}>📊</Text>
              </View>
              <Text style={styles.quickActionLabel}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickIcon}>🎙️</Text>
              </View>
              <Text style={styles.quickActionLabel}>Ideas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickIcon}>📸</Text>
              </View>
              <Text style={styles.quickActionLabel}>Media</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
  },
  streakBadge: {
    backgroundColor: 'rgba(100,100,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(100,100,255,0.5)',
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },

  // Title
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },

  // Search
  searchContainer: {
    marginHorizontal: 24,
    marginBottom: 30,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingRight: 50,
  },
  searchIcon: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -12,
    fontSize: 20,
  },

  // Main Action Cards
  mainCards: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 30,
  },
  actionCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  greenCard: {
    backgroundColor: '#00FF00',
  },
  purpleCard: {
    backgroundColor: '#9D4EDD',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  cardIllustration: {
    marginTop: 20,
  },
  illustrationBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  illustrationLine: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
  },
  draftIllustration: {
    // Purple card illustration
  },
  draftItem: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
  },
  draftCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '800',
  },
  draftLines: {
    flex: 1,
    gap: 6,
  },
  draftLine: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickIcon: {
    fontSize: 28,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});