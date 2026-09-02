import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	FlatList,
	TextInput,
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	Modal,
	Alert,
	Animated,
} from 'react-native'
import Skeleton from '@/components/Skeleton'

import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { api, postsEvents } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

type FilterType = 'all' | 'IDEA' | 'SCRIPTING' | 'RECORDING' | 'EDITING' | 'POSTED'

const FILTER_LABELS: Record<FilterType, string> = {
	all: 'All',
	IDEA: 'Idea',
	SCRIPTING: 'Scripting',
	RECORDING: 'Filming',
	EDITING: 'Editing',
	POSTED: 'Posted',
}

const STATUS_LABELS: Record<string, string> = {
	IDEA: 'IDEA',
	SCRIPTING: 'SCRIPTING',
	RECORDING: 'FILMING',
	EDITING: 'EDITING',
	POSTED: 'POSTED',
	DRAFT: 'SCRIPTING',
	SCHEDULED: 'EDITING',
	PUBLISHED: 'POSTED',
}

interface Post {
	id: string
	title?: string
	content: string
	status: string
	platforms: string[]
	createdAt: string
	scheduledAt?: string
	publishedAt?: string
}

interface PaginationState {
	currentPage: number
	limit: number
	hasMore: boolean
	isLoadingMore: boolean
}

const buildPreviewText = (value?: string | null) => {
	if (!value) return 'No content yet.'

	const withBreaks = value
		.replace(/<\/(p|div|h1|h2|h3|h4|h5|h6)>/gi, '\n')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<li>/gi, '- ')
		.replace(/<\/li>/gi, '\n')

	const plainText = withBreaks.replace(/<[^>]+>/g, ' ')
	const compact = plainText.replace(/\s+/g, ' ').trim()

	if (!compact) return 'No content yet.'
	return compact.length > 160 ? `${compact.slice(0, 160)}...` : compact
}

