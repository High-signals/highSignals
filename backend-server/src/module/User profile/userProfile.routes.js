import express from 'express'
import { authenticateToken } from './../../shared/middleware/auth.middleware.js'
import {
  getUserProfileController,
  updateUserProfileController,
  deleteUserProfileController,
} from './userProfile.controller.js'

const router = express.Router()

router.get('/profile', authenticateToken, getUserProfileController)
router.patch('/profile', authenticateToken, updateUserProfileController)
router.delete('/profile', authenticateToken, deleteUserProfileController)

export default router
