import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react';
import { useRouter } from 'expo-router';

const ideaCategories = ['Trending', 'For You', 'Quick Wins', 'Educational', 'Viral Hooks'];

const mockIdeas = [
  {
    id: '1',
    category: 'Trending',
    title: '"Day in my life as a..."',
    description: 'Show your daily routine in a fun, relatable way',
    engagement: 'High',
    difficulty: 'Easy',
  },
  {
    id: '2',
    category: 'Quick Wins',
    title: '3 things I wish I knew earlier',
    description: 'Share valuable lessons from your journey',
    engagement: 'Medium',
    difficulty: 'Easy',
  },
  {
    id: '3',
    category: 'Viral Hooks',
    title: '"Stop doing [X], do [Y] instead"',
    description: 'Counter-intuitive advice that challenges common beliefs',
    engagement: 'High',
    difficulty: 'Medium',
  },
  {
    id: '4',
    category: 'Educational',
    title: 'Behind the scenes of creating content',
    description: 'Show your creative process step-by-step',
    engagement: 'Medium',
    difficulty: 'Medium',
  },
];

export default function ContentIdeasScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [selectedCategory]);

  const filteredIdeas = mockIdeas.filter(
    (idea) => selectedCategory === 'Trending' || idea.category === selectedCategory
  );

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'High':
        return '#00FF00';
      case 'Medium':
        return '#FFD700';
      case 'Low':
        return '#FF6B6B';
      default:
        return '#888888';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Ideas</Text>
        <TouchableOpacity>
          <Text style={styles.icon}>💡</Text>
        </TouchableOpacity>
      </View>

      {/* AI Generate Button */}
      <TouchableOpacity style={styles.aiButton}>
        <Text style={styles.aiEmoji}>✨</Text>
        <Text style={styles.aiText}>Generate AI Ideas for Me</Text>
      </TouchableOpacity>

      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {ideaCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ideas List */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredIdeas.map((idea) => (
            <TouchableOpacity key={idea.id} style={styles.ideaCard}>
              <View style={styles.ideaHeader}>
                <Text style={styles.ideaCategory}>{idea.category}</Text>
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: getEngagementColor(idea.engagement) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getEngagementColor(idea.engagement) }]}>
                      {idea.engagement}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{idea.difficulty}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.ideaTitle}>{idea.title}</Text>
              <Text style={styles.ideaDescription}>{idea.description}</Text>

              <View style={styles.ideaActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>❤️</Text>
                  <Text style={styles.actionText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                  <Text style={styles.actionIcon}>✍️</Text>
                  <Text style={[styles.actionText, styles.primaryActionText]}>Use This</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
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

  // AI Button
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D9FF',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  aiEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  aiText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },

  // Categories
  categories: {
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryChipActive: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  categoryTextActive: {
    color: '#000000',
  },

  // Ideas List
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  ideaCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ideaCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D9FF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  ideaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 24,
  },
  ideaDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 16,
  },
  ideaActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  primaryAction: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  primaryActionText: {
    color: '#000000',
  },
});