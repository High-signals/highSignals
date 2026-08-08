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
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api, postsEvents } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

type FilterType = 'all' | 'IDEA' | 'SCRIPTING' | 'RECORDING' | 'EDITING' | 'POSTED'

const FILTER_LABELS: Record<FilterType, string> = {
	all: 'All',
	IDEA: 'Idea',
	SCRIPTING: 'Scripting',
	RECORDING: 'Recording',
	EDITING: 'Editing',
	POSTED: 'Posted',
}

const STATUS_LABELS: Record<string, string> = {
	IDEA: 'IDEA',
	SCRIPTING: 'SCRIPTING',
	RECORDING: 'RECORDING',
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
		{ key: 'IDEA', label: 'Idea', icon: 'bulb-outline', color: '#3b82f6' },
		{ key: 'SCRIPTING', label: 'Scripting', icon: 'create-outline', color: '#888888' },
		{ key: 'RECORDING', label: 'Recording', icon: 'mic-outline', color: '#ec4899' },
		{ key: 'EDITING', label: 'Editing', icon: 'cut-outline', color: '#FFD700' },
		{ key: 'POSTED', label: 'Posted', icon: 'checkmark-done-outline', color: '#4ade80' },
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

	// Fetch posts with pagination support
	const fetchPosts = useCallback(
		async (page: number = 1, append: boolean = false) => {
			try {
				if (page === 1) {
					setLoading(true)
				} else {
					setPagination((prev) => ({ ...prev, isLoadingMore: true }))
				}

				// Build query parameters
				const params = new URLSearchParams({
					page: String(page),
					limit: String(pagination.limit),
					search: searchQuery,
					// Only filter if not 'all'
					...(filter !== 'all' && { status: filter }),
				})

				const allPosts = await api.posts.getAll({
					...Object.fromEntries(params),
				})

				if (append) {
					// Append new posts to existing list
					setPosts((prevPosts) => [...prevPosts, ...(allPosts || [])])
				} else {
					// Replace entire list (for initial load or refresh)
					setPosts(allPosts || [])
				}

				// Determine if there are more posts to load
				const hasMore = (allPosts?.length || 0) === pagination.limit
				setPagination((prev) => ({
					...prev,
					currentPage: page,
					hasMore,
					isLoadingMore: false,
				}))
			} catch (error) {
				console.error('Error fetching posts:', error)
				if (!append) {
					setPosts([])
				}
				setPagination((prev) => ({ ...prev, isLoadingMore: false }))
			} finally {
				setLoading(false)
			}
		},
		[pagination.limit, searchQuery, filter],
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
	}, [filter, searchQuery, isAuthenticated, fetchPosts])

	// Filter posts by current filter and search (client-side filtering)
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

	const getStatusColor = (status: string) => {
		const colors: { [key: string]: string } = {
			IDEA: '#3b82f6',
			SCRIPTING: '#888888',
			DRAFT: '#888888',
			RECORDING: '#ec4899',
			EDITING: '#FFD700',
			SCHEDULED: '#FFD700',
			POSTED: '#4ade80',
			PUBLISHED: '#4ade80',
		}
		return colors[status] || '#FFFFFF'
	}

	const renderPost = ({ item }: { item: Post }) => (
		<TouchableOpacity
			style={styles.postCard}
			activeOpacity={0.75}
			onPress={() => router.push(`/(tabs)/post-detail?postId=${item.id}`)}
		>
			<View style={styles.postHeader}>
				<TouchableOpacity
					style={[
						styles.postLeft,
						{ borderColor: getStatusColor(item.status) + '44' },
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
							{ backgroundColor: getStatusColor(item.status) },
						]}
					/>
					<Text
						style={[
							styles.statusText,
							{ color: getStatusColor(item.status) },
						]}
					>
						{STATUS_LABELS[item.status] || item.status}
					</Text>
					<Ionicons
						name='chevron-down'
						size={12}
						color={getStatusColor(item.status)}
					/>
				</TouchableOpacity>
				<Text style={styles.postDate}>
					{new Date(item.createdAt).toLocaleDateString()}
				</Text>
			</View>

			<Text style={styles.postTitle} numberOfLines={2}>
				{item.title || 'Untitled Post'}
			</Text>

			<Text style={styles.postContent} numberOfLines={3}>
				{buildPreviewText(item.content)}
			</Text>
		</TouchableOpacity>
	)

	// Footer component to show loading indicator when fetching more posts
	const renderFooter = () => {
		if (!pagination.isLoadingMore) return null
		return (
			<View style={styles.footerLoader}>
				<ActivityIndicator size='small' color='#d4af37' />
				<Text style={styles.footerText}>Loading more posts...</Text>
			</View>
		)
	}

	const emptyComponent = (
		<View style={styles.emptyState}>
			<Text style={styles.emptyEmoji}>*</Text>
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

	if (loading) {
		return (
			<View
				style={[
					styles.container,
					{ justifyContent: 'center', alignItems: 'center' },
				]}
			>
				<ActivityIndicator size='large' color='#d4af37' />
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View>
					<Text style={styles.headerTitle}>Your Content</Text>
					<Text style={styles.headerSubtitle}>
						{filteredPosts.length} post
						{filteredPosts.length !== 1 ? 's' : ''}
					</Text>
				</View>
				<TouchableOpacity
					onPress={() => router.push('/(tabs)/create-post')}
				>
					<Ionicons
						name='add-circle-outline'
						size={28}
						color='#d4af37'
					/>
				</TouchableOpacity>
			</View>

			<View style={styles.searchContainer}>
				<Ionicons
					name='search-outline'
					size={20}
					color='rgba(255,255,255,0.4)'
				/>
				<TextInput
					style={styles.searchInput}
					placeholder='Search content...'
					placeholderTextColor='rgba(255,255,255,0.4)'
					value={searchQuery}
					onChangeText={setSearchQuery}
				/>
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
					data={filteredPosts}
					renderItem={renderPost}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					onEndReached={onEndReached}
					onEndReachedThreshold={0.5}
					ListFooterComponent={renderFooter}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor='#d4af37'
						/>
					}
				/>
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
								{selectedPostForStatus?.title
									? `Update status: ${selectedPostForStatus.title}`
									: 'Update Post Status'}
							</Text>
							<TouchableOpacity
								onPress={() => setSelectedPostForStatus(null)}
							>
								<Ionicons name='close-circle' size={24} color='#666666' />
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
											isCurrent && styles.stageOptionRowActive,
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
													{ backgroundColor: stage.color + '22' },
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
													isCurrent && styles.stageLabelActive,
												]}
											>
												{stage.label}
											</Text>
										</View>

										{isCurrent && (
											<Ionicons
												name='checkmark'
												size={18}
												color='#d4af37'
											/>
										)}
									</TouchableOpacity>
								)
							})}
						</View>
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0a192f',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingTop: 16,
		paddingBottom: 16,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#ffffff',
	},
	headerSubtitle: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.5)',
		marginTop: 4,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderRadius: 8,
		paddingHorizontal: 12,
		marginHorizontal: 24,
		marginBottom: 0,
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.2)',
	},
	searchInput: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 8,
		color: '#ffffff',
		fontSize: 14,
	},
	filtersContainer: {
		flexGrow: 0,
		marginTop: 8,
		marginBottom: 16,
		maxHeight: 40,
	},
	filters: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 24,
		gap: 8,
	},
	filterButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.1)',
		justifyContent: 'center',
		alignItems: 'center',
		minWidth: 64,
	},
	filterButtonActive: {
		backgroundColor: '#d4af37',
		borderColor: '#d4af37',
	},
	filterText: {
		fontSize: 12,
		fontWeight: '600',
		color: 'rgba(255,255,255,0.6)',
	},
	filterTextActive: {
		color: '#0a192f',
	},
	listContent: {
		paddingHorizontal: 24,
		paddingBottom: 36,
	},
	postCard: {
		backgroundColor: 'rgba(255,255,255,0.035)',
		borderRadius: 16,
		padding: 16,
		marginBottom: 14,
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.12)',
	},
	postHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	postLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 10,
		borderWidth: 1,
		backgroundColor: 'rgba(255,255,255,0.04)',
	},
	statusDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	statusText: {
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	postTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#ffffff',
		marginBottom: 8,
		lineHeight: 22,
	},
	postContent: {
		fontSize: 13,
		color: 'rgba(255,255,255,0.6)',
		lineHeight: 18,
	},
	postDate: {
		fontSize: 11,
		color: 'rgba(255,255,255,0.5)',
	},
	emptyState: {
		alignItems: 'center',
		paddingTop: 60,
	},
	emptyEmoji: {
		fontSize: 64,
		marginBottom: 16,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: '700',
		color: '#ffffff',
		marginBottom: 8,
	},
	emptySubtext: {
		fontSize: 14,
		color: 'rgba(255,255,255,0.5)',
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
		color: 'rgba(255,255,255,0.6)',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.7)',
		justifyContent: 'flex-end',
	},
	modalSheet: {
		backgroundColor: '#161618',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.1)',
	},
	sheetHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255,255,255,0.08)',
	},
	sheetTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#ffffff',
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
		backgroundColor: 'rgba(255,255,255,0.03)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.06)',
	},
	stageOptionRowActive: {
		backgroundColor: 'rgba(212,175,55,0.12)',
		borderColor: 'rgba(212,175,55,0.4)',
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
		fontWeight: '600',
		color: 'rgba(255,255,255,0.8)',
	},
	stageLabelActive: {
		color: '#d4af37',
		fontWeight: '700',
	},
})
