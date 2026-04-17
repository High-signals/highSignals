import prisma from '../../config/db'
import AppError from '../../shared/service/appError.js'

export async function createPostService(userId, data) {
	const checkUser = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	})

	if (!checkUser) {
		throw new AppError('User not found', 404)
	}

	const post = await prisma.post.create({
		data: {
			userId: checkUser.id,

			title: data.title,
			content: data.content,
			mediaUrls: data.mediaUrls || [],
			platforms: data.platforms,
			platformContent: data.platformContent || null,
			externalPostIds: data.externalPostIds || null,
			status: data.status || 'DRAFT',
			scheduledAt: data.scheduledAt || null,
			publishedAt: data.publishedAt || null,
		},
	})

	return {
		message: 'Post created successfully',
		post,
	}
}

export async function editPostService(userId, postId, data) {
	// 1. Check if post exists and belongs to user
	const post = await prisma.post.findUnique({
		where: { id: postId },
		select: { id: true, userId: true },
	})

	if (!post) {
		throw new AppError('Post not found', 404)
	}

	// 2. Ensure ownership
	if (post.userId !== userId) {
		throw new AppError('You are not allowed to edit this post', 403)
	}

	// 3. Update post
	const updatedPost = await prisma.post.update({
		where: { id: postId },
		data,
	})

	return {
		message: 'Post updated successfully',
		post: updatedPost,
	}
}

export async function deletePostService(userId, postId) {
	const post = await prisma.post.findUnique({
		where: { id: postId },
		select: {
			id: true,
			userId: true,
			isDeleted: true,
		},
	})

	if (!post) {
		throw new AppError('Post not found', 404)
	}

	if (post.isDeleted) {
		throw new AppError('Post already deleted', 400)
	}

	if (post.userId !== userId) {
		throw new AppError('You are not allowed to delete this post', 403)
	}

	await prisma.post.update({
		where: { id: postId },
		data: {
			isDeleted: true,
		},
	})

	return {
		message: 'Post deleted successfully',
	}
}

export async function getAllPostsService(userId, { search, page, limit }) {
	const skip = (page - 1) * limit

	const searchFilter = search
		? {
				OR: [
					{ title: { contains: search, mode: 'insensitive' } },
					{ content: { contains: search, mode: 'insensitive' } },
				],
			}
		: {}

	const posts = await prisma.post.findMany({
		where: {
			userId,
			isDeleted: false,
			...searchFilter,
		},
		orderBy: {
			createdAt: 'desc',
		},
		skip,
		take: limit,
	})

	const total = await prisma.post.count({
		where: {
			userId,
			isDeleted: false,
			...searchFilter,
		},
	})

	return {
		posts,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
	}
}

export async function getPostByIdService(userId, postId) {
	const post = await prisma.post.findFirst({
		where: {
			id: postId,
			userId,
			isDeleted: false,
		},
	})

	if (!post) {
		throw new AppError('Post not found', 404)
	}

	return { post }
}
