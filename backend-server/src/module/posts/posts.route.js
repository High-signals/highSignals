import express from 'express'
import { authenticateToken } from '../../shared/middleware/auth.middleware.js'
import {
  createPost,
  getAllPosts,
  getPostsByStatus,
  updatePost,
  deletePost,
} from './posts.controller.js'

const router = express.Router()

// @route   POST /api/posts
// @desc    Create a new post
router.post('/', authenticateToken, createPost)

// @route   GET /api/posts
// @desc    Get all user posts
router.get('/', authenticateToken, getAllPosts)

// @route   GET /api/posts/status/:status
// @desc    Get posts by status (DRAFT, SCHEDULED, PUBLISHED, FAILED)
router.get('/status', authenticateToken, getPostsByStatus)

// @route   PATCH /api/posts/:postId
// @desc    Update a post
router.patch('/:postId', authenticateToken, updatePost)

// @route   DELETE /api/posts/:postId
// @desc    Delete a post (soft delete)
router.delete('/:postId', authenticateToken, deletePost)

export default router
