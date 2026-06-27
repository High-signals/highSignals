import asyncHandler from '../../shared/service/asyncHandler.js'
import {
  getAllPostsService,
  getPostsByStatusService,
  createPostService,
  updatePostService,
  deletePostService,
} from './posts.service.js'

export const createPost = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { title, content, hashtags, mediaUrls, platforms, scheduledAt } = req.body

  if (!content) {
    return res.status(400).json({ message: 'Content is required' })
  }

  const post = await createPostService(userId, {
    title,
    content,
    hashtags: hashtags || [],
    mediaUrls: mediaUrls || [],
    platforms: platforms || [],
    scheduledAt,
  })

  res.status(201).json(post)
})

export const getAllPosts = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const posts = await getAllPostsService(userId)
  res.status(200).json(posts)
})

export const getPostsByStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { status } = req.query

  if (!status) {
    return res.status(400).json({ message: 'Status is required' })
  }

  const posts = await getPostsByStatusService(userId, status)
  res.status(200).json(posts)
})

export const updatePost = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { postId } = req.params
  const updateData = req.body

  const post = await updatePostService(userId, postId, updateData)
  res.status(200).json(post)
})

export const deletePost = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { postId } = req.params

  const post = await deletePostService(userId, postId)
  res.status(200).json({ message: 'Post deleted successfully', post })
})
