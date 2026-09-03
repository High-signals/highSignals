import { Router } from 'express'
import {
	analyzePostController,
    revampPostController
} from './ai.controller.js'
import { authenticateToken } from '../../shared/middleware/auth.middleware.js'

const aiRouter = Router()

aiRouter.use(authenticateToken)

/**
 * @swagger
 * /api/ai/analyze/{postId}:
 *   post:
 *     summary: Analyze post content (Free)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               contentType:
 *                 type: string
 *               icpProfile:
 *                 type: object
 *     responses:
 *       200:
 *         description: AI Analysis retrieved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
aiRouter.post('/analyze/:postId', analyzePostController)

/**
 * @swagger
 * /api/ai/revamp/{postId}:
 *   post:
 *     summary: Revamp post content (Costs 1 usage credit)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               contentType:
 *                 type: string
 *               icpProfile:
 *                 type: object
 *     responses:
 *       200:
 *         description: Post revamped successfully
 *       429:
 *         description: Exceeded daily limit
 *       401:
 *         description: Unauthorized
 */
aiRouter.post('/revamp/:postId', revampPostController)

export default aiRouter
