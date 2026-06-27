import React, { useState, useRef, useEffect } from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Animated,
} from 'react-native'
import { useRouter } from 'expo-router'

const ideaCategories = [
	'Trending',
	'For You',
	'Quick Wins',
	'Educational',
	'Viral Hooks',
]

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
]

export default function ContentIdeasScreen() {
	const router = useRouter()
	const [selectedCategory, setSelectedCategory] = useState('Trending')

	const fadeAnim = useRef(new Animated.Value(0)).current

	useEffect(() => {
		fadeAnim.setValue(0)
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 400,
			useNativeDriver: true,
		}).start()
	}, [selectedCategory])

	const filteredIdeas = mockIdeas.filter(
		(idea) =>
			selectedCategory === 'Trending' ||
			idea.category === selectedCategory,
	)

	const getEngagementColor = (level: string) => {
		switch (level) {
			case 'High':
				return '#00FF00'
			case 'Medium':
				return '#FFD700'
			case 'Low':
				return '#FF6B6B'
			default:
				return '#888888'
		}
	}

	return (
		<View style={styles.container}>
			{/* HEADER */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={styles.backButton}>{'⟵'}</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Content Ideas</Text>
				<Text style={styles.icon}>💡</Text>
			</View>

			{/* AI BUTTON */}
			<TouchableOpacity style={styles.aiButton}>
				<Text style={styles.aiEmoji}>✨</Text>
				<Text style={styles.aiText}>Generate AI Ideas for Me</Text>
			</TouchableOpacity>

			{/* CATEGORY FILTERS */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.categories}
				style={{ maxHeight: 40 }}
			>
				{ideaCategories.map((category) => (
					<TouchableOpacity
						key={category}
						style={[
							styles.categoryChip,
							selectedCategory === category &&
								styles.categoryChipActive,
						]}
						onPress={() => setSelectedCategory(category)}
					>
						<Text
							style={[
								styles.categoryText,
								selectedCategory === category &&
									styles.categoryTextActive,
							]}
						>
							{category}
						</Text>
					</TouchableOpacity>
				))}
			</ScrollView>

			{/* IDEAS LIST */}
			<Animated.View style={{ flex: 1, opacity: fadeAnim }}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					{filteredIdeas.map((idea) => (
						<TouchableOpacity key={idea.id} style={styles.ideaCard}>
							<View style={styles.ideaHeader}>
								<Text style={styles.ideaCategory}>
									{idea.category}
								</Text>

								<View style={styles.badges}>
									<View
										style={[
											styles.badge,
											{
												backgroundColor:
													getEngagementColor(
														idea.engagement,
													) + '20',
											},
										]}
									>
										<Text
											style={[
												styles.badgeText,
												{
													color: getEngagementColor(
														idea.engagement,
													),
												},
											]}
										>
											{idea.engagement}
										</Text>
									</View>

									<View style={styles.badge}>
										<Text style={styles.badgeText}>
											{idea.difficulty}
										</Text>
									</View>
								</View>
							</View>

							<Text style={styles.ideaTitle}>{idea.title}</Text>
							<Text style={styles.ideaDescription}>
								{idea.description}
							</Text>

							<View style={styles.ideaActions}>
								<TouchableOpacity style={styles.actionButton}>
									<Text>❤️ Save</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.actionButton,
										styles.primaryAction,
									]}
								>
									<Text style={{ color: '#000' }}>
										✍️ Use This
									</Text>
								</TouchableOpacity>
							</View>
						</TouchableOpacity>
					))}

					<View style={{ height: 100 }} />
				</ScrollView>
			</Animated.View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
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
		fontWeight: '900',
		color: '#fff',
	},

	headerTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#fff',
	},

	icon: {
		fontSize: 24,
	},

	aiButton: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: '#00D9FF',
		marginHorizontal: 24,
		marginBottom: 20,
		paddingVertical: 14,
		borderRadius: 12,
	},

	aiEmoji: {
		marginRight: 8,
	},

	aiText: {
		fontWeight: '700',
		color: '#000',
	},

	// ✅ FIXED HERE
	categories: {
		paddingHorizontal: 24,
		gap: 10,
		alignItems: 'flex-start', // prevents stretch
	},

	categoryChip: {
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.1)',
		alignSelf: 'flex-start', // 🔥 prevents vertical stretch
	},

	categoryChipActive: {
		backgroundColor: '#00D9FF',
		borderColor: '#00D9FF',
	},

	categoryText: {
		fontSize: 13,
		fontWeight: '600',
		color: 'rgba(255,255,255,0.6)',
	},

	categoryTextActive: {
		color: '#000',
	},

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
		marginBottom: 12,
	},

	ideaCategory: {
		fontSize: 12,
		fontWeight: '700',
		color: '#00D9FF',
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
		color: '#ccc',
	},

	ideaTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#fff',
		marginBottom: 8,
	},

	ideaDescription: {
		color: '#aaa',
		marginBottom: 16,
	},

	ideaActions: {
		flexDirection: 'row',
		gap: 12,
	},

	actionButton: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255,0.05)',
	},

	primaryAction: {
		backgroundColor: '#00D9FF',
	},
})
