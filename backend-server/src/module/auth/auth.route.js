import express from 'express'
import { register, login, googleLogin, requestPasswordReset, resetUserPassword } from './auth.controller.js'

const router = express.Router()

// @route   POST /api/auth/login
router.post('/register', register)
router.post('/login', login)
router.post('/google', googleLogin)
router.post('/forgot-password', requestPasswordReset)
router.post('/reset-password', resetUserPassword)
// router.post('/refresh', refreshToken)
// router.post('/logout', logout)

export default router
