import prisma from '../../config/db.js'
import AppError from '../../shared/service/appError.js'
import asyncHandler from '../../shared/service/asyncHandler.js'
import {
	createICPService,
	editICPService,
	normalizeICPType,
	validateICPInput,
} from './icp.service.js'

export const createICP = asyncHandler(async (req, res) => {
	const { id } = req.user
	const type = normalizeICPType(req.body.type)

	validateICPInput(req.body, type)

	const newICP = await createICPService(id, {
		...req.body,
		type,
	})

	res.status(201).json(newICP)
})

export const editICP = asyncHandler(async (req, res) => {
	const { id } = req.user
	const type = req.body.type ? normalizeICPType(req.body.type) : undefined

	if (type) {
		validateICPInput(
			{
				...req.body,
				type,
			},
			type,
			{ partial: true },
		)
	}

	const updatedICP = await editICPService(id, {
		...req.body,
		...(type ? { type } : {}),
	})

	res.status(200).json(updatedICP)
})

export const getICP = asyncHandler(async (req, res) => {
	const { id } = req.user
	const icp = await prisma.iCP.findUnique({
		where: { userId: id },
	})

	if (!icp) {
		throw new AppError('ICP Profile not found', 404)
	}

	res.status(200).json(icp)
})
