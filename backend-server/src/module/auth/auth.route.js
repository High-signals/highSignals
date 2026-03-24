import express from 'express'
import { register, login, googleLogin } from './auth.controller.js'

const router = express.Router()

// @route   POST /api/auth/login
router.post('/register', register)
router.post('/login', login)
router.post('/google', googleLogin)
// router.post('/refresh', refreshToken)
// router.post('/logout', logout)

export default router
