import express from 'express'
import { authenticateToken } from '../../shared/middleware/auth.middleware.js'
import { createICP, editICP, getICP } from './icp.controller.js'

const router = express.Router()

/**
 * @swagger
 * /api/icp:
 *   post:
 *     summary: Create ICP profile for authenticated user
 *     tags: [ICP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICP'
 *     responses:
 *       201:
 *         description: ICP profile created
 *       400:
 *         description: Bad request
 */
router.post('/', authenticateToken, createICP)
/**
 * @swagger
 * /api/icp/edit:
 *   put:
 *     summary: Update ICP profile for authenticated user
 *     tags: [ICP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ICP'
 *     responses:
 *       200:
 *         description: ICP profile updated
 *       400:
 *         description: Bad request
 */
router.put('/edit', authenticateToken, editICP)
/**
 * @swagger
 * /api/icp:
 *   get:
 *     summary: Retrieve ICP profile for authenticated user
 *     tags: [ICP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ICP profile fetched
 *       404:
 *         description: Not found
 */
router.get('/', authenticateToken, getICP)

export default router
