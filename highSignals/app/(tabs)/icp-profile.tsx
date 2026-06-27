import React, { useEffect, useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'

type ICPType = 'BUSINESS' | 'CREATOR'

type ICPRecord = {
	id: string
	userId: string
	type: ICPType
	profession: string | null
	audience: string | null
	problem: string | null
	desiredOutcome: string | null
	contentTopic: string | null
	backstory: string | null
	goal: string | null
	demographics: string | null
	additional: string | null
	createdAt: string
	updatedAt: string
}

type BusinessDraft = {
	type: 'BUSINESS'
	profession: string
	dreamClient: string
	problem: string
	outcome: string
	story: string
	demographics: string
	additional: string
}

type CreatorDraft = {
	type: 'CREATOR'
	topic: string
	dreamFollower: string
	followReason: string
	feeling: string
	backstory: string
	goal: string
}

type ICPDraft = BusinessDraft | CreatorDraft

const emptyBusinessDraft: BusinessDraft = {
	type: 'BUSINESS',
	profession: '',
	dreamClient: '',
	problem: '',
	outcome: '',
	story: '',
	demographics: '',
	additional: '',
}

const emptyCreatorDraft: CreatorDraft = {
	type: 'CREATOR',
	topic: '',
	dreamFollower: '',
	followReason: '',
	feeling: '',
	backstory: '',
	goal: '',
}

const followReasonOptions = [
	'To learn something new',
	'To be entertained',
	'To feel inspired',
	'Because my life is relatable',
]

const goalOptions = ['To get brand deals', 'Just to build a community']

const mapApiToDraft = (icp: ICPRecord): ICPDraft => {
	if (icp.type === 'CREATOR') {
		return {
			type: 'CREATOR',
			topic: icp.contentTopic || '',
			dreamFollower: icp.audience || '',
			followReason: icp.problem || '',
			feeling: icp.desiredOutcome || '',
			backstory: icp.backstory || '',
			goal: icp.goal || '',
		}
	}

	return {
		type: 'BUSINESS',
		profession: icp.profession || '',
		dreamClient: icp.audience || '',
		problem: icp.problem || '',
		outcome: icp.desiredOutcome || '',
		story: icp.backstory || '',
		demographics: icp.demographics || '',
		additional: icp.additional || '',
	}
}

const buildPayload = (draft: ICPDraft) => {
	if (draft.type === 'CREATOR') {
		return {
			type: 'CREATOR',
			topic: draft.topic,
			dreamFollower: draft.dreamFollower,
			followReason: draft.followReason,
			feeling: draft.feeling,
			backstory: draft.backstory,
			goal: draft.goal,
		}
	}

	return {
		type: 'BUSINESS',
		profession: draft.profession,
		dreamClient: draft.dreamClient,
		problem: draft.problem,
		outcome: draft.outcome,
		story: draft.story,
		demographics: draft.demographics,
		additional: draft.additional,
	}
}

const formatDate = (value?: string | null) => {
	if (!value) return 'recently'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return 'recently'
	return date.toLocaleDateString()
}

function DetailCard({
	label,
	value,
	wide = false,
}: {
	label: string
	value?: string
	wide?: boolean
}) {
	return (
		<View style={[styles.detailCard, wide && styles.detailCardWide]}>
			<Text style={styles.detailLabel}>{label}</Text>
			<Text style={styles.detailValue}>{value || 'Not filled yet'}</Text>
		</View>
	)
}

function FormField({
	label,
	value,
	onChangeText,
	placeholder,
	multiline = false,
}: {
	label: string
	value: string
	onChangeText: (value: string) => void
	placeholder?: string
	multiline?: boolean
}) {
	return (
		<View style={styles.fieldGroup}>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor='rgba(255,255,255,0.35)'
				style={[styles.input, multiline && styles.textarea]}
				multiline={multiline}
				textAlignVertical={multiline ? 'top' : 'center'}
			/>
		</View>
	)
}

function OptionGroup({
	label,
	options,
	value,
	onChange,
}: {
	label: string
	options: string[]
	value: string
	onChange: (value: string) => void
}) {
	return (
		<View style={styles.fieldGroup}>
			<Text style={styles.label}>{label}</Text>
			<View style={styles.optionWrap}>
				{options.map((option) => {
					const selected = value === option
					return (
						<TouchableOpacity
							key={option}
							activeOpacity={0.9}
							style={[
								styles.optionChip,
								selected && styles.optionChipSelected,
							]}
							onPress={() => onChange(option)}
						>
							<Text
								style={[
									styles.optionChipText,
									selected && styles.optionChipTextSelected,
								]}
							>
								{option}
							</Text>
						</TouchableOpacity>
					)
				})}
			</View>
		</View>
	)
}

export default function ICPProfileScreen() {
	const router = useRouter()
	const { isAuthenticated } = useAuth()
	const [icp, setIcp] = useState<ICPRecord | null>(null)
	const [draft, setDraft] = useState<ICPDraft | null>(null)
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (isAuthenticated) {
			fetchICP()
			return
		}

		setLoading(false)
	}, [isAuthenticated])

	const fetchICP = async () => {
		try {
			setLoading(true)
			const icpData = (await api.icp.get()) as ICPRecord
			setIcp(icpData)
			setDraft(mapApiToDraft(icpData))
		} catch (error) {
			console.error('Error fetching ICP:', error)
			const message = String((error as any)?.message || '')
			if (!message.toLowerCase().includes('not found')) {
				Alert.alert('Error', 'Failed to load ICP profile')
			}
		} finally {
			setLoading(false)
		}
	}

	const currentDraft = useMemo(() => {
		if (isEditing) return draft
		return icp ? mapApiToDraft(icp) : null
	}, [draft, icp, isEditing])

	const profileTypeLabel = useMemo(
		() => (icp?.type === 'CREATOR' ? 'Content Creator' : 'Business Owner'),
		[icp?.type],
	)

	const startEditing = () => {
		if (!icp) {
			router.push('/onboarding-new')
			return
		}

		setDraft(mapApiToDraft(icp))
		setIsEditing(true)
	}

	const cancelEditing = () => {
		setDraft(icp ? mapApiToDraft(icp) : null)
		setIsEditing(false)
	}

	const handleCreateNew = () => {
		router.push('/onboarding-new')
	}

	const handleSaveChanges = async () => {
		if (!draft) return

		try {
			setIsSaving(true)
			const updated = (await api.icp.update(buildPayload(draft))) as ICPRecord
			setIcp(updated)
			setDraft(mapApiToDraft(updated))
			setIsEditing(false)
			Alert.alert('Success', 'ICP profile updated successfully')
		} catch (error) {
			console.error('Error saving ICP:', error)
			Alert.alert('Error', 'Failed to save ICP profile')
		} finally {
			setIsSaving(false)
		}
	}

	const renderBusinessView = (value: BusinessDraft) => (
		<>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Positioning</Text>
				<DetailCard label='What you do' value={value.profession} wide />
				<DetailCard label='Dream client' value={value.dreamClient} wide />
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Audience & Value</Text>
				<View style={styles.sectionGrid}>
					<DetailCard label='Main problem' value={value.problem} />
					<DetailCard label='Dream outcome' value={value.outcome} />
				</View>
				<DetailCard label='Audience demographics' value={value.demographics} wide />
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Authority</Text>
				<DetailCard label='Your story' value={value.story} wide />
				<DetailCard label='Additional notes' value={value.additional} wide />
			</View>
		</>
	)

	const renderCreatorView = (value: CreatorDraft) => (
		<>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Positioning</Text>
				<DetailCard label='Main content topic' value={value.topic} wide />
				<DetailCard label='Dream follower' value={value.dreamFollower} wide />
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Audience Angle</Text>
				<View style={styles.sectionGrid}>
					<DetailCard label='Why they follow' value={value.followReason} />
					<DetailCard label='How they should feel' value={value.feeling} />
				</View>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Story & Goal</Text>
				<DetailCard label='Backstory' value={value.backstory} wide />
				<DetailCard label='Audience goal' value={value.goal} wide />
			</View>
		</>
	)

	const renderBusinessForm = (value: BusinessDraft) => (
		<>
			<FormField
				label='What do you do?'
				value={value.profession}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'BUSINESS'
							? { ...prev, profession: text }
							: prev,
					)
				}
				placeholder='e.g. I help small businesses grow revenue'
			/>
			<FormField
				label='Dream client'
				value={value.dreamClient}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'BUSINESS'
							? { ...prev, dreamClient: text }
							: prev,
					)
				}
				placeholder='e.g. Founders with 5-10 employees'
			/>
			<FormField
				label='Main problem you solve'
				value={value.problem}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'BUSINESS'
							? { ...prev, problem: text }
							: prev,
					)
				}
				placeholder='e.g. They struggle to get consistent leads'
			/>
			<FormField
				label='Dream outcome'
				value={value.outcome}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'BUSINESS'
							? { ...prev, outcome: text }
							: prev,
					)
				}
				placeholder='e.g. Predictable monthly revenue'
			/>
			<FormField
				label='Your story / expertise'
				value={value.story}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'BUSINESS'
							? { ...prev, story: text }
							: prev,
					)
				}
				placeholder='e.g. I built and scaled 3 businesses'
				multiline
			/>
			<FormField
				label='Demographics'
				value={value.demographics}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'BUSINESS'
							? { ...prev, demographics: text }
							: prev,
					)
				}
				placeholder='e.g. 30-45 year old entrepreneurs'
				multiline
			/>
			<FormField
				label='Additional notes'
				value={value.additional}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'BUSINESS'
							? { ...prev, additional: text }
							: prev,
					)
				}
				placeholder='Anything else about your audience'
				multiline
			/>
		</>
	)

	const renderCreatorForm = (value: CreatorDraft) => (
		<>
			<FormField
				label='Main content topic'
				value={value.topic}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'CREATOR'
							? { ...prev, topic: text }
							: prev,
					)
				}
				placeholder='e.g. Healthy recipes, tech tips, productivity'
			/>
			<FormField
				label='Dream follower'
				value={value.dreamFollower}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'CREATOR'
							? { ...prev, dreamFollower: text }
							: prev,
					)
				}
				placeholder='e.g. College students trying to land a job'
			/>
			<OptionGroup
				label='Why do people follow you?'
				options={followReasonOptions}
				value={value.followReason}
				onChange={(selected) =>
					setDraft((prev) =>
						prev && prev.type === 'CREATOR'
							? { ...prev, followReason: selected }
							: prev,
					)
				}
			/>
			<FormField
				label='How should they feel after seeing your post?'
				value={value.feeling}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'CREATOR'
							? { ...prev, feeling: text }
							: prev,
					)
				}
				placeholder='e.g. Motivated to take action'
			/>
			<FormField
				label='Backstory / journey'
				value={value.backstory}
				onChangeText={(text) =>
					setDraft((prev) =>
						prev && prev.type === 'CREATOR'
							? { ...prev, backstory: text }
							: prev,
					)
				}
				placeholder='e.g. I quit my 9-5 to build in public'
				multiline
			/>
			<OptionGroup
				label='Audience goal'
				options={goalOptions}
				value={value.goal}
				onChange={(selected) =>
					setDraft((prev) =>
						prev && prev.type === 'CREATOR'
							? { ...prev, goal: selected }
							: prev,
					)
				}
			/>
		</>
	)

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name='arrow-back' size={24} color='#ffffff' />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>ICP Profile</Text>
					<View style={{ width: 24 }} />
				</View>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#d4af37' />
				</View>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => {
						if (isEditing) {
							cancelEditing()
							return
						}

						router.back()
					}}
				>
					<Ionicons name='arrow-back' size={24} color='#ffffff' />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>
					{isEditing ? 'Edit ICP' : 'ICP Profile'}
				</Text>
				{!isEditing && icp ? (
					<TouchableOpacity onPress={startEditing}>
						<Ionicons name='create-outline' size={24} color='#d4af37' />
					</TouchableOpacity>
				) : isEditing ? (
					<TouchableOpacity onPress={handleSaveChanges} disabled={isSaving}>
						<Text style={styles.saveButton}>
							{isSaving ? 'Saving...' : 'Save'}
						</Text>
					</TouchableOpacity>
				) : (
					<View style={{ width: 24 }} />
				)}
			</View>

			<ScrollView
				style={styles.content}
				contentContainerStyle={styles.contentContainer}
				showsVerticalScrollIndicator={false}
			>
				{!icp && !isEditing ? (
					<View style={styles.emptyState}>
						<View style={styles.emptyBadge}>
							<Ionicons name='sparkles-outline' size={18} color='#d4af37' />
							<Text style={styles.emptyBadgeText}>ICP Setup</Text>
						</View>
						<Text style={styles.emptyTitle}>No ICP profile yet</Text>
						<Text style={styles.emptySubtext}>
							Build a clear picture of your audience so the app can help
							you write smarter, sharper content.
						</Text>

						<View style={styles.emptyList}>
							<View style={styles.emptyListItem}>
								<Ionicons
									name='checkmark-circle-outline'
									size={18}
									color='#d4af37'
								/>
								<Text style={styles.emptyListText}>
									Audience clarity in one place
								</Text>
							</View>
							<View style={styles.emptyListItem}>
								<Ionicons
									name='checkmark-circle-outline'
									size={18}
									color='#d4af37'
								/>
								<Text style={styles.emptyListText}>
									Better post ideas and angles
								</Text>
							</View>
							<View style={styles.emptyListItem}>
								<Ionicons
									name='checkmark-circle-outline'
									size={18}
									color='#d4af37'
								/>
								<Text style={styles.emptyListText}>
									Faster editing when your audience changes
								</Text>
							</View>
						</View>

						<TouchableOpacity
							style={styles.createButton}
							onPress={handleCreateNew}
						>
							<Ionicons
								name='add-circle-outline'
								size={20}
								color='#ffffff'
							/>
							<Text style={styles.createButtonText}>
								Create ICP Profile
							</Text>
						</TouchableOpacity>
					</View>
				) : !isEditing && currentDraft ? (
					<>
						<View style={styles.heroCard}>
							<View style={styles.heroTopRow}>
								<View style={styles.heroBadge}>
									<Ionicons
										name={
											currentDraft.type === 'CREATOR'
												? 'color-palette-outline'
												: 'briefcase-outline'
										}
										size={16}
										color='#d4af37'
									/>
									<Text style={styles.heroBadgeText}>
										{profileTypeLabel}
									</Text>
								</View>
								<View style={styles.heroMetaPill}>
									<Ionicons
										name='time-outline'
										size={14}
										color='rgba(255,255,255,0.6)'
									/>
									<Text style={styles.heroMetaText}>
										Updated {formatDate(icp?.updatedAt)}
									</Text>
								</View>
							</View>

							<Text style={styles.heroTitle}>
								{currentDraft.type === 'CREATOR'
									? currentDraft.topic || 'Your creator ICP'
									: currentDraft.profession || 'Your business ICP'}
							</Text>
							<Text style={styles.heroSubtitle}>
								{currentDraft.type === 'CREATOR'
									? 'A clear summary of your content angle, audience, and growth goal.'
									: 'A clear summary of who you help, what they need, and why they trust you.'}
							</Text>

							<View style={styles.heroStats}>
								<View style={styles.heroStat}>
									<Text style={styles.heroStatValue}>
										{currentDraft.type === 'CREATOR'
											? currentDraft.dreamFollower
												? '01'
												: '00'
											: currentDraft.dreamClient
												? '01'
												: '00'}
									</Text>
									<Text style={styles.heroStatLabel}>
										{currentDraft.type === 'CREATOR'
											? 'Followers'
											: 'Audience'}
									</Text>
								</View>
								<View style={styles.heroStat}>
									<Text style={styles.heroStatValue}>
										{currentDraft.type === 'CREATOR'
											? currentDraft.goal
												? '01'
												: '00'
											: currentDraft.problem
												? '01'
												: '00'}
									</Text>
									<Text style={styles.heroStatLabel}>
										{currentDraft.type === 'CREATOR'
											? 'Goal'
											: 'Problem'}
									</Text>
								</View>
							</View>
						</View>

						{currentDraft.type === 'BUSINESS'
							? renderBusinessView(currentDraft)
							: renderCreatorView(currentDraft)}
					</>
				) : (
					<>
						<View style={styles.editNoticeCard}>
							<Ionicons name='create-outline' size={18} color='#d4af37' />
							<Text style={styles.editNoticeText}>
								Editing your {profileTypeLabel} ICP
							</Text>
						</View>

						<View style={styles.heroCard}>
							<View style={styles.heroTopRow}>
								<View style={styles.heroBadge}>
									<Ionicons
										name={
											draft?.type === 'CREATOR'
												? 'color-palette-outline'
												: 'briefcase-outline'
										}
										size={16}
										color='#d4af37'
									/>
									<Text style={styles.heroBadgeText}>
										{profileTypeLabel}
									</Text>
								</View>
								<View style={styles.heroMetaPill}>
									<Ionicons
										name='lock-closed-outline'
										size={14}
										color='rgba(255,255,255,0.6)'
									/>
									<Text style={styles.heroMetaText}>Changes save on submit</Text>
								</View>
							</View>

							<Text style={styles.heroTitle}>Update your ICP</Text>
							<Text style={styles.heroSubtitle}>
								Use the type-specific fields below so your audience map stays
								aligned with the way you create content.
							</Text>
						</View>

						{draft?.type === 'BUSINESS'
							? renderBusinessForm(draft)
							: draft?.type === 'CREATOR'
								? renderCreatorForm(draft)
								: null}
					</>
				)}
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0f172a',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 60,
		paddingHorizontal: 20,
		paddingBottom: 16,
		backgroundColor: '#111827',
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(212,175,55,0.15)',
	},
	headerTitle: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '800',
	},
	saveButton: {
		color: '#d4af37',
		fontSize: 16,
		fontWeight: '700',
	},
	content: {
		flex: 1,
	},
	contentContainer: {
		paddingTop: 20,
		paddingHorizontal: 16,
		paddingBottom: 32,
	},
	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 72,
		paddingHorizontal: 12,
	},
	emptyBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: 'rgba(212,175,55,0.1)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.2)',
		marginBottom: 18,
	},
	emptyBadgeText: {
		color: '#d4af37',
		fontSize: 12,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},
	emptyTitle: {
		fontSize: 22,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 10,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: 14,
		lineHeight: 22,
		color: 'rgba(255,255,255,0.65)',
		textAlign: 'center',
		maxWidth: 340,
		marginBottom: 24,
	},
	emptyList: {
		width: '100%',
		gap: 12,
		marginBottom: 28,
	},
	emptyListItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 12,
		backgroundColor: 'rgba(255,255,255,0.04)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.12)',
	},
	emptyListText: {
		color: '#ffffff',
		fontSize: 13,
		fontWeight: '600',
	},
	createButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 24,
		paddingVertical: 12,
		backgroundColor: '#d4af37',
		borderRadius: 12,
	},
	createButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0a192f',
	},
	heroCard: {
		padding: 20,
		borderRadius: 20,
		backgroundColor: 'rgba(212,175,55,0.06)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.18)',
		marginBottom: 18,
	},
	heroTopRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 12,
		marginBottom: 16,
		flexWrap: 'wrap',
	},
	heroBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: 'rgba(212,175,55,0.1)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.2)',
	},
	heroBadgeText: {
		color: '#d4af37',
		fontSize: 12,
		fontWeight: '700',
	},
	heroMetaPill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: 'rgba(255,255,255,0.05)',
	},
	heroMetaText: {
		color: 'rgba(255,255,255,0.7)',
		fontSize: 12,
		fontWeight: '600',
	},
	heroTitle: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 10,
	},
	heroSubtitle: {
		fontSize: 14,
		lineHeight: 22,
		color: 'rgba(255,255,255,0.7)',
		marginBottom: 18,
	},
	heroStats: {
		flexDirection: 'row',
		gap: 10,
	},
	heroStat: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 10,
		borderRadius: 14,
		backgroundColor: 'rgba(255,255,255,0.04)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
	},
	heroStatValue: {
		fontSize: 18,
		fontWeight: '800',
		color: '#d4af37',
		marginBottom: 4,
	},
	heroStatLabel: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.65)',
	},
	section: {
		marginBottom: 18,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '800',
		color: '#d4af37',
		marginBottom: 12,
		textTransform: 'uppercase',
		letterSpacing: 0.9,
	},
	sectionGrid: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 10,
		alignItems: 'stretch',
	},
	detailCard: {
		flex: 1,
		minWidth: 0,
		padding: 16,
		borderRadius: 16,
		backgroundColor: 'rgba(255,255,255,0.04)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.14)',
		marginBottom: 10,
	},
	detailCardWide: {
		width: '100%',
	},
	detailLabel: {
		fontSize: 12,
		fontWeight: '700',
		color: 'rgba(255,255,255,0.6)',
		marginBottom: 8,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	detailValue: {
		fontSize: 15,
		lineHeight: 24,
		color: '#ffffff',
		fontWeight: '500',
		flexShrink: 1,
	},
	editNoticeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 14,
		backgroundColor: 'rgba(212,175,55,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.18)',
		marginBottom: 18,
	},
	editNoticeText: {
		color: '#d4af37',
		fontSize: 13,
		fontWeight: '700',
	},
	fieldGroup: {
		marginBottom: 18,
	},
	label: {
		fontSize: 13,
		fontWeight: '700',
		color: 'rgba(255,255,255,0.8)',
		marginBottom: 8,
	},
	input: {
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.3)',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		color: '#ffffff',
		fontSize: 14,
	},
	textarea: {
		minHeight: 110,
		textAlignVertical: 'top',
		paddingVertical: 12,
	},
	optionWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	optionChip: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 999,
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
		borderColor: 'rgba(212,175,55,0.2)',
	},
	optionChipSelected: {
		backgroundColor: 'rgba(212,175,55,0.18)',
		borderColor: 'rgba(212,175,55,0.5)',
	},
	optionChipText: {
		color: 'rgba(255,255,255,0.8)',
		fontSize: 13,
		fontWeight: '600',
	},
	optionChipTextSelected: {
		color: '#ffffff',
	},
})