export default function GetContentScreen() {
	const { colors } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	const router = useRouter()
	const params = useLocalSearchParams()
	const { isAuthenticated } = useAuth()
	const [filter, setFilter] = useState<FilterType>((params.tab as FilterType) || 'all')
	const [searchQuery, setSearchQuery] = useState('')
	const [posts, setPosts] = useState<Post[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [pagination, setPagination] = useState<PaginationState>({
		currentPage: 1,
		limit: 10,
		hasMore: true,
		isLoadingMore: false,
	})
	const [selectedPostForStatus, setSelectedPostForStatus] = useState<Post | null>(null)
	const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

	const STAGES = [
		{ key: 'IDEA', label: 'Idea', icon: 'bulb-outline', color: colors.ideaText, bg: colors.ideaBg },
		{ key: 'SCRIPTING', label: 'Scripting', icon: 'create-outline', color: colors.scriptingText, bg: colors.scriptingBg },
		{ key: 'RECORDING', label: 'Filming', icon: 'mic-outline', color: colors.recordingText, bg: colors.recordingBg },
		{ key: 'EDITING', label: 'Editing', icon: 'cut-outline', color: colors.editingText, bg: colors.editingBg },
		{ key: 'POSTED', label: 'Posted', icon: 'checkmark-done-outline', color: colors.postedText, bg: colors.postedBg },
	]

	const handleUpdateStatus = async (post: Post, newStatus: string) => {
		if (post.status === newStatus) {
			setSelectedPostForStatus(null)
			return
		}

		setUpdatingStatusId(post.id)
		try {
			await api.posts.update(post.id, { status: newStatus })
			setSelectedPostForStatus(null)
			fetchPosts(1, false)
		} catch (err: any) {
			console.error('Failed to update status', err)
		} finally {
			setUpdatingStatusId(null)
		}
	}

	const [sortOption, setSortOption] = useState<'NEWEST' | 'OLDEST' | 'FAVOURITES' | null>(null)
	const [showSortModal, setShowSortModal] = useState(false)

	const handleToggleFavourite = async (post: Post) => {
		try {
			// Optimistic UI update
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
			setPosts(currentPosts => currentPosts.map(p => 
				p.id === post.id ? { ...p, isFavourite: !p.isFavourite } : p
			))
			
			// Actual API call
			await api.posts.update(post.id, { isFavourite: !post.isFavourite })
		} catch (error) {
			// Revert on error
			setPosts(currentPosts => currentPosts.map(p => 
				p.id === post.id ? { ...p, isFavourite: post.isFavourite } : p
			))
			console.error('Failed to toggle favourite', error)
		}
	}

	const handleDeletePost = async (id: string) => {
		Alert.alert(
			'Delete Script',
			'Are you sure you want to delete this script? This cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
							await api.posts.delete(id)
							setPosts(currentPosts => currentPosts.filter(p => p.id !== id))
						} catch (error) {
							console.error('Failed to delete post:', error)
						}
					}
				}
			]
		)
	}

	// Fetch posts with pagination support
	const fetchPosts = useCallback(
		async (page: number = 1, append: boolean = false) => {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(pagination.limit),
				search: searchQuery,
				...(sortOption && { sort: sortOption }),
				...(filter !== 'all' && { status: filter }),
			})
			const cacheKey = `@posts_cache_${params.toString()}`

			try {
				if (page === 1 && !append) {
					try {
						const cachedData = await AsyncStorage.getItem(cacheKey)
						if (cachedData) {
							setPosts(JSON.parse(cachedData))
							// Already have data, don't show full loading screen
						} else {
							setLoading(true)
						}
					} catch (e) {
						setLoading(true)
					}
				} else {
					setPagination((prev) => ({ ...prev, isLoadingMore: true }))
				}

				const allPosts = await api.posts.getAll({
					...Object.fromEntries(params),
				})

				if (append) {
					setPosts((prevPosts) => {
						const newPosts = [...prevPosts, ...(allPosts || [])]
						return newPosts
					})
				} else {
					setPosts(allPosts || [])
					// Save page 1 to cache
					if (page === 1) {
						AsyncStorage.setItem(cacheKey, JSON.stringify(allPosts || [])).catch(e => console.log('Cache save error', e))
					}
				}

				const hasMore = (allPosts?.length || 0) === pagination.limit
				setPagination((prev) => ({
					...prev,
					currentPage: page,
					hasMore,
					isLoadingMore: false,
				}))
			} catch (error) {
				console.error('Error fetching posts:', error)
				// We keep cached data on screen if network fails
				setPagination((prev) => ({ ...prev, isLoadingMore: false }))
			} finally {
				setLoading(false)
			}
		},
		[pagination.limit, searchQuery, filter, sortOption],
	)

	// Handle refresh (pull to refresh)
	const onRefresh = useCallback(async () => {
		setRefreshing(true)
		setPagination((prev) => ({ ...prev, currentPage: 1, hasMore: true }))
		try {
			await fetchPosts(1, false)
		} catch (error) {
			console.error('Error refreshing posts:', error)
		} finally {
			setRefreshing(false)
		}
	}, [fetchPosts])

	// Handle reaching end of list (infinite scroll)
	const onEndReached = useCallback(() => {
		if (pagination.hasMore && !pagination.isLoadingMore && !loading) {
			const nextPage = pagination.currentPage + 1
			fetchPosts(nextPage, true)
		}
	}, [pagination, loading, fetchPosts])

	// Initial load and cleanup
	useEffect(() => {
		if (isAuthenticated) {
			fetchPosts(1, false)
		} else {
			setLoading(false)
		}

		const unsubscribe = postsEvents.onChange(() => {
			if (isAuthenticated) {
				// Reset to first page when posts change
				setPagination((prev) => ({
					...prev,
					currentPage: 1,
					hasMore: true,
				}))
				fetchPosts(1, false)
			}
		})
		return unsubscribe
	}, [isAuthenticated, fetchPosts])

	useEffect(() => {
		if (params.tab && params.tab !== filter) {
			setFilter(params.tab as FilterType)
		}
	}, [params.tab])

	// Reset pagination when filter or search changes
	useEffect(() => {
		if (isAuthenticated) {
			setPagination((prev) => ({
				...prev,
				currentPage: 1,
				hasMore: true,
			}))
			fetchPosts(1, false)
		}
	}, [filter, searchQuery, sortOption, isAuthenticated, fetchPosts])

	// Filter posts by current filter and search (client-side filtering fallback)
	const filteredPosts = posts.filter((post) => {
		const matchesFilter =
			filter === 'all' ||
			post.status === filter ||
			(filter === 'SCRIPTING' && post.status === 'DRAFT') ||
			(filter === 'EDITING' && post.status === 'SCHEDULED') ||
			(filter === 'POSTED' && post.status === 'PUBLISHED')
		const matchesSearch =
			(post.title || 'Untitled')
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			post.content.toLowerCase().includes(searchQuery.toLowerCase())
		return matchesFilter && matchesSearch
	})

	const getStatusBadgeStyle = (status: string) => {
		switch (status) {
			case 'IDEA':
				return { bg: colors.ideaBg, text: colors.ideaText, dot: colors.ideaText, border: colors.ideaText }
			case 'SCRIPTING':
			case 'DRAFT':
				return { bg: colors.scriptingBg, text: colors.scriptingText, dot: colors.scriptingText, border: colors.scriptingText }
			case 'RECORDING':
				return { bg: colors.recordingBg, text: colors.recordingText, dot: colors.recordingText, border: colors.recordingText }
			case 'EDITING':
			case 'SCHEDULED':
				return { bg: colors.editingBg, text: colors.editingText, dot: colors.editingText, border: colors.editingText }
			case 'POSTED':
			case 'PUBLISHED':
				return { bg: colors.postedBg, text: colors.postedText, dot: colors.postedText, border: colors.postedText }
			default:
				return { bg: colors.surfaceHover, text: colors.textMuted, dot: colors.textSubtle, border: colors.borderLight }
		}
	}

	const renderPost = ({ item }: { item: Post }) => {
		const badge = getStatusBadgeStyle(item.status)
		return (
			<View style={{ backgroundColor: 'transparent' }}>
				<View style={{ backgroundColor: colors.surfaceLight, borderRadius: 18, borderWidth: 1, borderColor: colors.border }}>
					<TouchableOpacity
						style={[styles.postCard, { marginBottom: 0 }]}
						activeOpacity={0.9}
						onPress={() => router.push(`/(tabs)/post-detail?postId=${item.id}`)}
					>
						<View style={styles.postHeader}>
							<TouchableOpacity
								style={[
									styles.postLeft,
									{ backgroundColor: badge.bg, borderColor: badge.border },
								]}
								onPress={(e) => {
									e.stopPropagation()
									setSelectedPostForStatus(item)
								}}
								activeOpacity={0.7}
							>
								<View
									style={[
										styles.statusDot,
										{ backgroundColor: badge.dot },
									]}
								/>
								<Text
									style={[
										styles.statusText,
										{ color: badge.text },
									]}
								>
									{STATUS_LABELS[item.status] || item.status}
								</Text>
								<Ionicons
									name='chevron-down'
									size={12}
									color={badge.text}
								/>
							</TouchableOpacity>
						</View>

						<Text style={styles.postTitle} numberOfLines={2}>
							{item.title || 'Untitled Post'}
						</Text>

						<Text style={styles.postContent} numberOfLines={3}>
							{buildPreviewText(item.content)}
						</Text>

						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
							<Text style={styles.postDate}>
								{new Date(item.createdAt).toLocaleDateString()}
							</Text>
							<TouchableOpacity
								onPress={(e) => {
									e.stopPropagation()
									handleToggleFavourite(item)
								}}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<Ionicons
									name={item.isFavourite ? 'star' : 'star-outline'}
									size={18}
									color={item.isFavourite ? colors.gold : colors.textSubtle}
								/>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</View>
				<View style={{ height: 12 }} />
			</View>
		)
	}

	// Footer component to show loading indicator when fetching more posts
	const renderFooter = () => {
		if (!pagination.isLoadingMore) return null
		return (
			<View style={styles.footerLoader}>
				<ActivityIndicator size='small' color={colors.gold} />
				<Text style={styles.footerText}>Loading more posts...</Text>
			</View>
		)
	}

	const emptyComponent = (
		<View style={styles.emptyState}>
			<Text style={styles.emptyEmoji}>📝</Text>
			<Text style={styles.emptyText}>
				{filter === 'all'
					? 'No content found'
					: `No ${FILTER_LABELS[filter].toLowerCase()} posts`}
			</Text>
			<Text style={styles.emptySubtext}>
				{searchQuery
					? 'Try adjusting your search'
					: 'Create your first post to get started'}
			</Text>
		</View>
	)

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View>
					<Text style={styles.headerTitle}>Content List</Text>
					<Text style={styles.headerSubtitle}>
						{filteredPosts.length} post
						{filteredPosts.length !== 1 ? 's' : ''}
					</Text>
				</View>
				<TouchableOpacity
					style={styles.addIconButton}
					onPress={() => router.push('/(tabs)/create-post')}
				>
					<Ionicons
						name='add'
						size={22}
						color={colors.text}
					/>
				</TouchableOpacity>
			</View>

			{loading && posts.length === 0 ? (
				<View style={styles.listContent}>
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} style={styles.skeletonCard} />
					))}
				</View>
			) : (
				<>
			<View style={styles.searchWrapper}>
				<View style={styles.searchContainer}>
					<Ionicons
						name='search-outline'
						size={18}
						color={colors.textSubtle}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder='Search content...'
						placeholderTextColor={colors.textSubtle}
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
				</View>
				<TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
					<Ionicons 
						name={sortOption ? "options" : "options-outline"} 
						size={18} 
						color={sortOption ? colors.gold : colors.text} 
					/>
				</TouchableOpacity>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.filtersContainer}
				contentContainerStyle={styles.filters}
			>
				{(
					['all', 'IDEA', 'SCRIPTING', 'RECORDING', 'EDITING', 'POSTED'] as FilterType[]
				).map((f) => (
					<TouchableOpacity
						key={f}
						style={[
							styles.filterButton,
							filter === f && styles.filterButtonActive,
						]}
						onPress={() => setFilter(f)}
					>
						<Text
							numberOfLines={1}
							style={[
								styles.filterText,
								filter === f && styles.filterTextActive,
							]}
						>
							{FILTER_LABELS[f]}
						</Text>
					</TouchableOpacity>
				))}
			</ScrollView>

			{filteredPosts.length === 0 ? (
				emptyComponent
			) : (
				<FlatList
					style={{ marginTop: 16, flex: 1 }}
					data={filteredPosts}
					renderItem={({ item }) => renderPost({ item })}
					keyExtractor={(item) => item.id}
					contentContainerStyle={[styles.listContent, filteredPosts.length === 0 && { flexGrow: 1 }]}
					showsVerticalScrollIndicator={false}
					onEndReached={onEndReached}
					onEndReachedThreshold={0.5}
					ListFooterComponent={renderFooter}
					ListEmptyComponent={
						!loading ? (
							<View style={styles.emptyStateContainer}>
								<Ionicons name="document-text-outline" size={64} color={colors.textSubtle} />
								<Text style={styles.emptyStateTitle}>No scripts found</Text>
								<Text style={styles.emptyStateSubtitle}>
									{searchQuery || filter !== 'all' 
										? 'Try adjusting your filters or search.' 
										: "You haven't written any scripts yet."}
								</Text>
								{(!searchQuery && filter === 'all') && (
									<TouchableOpacity 
										style={styles.emptyStateBtn}
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
											router.push('/create-post' as any)
										}}
									>
										<Text style={styles.emptyStateBtnText}>Create New</Text>
									</TouchableOpacity>
								)}
							</View>
						) : null
					}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
								onRefresh()
							}}
							tintColor={colors.gold}
						/>
					}
				/>
			)}
			</>
			)}

			<Modal
				visible={!!selectedPostForStatus}
				transparent
				animationType='fade'
				onRequestClose={() => setSelectedPostForStatus(null)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setSelectedPostForStatus(null)}
				>
					<View style={styles.modalSheet}>
						<View style={styles.sheetHeader}>
							<Text style={styles.sheetTitle} numberOfLines={1}>
								Status Update Modal
							</Text>
							<TouchableOpacity
								onPress={() => setSelectedPostForStatus(null)}
							>
								<Ionicons name='close-circle' size={24} color={colors.textSubtle} />
							</TouchableOpacity>
						</View>

						<View style={styles.stageOptionsList}>
							{STAGES.map((stage) => {
								const isCurrent =
									selectedPostForStatus?.status === stage.key ||
									(stage.key === 'SCRIPTING' && selectedPostForStatus?.status === 'DRAFT') ||
									(stage.key === 'EDITING' && selectedPostForStatus?.status === 'SCHEDULED') ||
									(stage.key === 'POSTED' && selectedPostForStatus?.status === 'PUBLISHED')
								const isUpdatingThis =
									updatingStatusId === selectedPostForStatus?.id

								return (
									<TouchableOpacity
										key={stage.key}
										style={[
											styles.stageOptionRow,
											isCurrent && {
												backgroundColor: stage.bg,
												borderColor: stage.color + '66',
											},
										]}
										onPress={() =>
											selectedPostForStatus &&
											handleUpdateStatus(selectedPostForStatus, stage.key)
										}
										disabled={isUpdatingThis}
									>
										<View style={styles.stageLeft}>
											<View
												style={[
													styles.stageIconBg,
													{ backgroundColor: stage.bg },
												]}
											>
												<Ionicons
													name={stage.icon as any}
													size={18}
													color={stage.color}
												/>
											</View>
											<Text
												style={[
													styles.stageLabel,
													isCurrent && {
														color: stage.color,
														fontWeight: '700',
													},
												]}
											>
												{stage.label}
											</Text>
										</View>

										{isCurrent && (
											<Ionicons
												name='checkmark'
												size={18}
												color={stage.color}
											/>
										)}
									</TouchableOpacity>
								)
							})}
						</View>
					</View>
				</TouchableOpacity>
			</Modal>

			<Modal
				visible={showSortModal}
				transparent
				animationType='fade'
				onRequestClose={() => setShowSortModal(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setShowSortModal(false)}
				>
					<View style={styles.pickerSheet}>
						<Text style={styles.pickerTitle}>Sort Posts</Text>
						
						{(
							[
								{ id: 'NEWEST', label: 'Date (Newest to Oldest)' },
								{ id: 'OLDEST', label: 'Oldest to Newest' },
								{ id: 'FAVOURITES', label: 'Favourites' },
							] as const
						).map((option) => (
							<TouchableOpacity
								key={option.id}
								style={styles.pickerOption}
								onPress={() => {
									setSortOption(prev => prev === option.id ? null : option.id)
									setShowSortModal(false)
								}}
							>
								<Ionicons
									name={
										sortOption === option.id
											? 'radio-button-on'
											: 'radio-button-off'
									}
									size={22}
									color={sortOption === option.id ? colors.gold : colors.textSubtle}
								/>
								<Text style={[
									styles.pickerOptionText,
									sortOption === option.id && { color: colors.text, fontWeight: '700' },
								]}>{option.label}</Text>
							</TouchableOpacity>
						))}
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	)
}

