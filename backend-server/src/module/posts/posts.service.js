import prisma from '../../config/db.js'
import AppError from '../../shared/service/appError.js'

export const createPostService = async (userId, postData) => {
  const post = await prisma.post.create({
    data: {
      userId,
      ...postData,
      status: 'DRAFT',
    },
  })

  return post
}

export const getAllPostsService = async (userId) => {
  const posts = await prisma.post.findMany({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return posts
}

export const getPostsByStatusService = async (userId, status) => {
  const validStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED']

  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400)
  }

  const posts = await prisma.post.findMany({
    where: {
      userId,
      status,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return posts
}

export const updatePostService = async (userId, postId, updateData) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    throw new AppError('Post not found', 404)
  }

  if (post.userId !== userId) {
    throw new AppError('Unauthorized to update this post', 403)
  }

  if (post.isDeleted) {
    throw new AppError('Cannot update a deleted post', 400)
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: updateData,
  })

  return updatedPost
}

export const deletePostService = async (userId, postId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    throw new AppError('Post not found', 404)
  }

  if (post.userId !== userId) {
    throw new AppError('Unauthorized to delete this post', 403)
  }

  const deletedPost = await prisma.post.update({
    where: { id: postId },
    data: { isDeleted: true },
  })

  return deletedPost
}
