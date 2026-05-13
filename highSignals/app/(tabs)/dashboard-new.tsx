import React, { useEffect, useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Animated,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api, postsEvents } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const BRAND = '#d4af37'

type Post = {
	id: string
	title?: string
	content: string
	status: string
	platforms: string[]
	createdAt: string
	scheduledAt?: string | null
	publishedAt?: string | null
}

export default function DashboardScreen() {
	const router = useRouter()
	const { user } = useAuth()
	const fadeAnim = useMemo(() => new Animated.Value(0), [])
	const slideAnim = useMemo(() => new Animated.Value(50), [])
	const [posts, setPosts] = useState<Post[]>([])
	const [profile, setProfile] = useState<any | null>(null)
	const [icp, setIcp] = useState<any | null>(null)
	const [loadingData, setLoadingData] = useState(true)

	useEffect(() => {
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
		]).start()
	}, [fadeAnim, slideAnim])

	useEffect(() => {
		let mounted = true

		const loadDashboard = async () => {
			try {
				const [profileData, postsData, icpData] = await Promise.all([
					api.profile.get().catch(() => null),
					api.posts.getAll().catch(() => []),
					api.icp.get().catch(() => null),
				])

				if (!mounted) return

				setProfile(profileData)
				setPosts(postsData || [])
				setIcp(icpData)
			} finally {
				if (mounted) setLoadingData(false)
			}
		}

		const reloadPosts = async () => {
			try {
				const postsData = await api.posts.getAll().catch(() => [])
				if (mounted) setPosts(postsData || [])
			} catch {}
		}

		loadDashboard()

		const unsubscribe = postsEvents.onChange(reloadPosts)

		return () => {
			mounted = false
			unsubscribe()
		}
	}, [])

	const userName = profile?.name || user?.name || 'there'
	const firstName = userName.split(' ')[0] || userName
	const userInitial =
		userName
			.split(' ')
			.map((part: string) => part[0])
			.join('')
			.toUpperCase()
			.slice(0, 2) || 'U'
	const todayLabel = new Date().toLocaleDateString(undefined, {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})

	const counts = useMemo(
		() =>
			posts.reduce(
				(acc, post) => {
					if (post.status === 'DRAFT') acc.DRAFT += 1
					if (post.status === 'SCHEDULED') acc.SCHEDULED += 1
					if (post.status === 'PUBLISHED') acc.PUBLISHED += 1
					if (post.status === 'FAILED') acc.FAILED += 1
					return acc
				},
				{ DRAFT: 0, SCHEDULED: 0, PUBLISHED: 0, FAILED: 0 },
			),
		[posts],
	)

	const recentPosts = useMemo(
		() =>
			[...posts]
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() -
						new Date(a.createdAt).getTime(),
				)
				.slice(0, 3),
		[posts],
	)

	const nextScheduledPost = useMemo(
		() =>
			[...posts]
				.filter(
					(post) => post.status === 'SCHEDULED' && post.scheduledAt,
				)
				.sort(
					(a, b) =>
						new Date(a.scheduledAt || 0).getTime() -
						new Date(b.scheduledAt || 0).getTime(),
				)[0] || null,
		[posts],
	)

	const hasPosts = posts.length > 0

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					bounces={false}
					contentContainerStyle={styles.scrollContent}
				>
					<Animated.View
						style={[styles.header, { opacity: fadeAnim }]}
					>
						<View style={styles.headerLeft}>
							<TouchableOpacity
								style={styles.profileIcon}
								onPress={() => router.push('/profile')}
							>
								<Text style={styles.profileInitial}>
									{userInitial}
								</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.headerRight}>
							<TouchableOpacity style={styles.iconButton}>
								<Ionicons
									name='notifications'
									size={20}
									color={BRAND}
								/>
							</TouchableOpacity>
						</View>
					</Animated.View>

					<View style={styles.titleSection}>
						<Text style={styles.title}>
							Welcome back, {firstName}
						</Text>
						<Text style={styles.date}>{todayLabel}</Text>
					</View>

					{/* {nextScheduledPost ? (
						<TouchableOpacity
							style={styles.nextCard}
							activeOpacity={0.85}
							onPress={() =>
								router.push(
									`/(tabs)/post-detail?postId=${nextScheduledPost.id}` as any,
								)
							}
						>
							<View style={styles.nextCardTop}>
								<Text style={styles.nextCardLabel}>
									Next scheduled post
								</Text>
								<View style={styles.nextCardPill}>
									<Text style={styles.nextCardPillText}>
										{nextScheduledPost.status}
									</Text>
								</View>
							</View>
							<Text style={styles.nextCardTitle}>
								{nextScheduledPost.title || 'Untitled Post'}
							</Text>
							<Text style={styles.nextCardMeta}>
								{nextScheduledPost.platforms.join(', ')} on{' '}
								{new Date(
									nextScheduledPost.scheduledAt || '',
								).toLocaleString()}
							</Text>
						</TouchableOpacity>
					) : (
						<View style={styles.nextCard}>
							<View style={styles.nextCardTop}>
								<Text style={styles.nextCardLabel}>
									Next scheduled post
								</Text>
								<View style={styles.nextCardPillAlt}>
									<Text style={styles.nextCardPillTextAlt}>
										No schedule yet
									</Text>
								</View>
							</View>
							<Text style={styles.nextCardTitle}>
								No upcoming post is scheduled
							</Text>
							<Text style={styles.nextCardMeta}>
								Use Create to queue your next post and keep the
								calendar full.
							</Text>
						</View>
					)} */}

					<Animated.View
						style={[
							styles.mainCards,
							{
								opacity: fadeAnim,
								transform: [{ translateY: slideAnim }],
							},
						]}
					>
						<TouchableOpacity
							style={[
								styles.actionCard,
								styles.fullWidthCard,
								styles.brandCard,
							]}
							onPress={() => router.push('/GetContent')}
							activeOpacity={0.8}
						>
							<View style={styles.cardHeader}>
								<Ionicons
									name='document-text'
									size={22}
									color='#000000'
								/>
								<Text style={styles.cardTitle}>
									View drafts
								</Text>
							</View>
							<Text style={styles.cardSubtitle}>
								Monitor drafts, scheduled, and published posts
							</Text>
							<View style={styles.cardIllustration}>
								<View style={styles.draftIllustration}>
									<View style={styles.draftItem}>
										<View style={styles.draftCheck}>
											<Ionicons
												name='checkmark'
												size={14}
												color='#000000'
											/>
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

					<View style={styles.statusStrip}>
						<View style={styles.statusCard}>
							<Text style={styles.statusValue}>
								{counts.DRAFT}
							</Text>
							<Text style={styles.statusLabel}>Drafts</Text>
						</View>
						<View style={styles.statusCard}>
							<Text style={styles.statusValue}>
								{counts.SCHEDULED}
							</Text>
							<Text style={styles.statusLabel}>Schedule</Text>
						</View>
						<View style={styles.statusCard}>
							<Text style={styles.statusValue}>
								{counts.PUBLISHED}
							</Text>
							<Text style={styles.statusLabel}>Published</Text>
						</View>
						<View style={styles.statusCard}>
							<Text style={styles.statusValue}>
								{counts.FAILED}
							</Text>
							<Text style={styles.statusLabel}>Failed</Text>
						</View>
					</View>

					<View style={styles.insightCard}>
						<View style={styles.insightHeader}>
							<View style={styles.insightIcon}>
								<Ionicons
									name='sparkles'
									size={16}
									color={BRAND}
								/>
							</View>
							<Text style={styles.insightTitle}>
								Dashboard Insight
							</Text>
						</View>
						<Text style={styles.insightText}>
							{!icp
								? 'Your ICP is still missing. Complete it to unlock sharper post guidance.'
								: !hasPosts
									? 'You are set up. Start with your first post to populate your content pipeline.'
									: nextScheduledPost
										? `Next scheduled post is set for ${new Date(
												nextScheduledPost.scheduledAt ||
													'',
											).toLocaleString()}`
										: 'Your content pipeline is active. Schedule the next post to stay consistent.'}
						</Text>

						<View style={styles.insightDivider} />

						<View style={styles.insightRecentHeader}>
							<Text style={styles.insightRecentTitle}>
								Recent posts
							</Text>
							<TouchableOpacity
								onPress={() => router.push('/GetContent')}
							>
								<Text style={styles.sectionLink}>View all</Text>
							</TouchableOpacity>
						</View>

						{loadingData ? (
							<ActivityIndicator color={BRAND} />
						) : recentPosts.length > 0 ? (
							recentPosts.map((post, idx) => (
								<TouchableOpacity
									key={post.id}
									style={[
										styles.activityRow,
										idx === recentPosts.length - 1 &&
											styles.activityRowLast,
									]}
									onPress={() =>
										router.push(
											`/(tabs)/post-detail?postId=${post.id}` as any,
										)
									}
									activeOpacity={0.8}
								>
									<View
										style={[
											styles.activityDot,
											{
												backgroundColor:
													post.status === 'PUBLISHED'
														? BRAND
														: post.status ===
															  'SCHEDULED'
															? BRAND
															: post.status ===
																  'FAILED'
																? '#FF6B6B'
																: 'rgba(212,175,55,0.4)',
											},
										]}
									/>
									<View style={styles.activityContent}>
										<Text
											style={styles.activityTitle}
											numberOfLines={1}
										>
											{post.title || 'Untitled Post'}
										</Text>
										<Text
											style={styles.activitySubtitle}
											numberOfLines={1}
										>
											{post.status}
										</Text>
									</View>
									<Text style={styles.activityTime}>
										{new Date(
											post.createdAt,
										).toLocaleDateString()}
									</Text>
								</TouchableOpacity>
							))
						) : (
							<Text style={styles.emptyActivityText}>
								No posts yet. Create your first post to start
								seeing activity here.
							</Text>
						)}
					</View>
				</ScrollView>
			</View>
		</SafeAreaView>
	)
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
		paddingBottom: 100,
	},
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
		backgroundColor: BRAND,
		justifyContent: 'center',
		alignItems: 'center',
	},
	profileInitial: {
		fontSize: 24,
		fontWeight: '800',
		color: '#000000',
	},
	userBadge: {
		backgroundColor: 'rgba(255,255,255,0.06)',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
	},
	userBadgeLabel: {
		fontSize: 10,
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		color: 'rgba(255,255,255,0.5)',
		marginBottom: 2,
		fontWeight: '700',
	},
	userBadgeText: {
		fontSize: 12,
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
	titleSection: {
		paddingHorizontal: 24,
		marginBottom: 20,
	},
	title: {
		fontSize: 34,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 8,
	},
	date: {
		fontSize: 16,
		color: 'rgba(255,255,255,0.5)',
	},
	statusStrip: {
		flexDirection: 'row',
		paddingHorizontal: 24,
		gap: 10,
		marginBottom: 18,
		marginTop: 23,
	},
	statusCard: {
		flex: 1,
		paddingVertical: 14,
		paddingHorizontal: 10,
		borderRadius: 16,
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
		alignItems: 'center',
	},
	statusValue: {
		fontSize: 18,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 4,
	},
	statusLabel: {
		fontSize: 9,
		color: 'rgba(255,255,255,0.55)',
		fontWeight: '700',
		textAlign: 'center',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	insightCard: {
		marginHorizontal: 24,
		marginBottom: 18,
		padding: 16,
		borderRadius: 18,
		backgroundColor: 'rgba(212,175,55,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.18)',
	},
	insightHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 10,
	},
	insightIcon: {
		width: 32,
		height: 32,
		borderRadius: 10,
		backgroundColor: 'rgba(212,175,55,0.14)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	insightEmoji: {
		fontSize: 16,
	},
	insightTitle: {
		fontSize: 14,
		fontWeight: '800',
		color: '#d4af37',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	insightText: {
		fontSize: 14,
		lineHeight: 20,
		color: 'rgba(255,255,255,0.85)',
	},
	insightDivider: {
		height: 1,
		backgroundColor: 'rgba(212,175,55,0.18)',
		marginVertical: 14,
	},
	insightRecentHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	insightRecentTitle: {
		fontSize: 13,
		fontWeight: '800',
		color: '#ffffff',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	nextCard: {
		marginHorizontal: 24,
		marginBottom: 18,
		padding: 18,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
	},
	nextCardTop: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10,
		marginBottom: 10,
	},
	nextCardLabel: {
		fontSize: 12,
		fontWeight: '800',
		color: 'rgba(255,255,255,0.55)',
		textTransform: 'uppercase',
		letterSpacing: 0.7,
	},
	nextCardPill: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: 'rgba(255,184,0,0.12)',
	},
	nextCardPillAlt: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: 'rgba(255,255,255,0.06)',
	},
	nextCardPillText: {
		fontSize: 11,
		fontWeight: '800',
		color: '#FFB800',
		textTransform: 'uppercase',
	},
	nextCardPillTextAlt: {
		fontSize: 11,
		fontWeight: '800',
		color: 'rgba(255,255,255,0.65)',
		textTransform: 'uppercase',
	},
	nextCardTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 6,
	},
	nextCardMeta: {
		fontSize: 13,
		lineHeight: 19,
		color: 'rgba(255,255,255,0.68)',
	},
	sectionHeader: {
		paddingHorizontal: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '800',
		color: '#ffffff',
	},
	sectionLink: {
		fontSize: 13,
		fontWeight: '700',
		color: '#d4af37',
	},
	activityCard: {
		marginHorizontal: 24,
		marginBottom: 18,
		padding: 4,
		borderRadius: 18,
		backgroundColor: 'rgba(255,255,255,0.04)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
	},
	activityRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 12,
		paddingHorizontal: 4,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(212,175,55,0.12)',
	},
	activityRowLast: {
		borderBottomWidth: 0,
	},
	activityDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	activityContent: {
		flex: 1,
	},
	activityTitle: {
		fontSize: 14,
		fontWeight: '700',
		color: '#ffffff',
		marginBottom: 2,
	},
	activitySubtitle: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.55)',
	},
	activityTime: {
		fontSize: 11,
		fontWeight: '700',
		color: 'rgba(255,255,255,0.45)',
	},
	emptyActivityText: {
		paddingVertical: 18,
		paddingHorizontal: 14,
		fontSize: 13,
		lineHeight: 19,
		color: 'rgba(255,255,255,0.6)',
	},
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
	fullWidthCard: {
		width: '100%',
	},
	brandCard: {
		backgroundColor: BRAND,
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
	cardSubtitle: {
		marginTop: 8,
		fontSize: 13,
		lineHeight: 18,
		color: 'rgba(0,0,0,0.72)',
		fontWeight: '600',
	},
	cardIllustration: {
		marginTop: 20,
	},
	draftIllustration: {},
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
})
