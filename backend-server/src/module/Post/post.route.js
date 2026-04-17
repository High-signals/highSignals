import { Router } from 'express'
import {
	createPostController,
	editPostController,
	deletePostController,
	getAllPostsController,
	getPostByIdController,
} from './post.controller.js'
import { authenticateToken } from '../../shared/middleware/auth.middleware.js'

const postRouter = Router()

router.use(authenticateToken)
// Create post
/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - platforms
 *             properties:
 *               title:
 *                 type: string
 *                 example: My first post
 *               content:
 *                 type: string
 *                 example: Hello world 👋
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["TWITTER", "LINKEDIN"]
 *               mediaUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://img.com/1.png"]
 *               status:
 *                 type: string
 *                 example: DRAFT
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
postRouter.post('/', createPostController)

// Get all posts (search + pagination)
/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all user posts (with search and pagination)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: react
 *         description: Search posts by title or content
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
postRouter.get('/', getAllPostsController)

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         example: clx123abc
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       403:
 *         description: Forbidden (not owner)
 *       404:
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 */
postRouter.get('/:postId', getPostByIdController)

// Edit post
/**
 * @swagger
 * /api/posts/{postId}:
 *   put:
 *     summary: Edit a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         example: clx123abc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *               mediaUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Post not found
 */
postRouter.put('/:postId', editPostController)

// Delete post (soft delete)
/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Soft delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         example: clx123abc
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Post not found
 */
postRouter.delete('/:postId', deletePostController)

export default postRouter
