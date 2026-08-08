import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	Animated,
	Image,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api, postsEvents } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { VOICE_DRAFT_KEY } from './create-post'

const BRAND = '#d4af37'

// Static decorative waveform bar heights for the "Record your idea" card.
const RECORD_WAVE_BARS = [8, 16, 24, 14, 28, 18, 10, 22, 12, 20, 8, 14]

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

	// If the app was closed mid-idea, offer to finish the unfinished voice draft.
	// Prompt at most once per mount.
	const draftPromptShown = useRef(false)
	useEffect(() => {
		if (draftPromptShown.current) return
		let cancelled = false
		;(async () => {
			try {
				const raw = await AsyncStorage.getItem(VOICE_DRAFT_KEY)
				if (!raw || cancelled) return
				draftPromptShown.current = true
				Alert.alert(
					'Finish your idea?',
					'You have an unfinished recorded idea. Want to pick up where you left off?',
					[
						{
							text: 'Discard',
							style: 'destructive',
							onPress: () => {
								AsyncStorage.removeItem(VOICE_DRAFT_KEY).catch(() => {})
							},
						},
						{
							text: 'Finish it',
							onPress: () =>
								router.push(
									'/(tabs)/create-post?resumeVoice=1' as any,
								),
						},
					],
				)
			} catch {
				// ignore — a missing/corrupt draft simply means no prompt
			}
		})()
		return () => {
			cancelled = true
		}
	}, [router])

	useEffect(() => {
		let mounted = true

		const loadDashboard = async () => {
			try {
				const [profileData, postsData, icpData] = await Promise.all([
					api.profile.get().catch(() => null),
					api.posts.getAll({ limit: 1000 }).catch(() => []),
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
				const postsData = await api.posts
					.getAll({ limit: 1000 })
					.catch(() => [])
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
	const avatarUrl = profile?.avatar || user?.avatar || null
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
					if (post.status === 'IDEA') acc.IDEA += 1
					else if (post.status === 'SCRIPTING' || post.status === 'DRAFT') acc.SCRIPTING += 1
					else if (post.status === 'RECORDING') acc.RECORDING += 1
					else if (post.status === 'EDITING' || post.status === 'SCHEDULED') acc.EDITING += 1
					else if (post.status === 'POSTED' || post.status === 'PUBLISHED') acc.POSTED += 1
					return acc
				},
				{ IDEA: 0, SCRIPTING: 0, RECORDING: 0, EDITING: 0, POSTED: 0 },
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
								{avatarUrl ? (
									<Image
										source={{ uri: avatarUrl }}
										style={styles.profileAvatar}
									/>
								) : (
									<Text style={styles.profileInitial}>
										{userInitial}
									</Text>
								)}
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
							style={[styles.actionCard, styles.balancedCard]}
							onPress={() => router.push('/(tabs)/create-post' as any)}
							activeOpacity={0.8}
						>
							<View style={styles.cardTopRow}>
								<View style={[styles.badgePill, styles.badgePillGold]}>
									<Text style={styles.badgePillTextGold}>TEXT EDITOR</Text>
								</View>
								<View style={styles.iconCircleGold}>
									<Ionicons
										name='create-outline'
										size={18}
										color={BRAND}
									/>
								</View>
							</View>

							<View style={styles.cardBody}>
								<Text style={styles.cardTitleUnified}>
									Write Script
								</Text>
								<Text style={styles.cardSubtitleUnified}>
									Draft & format line by line in rich text
								</Text>
							</View>

							<View style={styles.cardFooter}>
								<View style={styles.draftItemUnified}>
									<Ionicons
										name='document-text-outline'
										size={16}
										color='rgba(212,175,55,0.7)'
									/>
									<View style={styles.draftLinesUnified}>
										<View style={styles.draftLineUnified} />
										<View
											style={[
												styles.draftLineUnified,
												{ width: '60%' },
											]}
										/>
									</View>
								</View>
								<View style={styles.actionArrowRow}>
									<Text style={styles.actionArrowText}>
										Start Writing
									</Text>
									<Ionicons
										name='arrow-forward'
										size={14}
										color={BRAND}
									/>
								</View>
							</View>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.actionCard, styles.balancedCard]}
							onPress={() =>
								router.push(
									'/(tabs)/create-post?record=1' as any,
								)
							}
							activeOpacity={0.8}
						>
							<View style={styles.cardTopRow}>
								<View style={[styles.badgePill, styles.badgePillGold]}>
									<Text style={styles.badgePillTextGold}>VOICE TO TEXT</Text>
								</View>
								<View style={styles.iconCircleGold}>
									<Ionicons name='mic' size={18} color={BRAND} />
								</View>
							</View>

							<View style={styles.cardBody}>
								<Text style={styles.cardTitleUnified}>
									Record Idea
								</Text>
								<Text style={styles.cardSubtitleUnified}>
									Speak naturally & auto-transcribe text
								</Text>
							</View>

							<View style={styles.cardFooter}>
								<View style={styles.recordWaveformUnified}>
									{RECORD_WAVE_BARS.map((h, i) => (
										<View
											key={i}
											style={[
												styles.recordWaveBarUnified,
												{ height: Math.max(h * 0.65, 5) },
											]}
										/>
									))}
								</View>
								<View style={styles.actionArrowRow}>
									<Text style={styles.actionArrowText}>
										Start Recording
									</Text>
									<Ionicons
										name='arrow-forward'
										size={14}
										color={BRAND}
									/>
								</View>
							</View>
						</TouchableOpacity>
					</Animated.View>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.statusStrip}
					>
						<TouchableOpacity
							style={styles.statusCard}
							onPress={() => router.push('/(tabs)/posts?tab=IDEA' as any)}
						>
							<Text style={styles.statusValue}>{counts.IDEA}</Text>
							<Text style={styles.statusLabel}>Idea</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.statusCard}
							onPress={() => router.push('/(tabs)/posts?tab=SCRIPTING' as any)}
						>
							<Text style={styles.statusValue}>{counts.SCRIPTING}</Text>
							<Text style={styles.statusLabel}>Scripting</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.statusCard}
							onPress={() => router.push('/(tabs)/posts?tab=RECORDING' as any)}
						>
							<Text style={styles.statusValue}>{counts.RECORDING}</Text>
							<Text style={styles.statusLabel}>Recording</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.statusCard}
							onPress={() => router.push('/(tabs)/posts?tab=EDITING' as any)}
						>
							<Text style={styles.statusValue}>{counts.EDITING}</Text>
							<Text style={styles.statusLabel}>Editing</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.statusCard}
							onPress={() => router.push('/(tabs)/posts?tab=POSTED' as any)}
						>
							<Text style={styles.statusValue}>{counts.POSTED}</Text>
							<Text style={styles.statusLabel}>Posted</Text>
						</TouchableOpacity>
					</ScrollView>

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
		overflow: 'hidden',
	},
	profileAvatar: {
		width: '100%',
		height: '100%',
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
		minWidth: 85,
		paddingVertical: 14,
		paddingHorizontal: 12,
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
		borderRadius: 22,
		padding: 16,
		minHeight: 195,
		justifyContent: 'space-between',
	},
	balancedCard: {
		backgroundColor: 'rgba(255,255,255,0.045)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.22)',
	},
	cardTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	badgePill: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	badgePillGold: {
		backgroundColor: 'rgba(212,175,55,0.12)',
	},
	badgePillTextGold: {
		color: BRAND,
		fontSize: 9,
		fontWeight: '800',
		letterSpacing: 0.6,
	},
	iconCircleGold: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(212,175,55,0.15)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardBody: {
		marginVertical: 6,
	},
	cardTitleUnified: {
		fontSize: 16,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 4,
	},
	cardSubtitleUnified: {
		fontSize: 11.5,
		lineHeight: 16,
		color: 'rgba(255,255,255,0.65)',
		fontWeight: '500',
	},
	cardFooter: {
		gap: 10,
		marginTop: 6,
	},
	draftItemUnified: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		padding: 8,
		borderRadius: 8,
		backgroundColor: 'rgba(255,255,255,0.03)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.06)',
		height: 34,
	},
	draftLinesUnified: {
		flex: 1,
		gap: 4,
	},
	draftLineUnified: {
		height: 3,
		backgroundColor: 'rgba(212,175,55,0.5)',
		borderRadius: 2,
		width: '100%',
	},
	recordWaveformUnified: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3.5,
		height: 34,
		paddingHorizontal: 10,
		borderRadius: 8,
		backgroundColor: 'rgba(255,255,255,0.03)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.06)',
	},
	recordWaveBarUnified: {
		width: 3,
		borderRadius: 1.5,
		backgroundColor: BRAND,
	},
	actionArrowRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	actionArrowText: {
		fontSize: 11.5,
		fontWeight: '700',
		color: BRAND,
	},
})
