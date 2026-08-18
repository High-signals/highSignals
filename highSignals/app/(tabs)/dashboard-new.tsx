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

const BRAND = '#1D4A79'
const BRAND_GOLD = '#D4AF37'

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

const getDashboardBadgeStyle = (status: string) => {
	switch (status) {
		case 'IDEA':
			return { bg: '#E0F2FE', text: '#0284C7', dot: '#0284C7' }
		case 'SCRIPTING':
		case 'DRAFT':
			return { bg: '#F3E8FF', text: '#7C3AED', dot: '#7C3AED' }
		case 'RECORDING':
			return { bg: '#FFE4E6', text: '#E11D48', dot: '#E11D48' }
		case 'EDITING':
		case 'SCHEDULED':
			return { bg: '#FEF3C7', text: '#D97706', dot: '#D97706' }
		case 'POSTED':
		case 'PUBLISHED':
			return { bg: '#D1FAE5', text: '#059669', dot: '#059669' }
		default:
			return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' }
	}
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
				// ignore
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
					{/* Top Header */}
					<Animated.View
						style={[styles.header, { opacity: fadeAnim }]}
					>
						<Text style={styles.pageTitle}>Dashboard</Text>

						<View style={styles.headerRight}>
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
					</Animated.View>

					{/* 2 Main Action Cards */}
					<Animated.View
						style={[
							styles.mainCards,
							{
								opacity: fadeAnim,
								transform: [{ translateY: slideAnim }],
							},
						]}
					>
						{/* Write Script Card */}
						<TouchableOpacity
							style={[styles.actionCard, styles.balancedCard]}
							onPress={() => router.push('/(tabs)/create-post' as any)}
							activeOpacity={0.85}
						>
							<View style={styles.cardTopRow}>
								<View style={styles.badgePillSand}>
									<Text style={styles.badgePillTextSand}>FAST DRAFT</Text>
								</View>
								<View style={styles.iconCircleSand}>
									<Ionicons
										name='create-outline'
										size={16}
										color={BRAND_GOLD}
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
								<View style={styles.pillButton}>
									<Text style={styles.pillButtonText}>Start Writing</Text>
								</View>
								<View style={styles.actionArrowRow}>
									<Text style={styles.actionArrowText}>
										Start Writing
									</Text>
									<Ionicons
										name='chevron-forward'
										size={12}
										color={BRAND}
									/>
								</View>
							</View>
						</TouchableOpacity>

						{/* Record Idea Card */}
						<TouchableOpacity
							style={[styles.actionCard, styles.balancedCard]}
							onPress={() =>
								router.push(
									'/(tabs)/create-post?record=1' as any,
								)
							}
							activeOpacity={0.85}
						>
							<View style={styles.cardTopRow}>
								<View style={styles.badgePillSand}>
									<Text style={styles.badgePillTextSand}>VOICE TO TEXT</Text>
								</View>
								<View style={styles.iconCircleSand}>
									<Ionicons name='mic' size={16} color={BRAND_GOLD} />
								</View>
							</View>

							<View style={styles.cardBody}>
								<Text style={styles.cardTitleUnified}>
									Record Idea
								</Text>
								<Text style={styles.cardSubtitleUnified}>
									Spontaneously record raw ideas
								</Text>
							</View>

							<View style={styles.cardFooter}>
								<View style={styles.pillButton}>
									<Text style={styles.pillButtonText}>Record Idea</Text>
								</View>
								<View style={styles.actionArrowRow}>
									<Text style={styles.actionArrowText}>
										Start Recording
									</Text>
									<Ionicons
										name='chevron-forward'
										size={12}
										color={BRAND}
									/>
								</View>
							</View>
						</TouchableOpacity>
					</Animated.View>

					{/* 3 Count / Status Buttons */}
					<View style={styles.statusStrip}>
						<TouchableOpacity
							style={[styles.statusCard, styles.statusCardActive]}
							onPress={() => router.push('/(tabs)/GetContent?tab=all' as any)}
						>
							<Text style={styles.statusValueActive}>{posts.length}</Text>
							<Text style={styles.statusLabelActive}>ALL</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.statusCard}
							onPress={() => router.push('/(tabs)/GetContent?tab=SCRIPTING' as any)}
						>
							<Text style={styles.statusValue}>{counts.SCRIPTING}</Text>
							<Text style={styles.statusLabel}>SCRIPTS</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.statusCard}
							onPress={() => router.push('/(tabs)/GetContent?tab=EDITING' as any)}
						>
							<Text style={styles.statusValue}>{counts.EDITING}</Text>
							<Text style={styles.statusLabel}>DRAFTING</Text>
						</TouchableOpacity>
					</View>

					{/* Dashboard Insight Card */}
					<View style={styles.insightCard}>
						<View style={styles.insightHeader}>
							<View style={styles.insightIcon}>
								<Ionicons
									name='bulb-outline'
									size={18}
									color={BRAND_GOLD}
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
							recentPosts.map((post, idx) => {
								const badge = getDashboardBadgeStyle(post.status)
								return (
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
										activeOpacity={0.7}
									>
										<View style={styles.activityContent}>
											<Text
												style={styles.activityTitle}
												numberOfLines={1}
											>
												{post.title || 'Untitled Post'}
											</Text>
											<View
												style={[
													styles.statusPillBadge,
													{ backgroundColor: badge.bg },
												]}
											>
												<View
													style={[
														styles.statusPillDot,
														{ backgroundColor: badge.dot },
													]}
												/>
												<Text
													style={[
														styles.statusPillText,
														{ color: badge.text },
													]}
												>
													{post.status}
												</Text>
											</View>
										</View>
										<Text style={styles.activityTime}>
											{new Date(
												post.createdAt,
											).toLocaleDateString()}
										</Text>
									</TouchableOpacity>
								)
							})
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
		backgroundColor: '#FBF9F5',
	},
	container: {
		flex: 1,
		backgroundColor: '#FBF9F5',
	},
	scrollContent: {
		paddingBottom: 110,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 16,
	},
	pageTitle: {
		fontSize: 26,
		fontWeight: '800',
		color: '#163354',
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	profileIcon: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#1D4A79',
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	profileAvatar: {
		width: '100%',
		height: '100%',
	},
	profileInitial: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	mainCards: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		gap: 14,
		marginBottom: 18,
	},
	actionCard: {
		flex: 1,
		borderRadius: 18,
		padding: 14,
		minHeight: 185,
		justifyContent: 'space-between',
	},
	balancedCard: {
		backgroundColor: '#F5EFE6',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	cardTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	badgePillSand: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
		backgroundColor: '#EBE2D5',
	},
	badgePillTextSand: {
		color: '#163354',
		fontSize: 9,
		fontWeight: '800',
		letterSpacing: 0.5,
	},
	iconCircleSand: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#EBE2D5',
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardBody: {
		marginVertical: 4,
	},
	cardTitleUnified: {
		fontSize: 15,
		fontWeight: '800',
		color: '#163354',
		marginBottom: 3,
	},
	cardSubtitleUnified: {
		fontSize: 11,
		lineHeight: 15,
		color: '#64748B',
		fontWeight: '500',
	},
	cardFooter: {
		gap: 6,
		marginTop: 6,
	},
	pillButton: {
		backgroundColor: '#1D4A79',
		borderRadius: 8,
		paddingVertical: 7,
		alignItems: 'center',
		justifyContent: 'center',
	},
	pillButtonText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '700',
	},
	actionArrowRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 2,
		marginTop: 2,
	},
	actionArrowText: {
		fontSize: 10.5,
		fontWeight: '600',
		color: '#1D4A79',
	},
	statusStrip: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		gap: 10,
		marginBottom: 18,
	},
	statusCard: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 8,
		borderRadius: 12,
		backgroundColor: '#F5EFE6',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
		alignItems: 'center',
	},
	statusCardActive: {
		backgroundColor: '#1D4A79',
		borderColor: '#1D4A79',
	},
	statusValue: {
		fontSize: 18,
		fontWeight: '800',
		color: '#163354',
		marginBottom: 2,
	},
	statusValueActive: {
		fontSize: 18,
		fontWeight: '800',
		color: '#FFFFFF',
		marginBottom: 2,
	},
	statusLabel: {
		fontSize: 10,
		color: '#64748B',
		fontWeight: '700',
		textAlign: 'center',
		letterSpacing: 0.5,
	},
	statusLabelActive: {
		fontSize: 10,
		color: '#FFFFFF',
		fontWeight: '700',
		textAlign: 'center',
		letterSpacing: 0.5,
	},
	insightCard: {
		marginHorizontal: 20,
		marginBottom: 18,
		padding: 16,
		borderRadius: 18,
		backgroundColor: '#FAF7F2',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
	},
	insightHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 8,
	},
	insightIcon: {
		width: 28,
		height: 28,
		borderRadius: 8,
		backgroundColor: '#F5EFE6',
		justifyContent: 'center',
		alignItems: 'center',
	},
	insightTitle: {
		fontSize: 12,
		fontWeight: '800',
		color: '#163354',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	insightText: {
		fontSize: 13,
		lineHeight: 19,
		color: '#475569',
	},
	insightDivider: {
		height: 1,
		backgroundColor: '#EADBCE',
		marginVertical: 12,
	},
	insightRecentHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	insightRecentTitle: {
		fontSize: 12,
		fontWeight: '800',
		color: '#163354',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	sectionLink: {
		fontSize: 12,
		fontWeight: '700',
		color: '#1D4A79',
	},
	activityRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#EFEAE2',
	},
	activityRowLast: {
		borderBottomWidth: 0,
	},
	activityContent: {
		flex: 1,
		marginRight: 10,
	},
	activityTitle: {
		fontSize: 13.5,
		fontWeight: '700',
		color: '#163354',
		marginBottom: 4,
	},
	statusPillBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		paddingHorizontal: 7,
		paddingVertical: 2,
		borderRadius: 6,
		gap: 4,
	},
	statusPillDot: {
		width: 5,
		height: 5,
		borderRadius: 2.5,
	},
	statusPillText: {
		fontSize: 9.5,
		fontWeight: '800',
		letterSpacing: 0.4,
	},
	activityTime: {
		fontSize: 11,
		fontWeight: '600',
		color: '#94A3B8',
	},
	emptyActivityText: {
		paddingVertical: 14,
		fontSize: 13,
		lineHeight: 18,
		color: '#64748B',
	},
})
