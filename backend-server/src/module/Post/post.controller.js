import { createPostService, editPostService } from './post.service.js'
import AppError from '../../shared/service/appError.js'
import asyncHandler from '../../shared/service/asyncHandler.js'

export const createPostController = asyncHandler(async (req, res, next) => {
	const userId = req.user?.id

	const {
		title,
		content,
		platforms,
		mediaUrls,
		platformContent,
		externalPostIds,
		status,
		scheduledAt,
		publishedAt,
	} = req.body

	if (!userId) {
		throw new AppError('Unauthorized', 401)
	}

	if (!content) {
		throw new AppError('Content is required', 400)
	}

	if (!platforms || !Array.isArray(platforms)) {
		throw new AppError('Platforms must be an array', 400)
	}

	const data = {
		title,
		content,
		platforms,
		mediaUrls,
		platformContent,
		externalPostIds,
		status,
		scheduledAt,
		publishedAt,
	}

	const result = await createPostService(userId, data)

	return res.status(201).json(result)
})

export const editPostController = asyncHandler(async (req, res, next) => {
	const userId = req.user?.id
	const { postId } = req.params

	const {
		title,
		content,
		platforms,
		mediaUrls,
		platformContent,
		externalPostIds,
		status,
		scheduledAt,
		publishedAt,
	} = req.body

	if (!userId) {
		throw new AppError('Unauthorized', 401)
	}

	if (!postId) {
		throw new AppError('Post ID is required', 400)
	}

	// Clean only provided fields
	const data = {}

	if (title !== undefined) data.title = title
	if (content !== undefined) data.content = content
	if (platforms !== undefined) data.platforms = platforms
	if (mediaUrls !== undefined) data.mediaUrls = mediaUrls
	if (platformContent !== undefined) data.platformContent = platformContent
	if (externalPostIds !== undefined) data.externalPostIds = externalPostIds
	if (status !== undefined) data.status = status
	if (scheduledAt !== undefined) data.scheduledAt = scheduledAt
	if (publishedAt !== undefined) data.publishedAt = publishedAt

	const result = await editPostService(userId, postId, data)

	return res.status(200).json(result)
})

export const deletePostController = asyncHandler(async (req, res, next) => {
	const userId = req.user?.id
	const { postId } = req.params

	if (!userId) {
		throw new AppError('Unauthorized', 401)
	}

	if (!postId) {
		throw new AppError('Post ID is required', 400)
	}

	const result = await deletePostService(userId, postId)

	return res.status(200).json(result)
})

export const getAllPostsController = asyncHandler(async (req, res, next) => {
	const userId = req.user?.id

	if (!userId) {
		throw new AppError('Unauthorized', 401)
	}

	const { search = '', page = 1, limit = 10 } = req.query

	const result = await getAllPostsService(userId, {
		search,
		page: Number(page),
		limit: Number(limit),
	})

	return res.status(200).json(result)
})

export const getPostByIdController = asyncHandler(async (req, res, next) => {
	const userId = req.user?.id
	const { postId } = req.params

	if (!userId) {
		throw new AppError('Unauthorized', 401)
	}

	if (!postId) {
		throw new AppError('Post ID is required', 400)
	}

	const result = await getPostByIdService(userId, postId)

	return res.status(200).json(result)
})
