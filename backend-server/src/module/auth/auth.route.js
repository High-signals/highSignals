import express from 'express'
<<<<<<< HEAD
import { register, login, googleLogin, requestPasswordReset, resetUserPassword } from './auth.controller.js'
=======
import {
	register,
	login,
	googleLogin,
	forgotPasswordRequest,
	resetPasswordRequest,
} from './auth.controller.js'
import { rateLimit } from 'express-rate-limit'
>>>>>>> e5acc3cb22f56aa3e3701bfdfdc4df71d386edb2

const router = express.Router()

rateLimit({
	windowMs: 5 * 60 * 1000,
	limit: 10,
	message: 'Too many requests from this IP. Please try again later.',
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login)

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Missing fields
 *       409:
 *         description: User already exists
 */
router.post('/register', register)

router.post('/google', googleLogin)
<<<<<<< HEAD
router.post('/forgot-password', requestPasswordReset)
router.post('/reset-password', resetUserPassword)
=======
router.post('/forgot-password', forgotPasswordRequest)
router.post('/reset-password', resetPasswordRequest)
>>>>>>> e5acc3cb22f56aa3e3701bfdfdc4df71d386edb2
// router.post('/refresh', refreshToken)
// router.post('/logout', logout)

export default router
