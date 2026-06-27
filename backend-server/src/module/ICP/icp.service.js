import AppError from './../../shared/service/appError.js'
import prisma from '../../config/db.js'

const BUSINESS_REQUIRED_FIELDS = [
	'profession',
	'dreamClient',
	'problem',
	'outcome',
	'story',
	'demographics',
]

const CREATOR_REQUIRED_FIELDS = [
	'topic',
	'dreamFollower',
	'followReason',
	'feeling',
	'backstory',
	'goal',
]

const isProvided = (value) => value !== undefined && value !== null && value !== ''

export const normalizeICPType = (type) => {
	if (!type) {
		return null
	}

	const normalizedType = String(type).toUpperCase()

	if (normalizedType !== 'BUSINESS' && normalizedType !== 'CREATOR') {
		throw new AppError('Invalid ICP type', 400)
	}

	return normalizedType
}

export const validateICPInput = (data, type, { partial = false } = {}) => {
	const requiredFields =
		type === 'BUSINESS' ? BUSINESS_REQUIRED_FIELDS : CREATOR_REQUIRED_FIELDS

	if (partial) {
		return
	}

	const missingFields = requiredFields.filter((field) => !isProvided(data[field]))

	if (missingFields.length > 0) {
		throw new AppError(
			`Missing required fields: ${missingFields.join(', ')}`,
			400,
		)
	}
}

const mapBusinessToICP = (data) => ({
	type: 'BUSINESS',
	profession: data.profession,
	audience: data.dreamClient,
	problem: data.problem,
	desiredOutcome: data.outcome,
	contentTopic: null,
	backstory: data.story,
	goal: null,
	demographics: data.demographics,
	additional: data.additional ?? null,
})

const mapCreatorToICP = (data) => ({
	type: 'CREATOR',
	profession: null,
	audience: data.dreamFollower,
	problem: data.followReason,
	desiredOutcome: data.feeling,
	contentTopic: data.topic,
	backstory: data.backstory,
	goal: data.goal,
	demographics: null,
	additional: null,
})

const mapExistingICPToForm = (icp) => {
	if (icp.type === 'BUSINESS') {
		return {
			type: 'BUSINESS',
			profession: icp.profession,
			dreamClient: icp.audience,
			problem: icp.problem,
			outcome: icp.desiredOutcome,
			story: icp.backstory,
			demographics: icp.demographics,
			additional: icp.additional,
		}
	}

	return {
		type: 'CREATOR',
		topic: icp.contentTopic,
		dreamFollower: icp.audience,
		followReason: icp.problem,
		feeling: icp.desiredOutcome,
		backstory: icp.backstory,
		goal: icp.goal,
	}
}

const buildICPData = (data, existingICP = null) => {
	const type = normalizeICPType(data.type || existingICP?.type)

	if (!type) {
		throw new AppError('ICP type is required', 400)
	}

	const mergedData = existingICP
		? { ...mapExistingICPToForm(existingICP), ...data, type }
		: { ...data, type }

	validateICPInput(mergedData, type)

	return type === 'BUSINESS'
		? mapBusinessToICP(mergedData)
		: mapCreatorToICP(mergedData)
}

export async function createICPService(userId, data) {
	const user = await prisma.user.findUnique({ where: { id: userId } })
	if (!user) {
		throw new AppError('User not found', 404)
	}

	return prisma.iCP.create({
		data: {
			...buildICPData(data),
			userId,
		},
	})
}

export async function editICPService(userId, data) {
	const existingICP = await prisma.iCP.findUnique({
		where: { userId },
	})

	if (!existingICP) {
		throw new AppError('ICP Profile not found', 404)
	}

	return prisma.iCP.update({
		where: { userId },
		data: buildICPData(data, existingICP),
	})
}
