import { analyzePostService, revampPostService } from './ai.service.js'
import AppError from '../../shared/service/appError.js'
import asyncHandler from '../../shared/service/asyncHandler.js'

export const analyzePostController = asyncHandler(async (req, res, next) => {
	const userId = req.user?.id
    const { postId } = req.params
	const { content, contentType, icpProfile, title } = req.body

	if (!userId) {
		throw new AppError('Unauthorized', 401)
	}

	const result = await analyzePostService(userId, postId, content, contentType, icpProfile, title)

	return res.status(200).json(result)
})

export const revampPostController = asyncHandler(async (req, res, next) => {
	const userId = req.user?.id
    const { postId } = req.params
	const { content, contentType, icpProfile, title } = req.body

	if (!userId) {
		throw new AppError('Unauthorized', 401)
	}

	const result = await revampPostService(userId, postId, content, contentType, icpProfile, title)

	return res.status(200).json(result)
})
