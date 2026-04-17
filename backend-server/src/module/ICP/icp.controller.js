import prisma from '../../config/db.js'
import AppError from '../../shared/service/appError.js'
import asyncHandler from '../../shared/service/asyncHandler.js'
import asyncWrapper from '../../shared/service/asyncHandler.js'
import { createICPService } from './icp.service.js'

export const createICP = asyncWrapper(async (req, res) => {
	const { id } = req.user
	const {
		type,
		audienceDescription,
		painPoint,
		desiredOutcome,
		motivation,
		contentTopic,
		backstory,
		goal,
		demographics,
		additional,
	} = req.body

	if (
		!type ||
		!audienceDescription ||
		!painPoint ||
		!desiredOutcome ||
		!motivation ||
		!contentTopic ||
		!backstory ||
		!goal ||
		!demographics ||
		!additional
	) {
		throw new AppError('Missing required fields', 409)
	}

	const newICP = await createICPService(id, {
		type,
		audienceDescription,
		painPoint,
		desiredOutcome,
		motivation,
		contentTopic,
		backstory,
		goal,
		demographics,
		additional,
	})

	res.status(201).json(newICP)
})

export const editICP = asyncHandler(async (req, res) => {
	const { id } = req.user
	const {
		audienceDescription,
		painPoint,
		desiredOutcome,
		motivation,
		contentTopic,
		backstory,
		goal,
		demographics,
		additional,
	} = req.body

	const updatedICP = await prisma.ICP.update({
		where: { userId: id },
		data: {
			audienceDescription,
			painPoint,
			desiredOutcome,
			motivation,
			contentTopic,
			backstory,
			goal,
			demographics,
			additional,
		},
	})

	res.status(200).json(updatedICP)
})

export const getICP = asyncHandler(async (req, res) => {
	const { id } = req.user
	const icp = await prisma.ICP.findUnique({
		where: { userId: id },
	})
	if (!icp) {
		throw new AppError('ICP Profile not found', 404)
	}
	res.status(200).json(icp)
})