const getStyles = (colors: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 14,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: colors.text,
	},
	addIconButton: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: colors.surfaceCard,
		borderWidth: 1,
		borderColor: colors.border,
		justifyContent: 'center',
		alignItems: 'center',
	},
	skeletonCard: {
		height: 120,
		backgroundColor: colors.surfaceCard,
		borderRadius: 16,
		marginBottom: 14,
	},
	emptyStateContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 60,
	},
	emptyStateTitle: {
		color: colors.text,
		fontSize: 18,
		fontWeight: '700',
		marginTop: 16,
	},
	emptyStateSubtitle: {
		color: colors.textMuted,
		fontSize: 14,
		marginTop: 8,
		textAlign: 'center',
		paddingHorizontal: 32,
	},
	emptyStateBtn: {
		marginTop: 20,
		backgroundColor: colors.gold,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 10,
	},
	emptyStateBtnText: {
		color: colors.black,
		fontWeight: '700',
		fontSize: 14,
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: 'transparent',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	backLeftBtn: {
		alignItems: 'center',
		bottom: 12,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75,
		backgroundColor: colors.gold,
		left: 0,
		borderTopLeftRadius: 18,
		borderBottomLeftRadius: 18,
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 12,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75,
		backgroundColor: colors.error,
		right: 0,
		borderTopRightRadius: 18,
		borderBottomRightRadius: 18,
	},
	headerSubtitle: {
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 2,
		fontWeight: '500',
	},
	searchWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 20,
		gap: 10,
	},
	searchContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.surfaceCard,
		borderRadius: 12,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	sortButton: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: colors.surfaceCard,
		borderWidth: 1,
		borderColor: colors.border,
		justifyContent: 'center',
		alignItems: 'center',
	},
	searchInput: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 8,
		color: colors.text,
		fontSize: 14,
		fontWeight: '500',
	},
	filtersContainer: {
		flexGrow: 0,
		marginTop: 14,
		marginBottom: 0,
		height: 36,
	},
	filters: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		gap: 8,
		height: 36,
	},
	filterButton: {
		paddingHorizontal: 16,
		height: 34,
		borderRadius: 17,
		backgroundColor: colors.surfaceCard,
		borderWidth: 1,
		borderColor: colors.border,
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	filterButtonActive: {
		backgroundColor: colors.primaryAction,
		borderColor: colors.primaryAction,
	},
	filterText: {
		fontSize: 12,
		fontWeight: '600',
		color: colors.textMuted,
	},
	filterTextActive: {
		color: colors.primaryActionText,
		fontWeight: '700',
	},
	listContent: {
		paddingTop: 16,
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	postCard: {
		padding: 16,
	},
	postHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	postLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 8,
		borderWidth: 1,
	},
	statusDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	statusText: {
		fontSize: 10.5,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	postTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 6,
		lineHeight: 22,
	},
	postContent: {
		fontSize: 13,
		color: colors.textSecondary,
		lineHeight: 19,
	},
	postDate: {
		fontSize: 11,
		color: colors.textSubtle,
		fontWeight: '500',
	},
	emptyState: {
		alignItems: 'center',
		paddingTop: 60,
	},
	emptyEmoji: {
		fontSize: 48,
		marginBottom: 12,
	},
	emptyText: {
		fontSize: 17,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 6,
	},
	emptySubtext: {
		fontSize: 13,
		color: colors.textMuted,
	},
	footerLoader: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 16,
		gap: 8,
	},
	footerText: {
		fontSize: 12,
		color: colors.textMuted,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: colors.navyMuted,
		justifyContent: 'flex-end',
	},
	modalSheet: {
		backgroundColor: colors.surfaceLight,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		paddingBottom: 32,
		borderWidth: 1,
		borderColor: colors.border,
	},
	sheetHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	sheetTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: colors.text,
		flex: 1,
		marginRight: 10,
	},
	stageOptionsList: {
		gap: 8,
		paddingBottom: 10,
	},
	stageOptionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 12,
		borderRadius: 14,
		backgroundColor: colors.surfaceCard,
		borderWidth: 1,
		borderColor: colors.border,
	},
	stageOptionRowActive: {
		backgroundColor: colors.ideaBg,
		borderColor: colors.ideaText,
	},
	stageLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	stageIconBg: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	stageLabel: {
		fontSize: 14,
		fontWeight: '700',
		color: colors.text,
	},
	stageLabelActive: {
		fontWeight: '700',
	},
	pickerSheet: {
		backgroundColor: colors.surfaceLight,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		paddingBottom: 32,
		borderWidth: 1,
		borderColor: colors.border,
	},
	pickerTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 16,
	},
	pickerOption: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
	},
	pickerOptionText: {
		fontSize: 14,
		color: colors.textSecondary,
		fontWeight: '600',
	},
})
