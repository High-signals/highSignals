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

  const filteredIdeas = mockIdeas.filter(
    (idea) => selectedCategory === 'Trending' || idea.category === selectedCategory
  );

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'High':
        return COLORS.success;
      case 'Medium':
        return COLORS.warning;
      case 'Low':
        return COLORS.error;
      default:
        return COLORS.textSubtle;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Ideas</Text>
        <View style={styles.headerIconWrap}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.gold} />
        </View>
      </View>

      {/* AI Generate Button */}
      <TouchableOpacity style={styles.aiButton} activeOpacity={0.8}>
        <Ionicons name="sparkles-outline" size={20} color={COLORS.background} />
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
                <Ionicons name="heart-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                <Ionicons name="create-outline" size={16} color={COLORS.background} />
                <Text style={[styles.actionText, styles.primaryActionText]}>Use This</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

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
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  aiText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },
  categories: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  categoryChipActive: {
    backgroundColor: COLORS.gold,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  categoryTextActive: {
    color: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  ideaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ideaCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  ideaTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 24,
  },
  ideaDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: SPACING.md,
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
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 6,
  },
  primaryAction: {
    backgroundColor: COLORS.gold,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  primaryActionText: {
    color: COLORS.background,
  },
});
