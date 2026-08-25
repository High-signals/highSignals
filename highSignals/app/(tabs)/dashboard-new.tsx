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
import Skeleton from '@/components/Skeleton'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api, postsEvents } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { VOICE_DRAFT_KEY } from './create-post'




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

const getDashboardBadgeStyle = (status: string, colors: any) => {
	switch (status) {
		case 'IDEA':
			return { bg: colors.ideaBg, text: colors.ideaText, dot: colors.ideaText }
		case 'SCRIPTING':
		case 'DRAFT':
			return { bg: colors.scriptingBg, text: colors.scriptingText, dot: colors.scriptingText }
		case 'RECORDING':
			return { bg: colors.recordingBg, text: colors.recordingText, dot: colors.recordingText }
		case 'EDITING':
		case 'SCHEDULED':
			return { bg: colors.editingBg, text: colors.editingText, dot: colors.editingText }
		case 'POSTED':
		case 'PUBLISHED':
			return { bg: colors.postedBg, text: colors.postedText, dot: colors.postedText }
		default:
			return { bg: colors.surfaceHover, text: colors.textSecondary, dot: colors.textSubtle }
	}
}

export default function DashboardScreen() {
	const { colors, theme } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
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
						<TouchableOpacity
							style={styles.headerLeftIcon}
							onPress={() => router.push('/profile')}
						>
							{avatarUrl ? (
								<Image
									source={{ uri: avatarUrl }}
									style={styles.headerAvatar}
								/>
							) : (
								<View style={styles.headerAvatarPlaceholder}>
									<Text style={styles.headerAvatarText}>{userInitial}</Text>
								</View>
							)}
						</TouchableOpacity>

						<TouchableOpacity style={styles.headerRightBell}>
							<Ionicons name="notifications" size={20} color={colors.primaryIcon} />
						</TouchableOpacity>
					</Animated.View>

					<Animated.View style={[{ paddingHorizontal: 20, marginBottom: 24, opacity: fadeAnim }]}>
						<Text style={styles.welcomeTitle}>
							Welcome back,{"\n"}{firstName}
						</Text>
						<Text style={styles.dateSubtitle}>{todayLabel}</Text>
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
									<Text style={styles.badgePillTextSand}>TEXT EDITOR</Text>
								</View>
								<View style={styles.iconCircleSand}>
									<Ionicons name='create-outline' size={16} color={colors.primaryIcon} />
								</View>
							</View>
							<View style={styles.cardBody}>
								<Text style={styles.cardTitleUnified}>Write Script</Text>
								<Text style={styles.cardSubtitleUnified}>Draft & format line by line in rich text</Text>
							</View>
							<View style={styles.cardGraphic}>
								<Ionicons name="document-text-outline" size={16} color={colors.primaryIcon} style={{marginRight: 12}} />
								<View style={styles.graphicLines}>
									<View style={[styles.graphicLine, { width: '80%' }]} />
									<View style={[styles.graphicLine, { width: '50%' }]} />
								</View>
							</View>
							<View style={styles.cardFooter}>
								<View style={styles.actionArrowRow}>
									<Text style={styles.actionArrowText}>Start Writing</Text>
									<Ionicons name='arrow-forward' size={14} color={colors.primaryActionText} />
								</View>
							</View>
						</TouchableOpacity>

						{/* Record Idea Card */}
						<TouchableOpacity
							style={[styles.actionCard, styles.balancedCard]}
							onPress={() => router.push('/(tabs)/create-post?record=1' as any)}
							activeOpacity={0.85}
						>
							<View style={styles.cardTopRow}>
								<View style={styles.badgePillSand}>
									<Text style={styles.badgePillTextSand}>VOICE TO TEXT</Text>
								</View>
								<View style={styles.iconCircleSand}>
									<Ionicons name='mic' size={16} color={colors.primaryIcon} />
								</View>
							</View>
							<View style={styles.cardBody}>
								<Text style={styles.cardTitleUnified}>Record Idea</Text>
								<Text style={styles.cardSubtitleUnified}>Speak naturally & auto-transcribe text</Text>
							</View>
							<View style={styles.cardGraphic}>
								{RECORD_WAVE_BARS.map((h, i) => (
									<View key={i} style={[styles.waveBar, { height: h }]} />
								))}
							</View>
							<View style={styles.cardFooter}>
								<View style={styles.actionArrowRow}>
									<Text style={styles.actionArrowText}>Start Recording</Text>
									<Ionicons name='arrow-forward' size={14} color={colors.primaryActionText} />
								</View>
							</View>
						</TouchableOpacity>
					</Animated.View>
					

					{/* Dashboard Insight Card */}
					<View style={styles.insightCard}>
						<View style={[styles.insightHeader, { justifyContent: 'space-between' }]}>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
								<View style={styles.insightIcon}>
									<Ionicons name='bulb-outline' size={18} color={colors.primaryIcon} />
								</View>
								<Text style={styles.insightTitle}>
									Dashboard Insight
								</Text>
							</View>
							<Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>Scripts</Text>
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
							<View style={{ gap: 12 }}>
								<Skeleton style={{ width: '100%', height: 70 }} />
								<Skeleton style={{ width: '100%', height: 70 }} />
								<Skeleton style={{ width: '100%', height: 70 }} />
							</View>
						) : recentPosts.length > 0 ? (

							recentPosts.map((post, idx) => {
								const badge = getDashboardBadgeStyle(post.status, colors)
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

const getStyles = (colors: any) => StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.background,
	},
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scrollContent: {
		paddingBottom: 110,
	},
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
	
	headerLeftIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		overflow: 'hidden',
	},
	headerAvatar: {
		width: '100%',
		height: '100%',
	},
	headerAvatarPlaceholder: {
		width: '100%',
		height: '100%',
		backgroundColor: colors.primaryAction,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerAvatarText: {
		color: colors.primaryActionText,
		fontSize: 18,
		fontWeight: 'bold',
	},
	headerRightBell: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: colors.surfaceLight,
		alignItems: 'center',
		justifyContent: 'center',
	},
	welcomeTitle: {
		fontSize: 28,
		fontWeight: '700',
		color: colors.text,
		lineHeight: 34,
	},
	dateSubtitle: {
		fontSize: 14,
		color: colors.textMuted,
		marginTop: 6,
	},
	cardGraphic: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.surfaceLight,
		padding: 12,
		borderRadius: 8,
		marginTop: 16,
		marginBottom: 16,
		height: 44,
	},
	graphicLines: {
		flex: 1,
		justifyContent: 'center',
	},
	graphicLine: {
		height: 4,
		backgroundColor: colors.gold,
		borderRadius: 2,
		marginBottom: 4,
	},
	waveBar: {
		width: 3,
		backgroundColor: colors.gold,
		borderRadius: 2,
		marginHorizontal: 3,
	},

	
	
	
	
	
	
	
	
	
	
	
	

	pageTitle: {
		fontSize: 26,
		fontWeight: '700',
		color: colors.text,
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	profileIcon: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: colors.navyLight,
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
		color: colors.surface,
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
		backgroundColor: colors.surfaceCard,
		borderWidth: 1,
		borderColor: colors.border,
	},
	cardTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	badgePillSand: { backgroundColor: colors.primaryAction, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
	badgePillTextSand: { color: colors.primaryActionText, fontSize: 10, fontWeight: '700' },
	iconCircleSand: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
	cardBody: {
		marginVertical: 4,
	},
	cardTitleUnified: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16 },
	cardSubtitleUnified: {
		fontSize: 11,
		lineHeight: 15,
		color: colors.textSecondary,
		fontWeight: '500',
	},
	cardFooter: {
		gap: 6,
		marginTop: 6,
	},
	pillButton: {
		backgroundColor: colors.navyLight,
		borderRadius: 8,
		paddingVertical: 7,
		alignItems: 'center',
		justifyContent: 'center',
	},
	pillButtonText: {
		color: colors.surface,
		fontSize: 12,
		fontWeight: '700',
	},
	actionArrowRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryAction, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, justifyContent: 'center', marginTop: 4, width: '100%' },
	actionArrowText: { fontSize: 13, fontWeight: '700', color: colors.primaryActionText, marginRight: 6 },
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
		backgroundColor: colors.surfaceCard,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: 'center',
	},
	statusCardActive: {
		backgroundColor: colors.navyLight,
		borderColor: colors.navyLight,
	},
	statusValue: {
		fontSize: 18,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 2,
	},
	statusValueActive: {
		fontSize: 18,
		fontWeight: '700',
		color: colors.surface,
		marginBottom: 2,
	},
	statusLabel: {
		fontSize: 10,
		color: colors.textSecondary,
		fontWeight: '700',
		textAlign: 'center',
		letterSpacing: 0.5,
	},
	statusLabelActive: {
		fontSize: 10,
		color: colors.surface,
		fontWeight: '700',
		textAlign: 'center',
		letterSpacing: 0.5,
	},
	insightCard: {
		marginHorizontal: 20,
		marginBottom: 18,
		padding: 16,
		borderRadius: 18,
		backgroundColor: colors.surfaceLight,
		borderWidth: 1,
		borderColor: colors.border,
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
		backgroundColor: colors.surfaceCard,
		justifyContent: 'center',
		alignItems: 'center',
	},
	insightTitle: {
		fontSize: 12,
		fontWeight: '700',
		color: colors.text,
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	insightText: {
		fontSize: 13,
		lineHeight: 19,
		color: colors.textMuted,
	},
	insightDivider: {
		height: 1,
		backgroundColor: colors.border,
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
		fontWeight: '700',
		color: colors.text,
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	sectionLink: { fontSize: 12, fontWeight: '700', color: colors.gold },
	activityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surfaceCard, borderRadius: 16, marginBottom: 10 },
	activityRowLast: { marginBottom: 0 },
	activityContent: {
		flex: 1,
		marginRight: 10,
	},
	activityTitle: {
		fontSize: 13.5,
		fontWeight: '700',
		color: colors.text,
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
		fontWeight: '700',
		letterSpacing: 0.4,
	},
	activityTime: {
		fontSize: 11,
		fontWeight: '600',
		color: colors.textSubtle,
	},
	emptyActivityText: {
		paddingVertical: 14,
		fontSize: 13,
		lineHeight: 18,
		color: colors.textSecondary,
	},
})
