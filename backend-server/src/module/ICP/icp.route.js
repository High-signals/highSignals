import express from 'express'
import { authenticateToken } from '../../shared/middleware/auth.middleware.js'
import { createICP, editICP, getICP } from './icp.controller.js'

const router = express.Router()

router.post('/', authenticateToken, createICP)
router.put('/edit', authenticateToken, editICP)
router.get('/', authenticateToken, getICP)

export default router
