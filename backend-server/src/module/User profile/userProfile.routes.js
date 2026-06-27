import express from 'express'
import multer from 'multer'
import { authenticateToken } from './../../shared/middleware/auth.middleware.js'
import {
	getUserProfileController,
	updateUserProfileController,
	deleteUserProfileController,
	getContentPlatformsController,
	editContentPlatformsController,
	uploadAvatarController,
	deleteAvatarController,
} from './userProfile.controller.js'

const router = express.Router()

const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith('image/')) return cb(null, true)
		cb(new Error('Only image uploads are allowed'))
	},
})

router.use(authenticateToken)

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get authenticated user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: clx123abc
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 avatar:
 *                   type: string
 *                   example: https://example.com/avatar.png
 *                 bio:
 *                   type: string
 *                   example: Software developer
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/profile', getUserProfileController)

/**
 * @swagger
 * /api/user/content-platforms:
 *   get:
 *     summary: Get connected social media platforms for the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved connected platforms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   twitterId:
 *                     type: string
 *                     example: "123456789"
 *                     nullable: true
 *                   facebookId:
 *                     type: string
 *                     example: "987654321"
 *                     nullable: true
 *                   linkedInId:
 *                     type: string
 *                     example: "linkedin_user_123"
 *                     nullable: true
 *                   tiktokId:
 *                     type: string
 *                     example: "tiktok_user_123"
 *                     nullable: true
 *                   instagramId:
 *                     type: string
 *                     example: "insta_user_123"
 *                     nullable: true
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/content-platforms', getContentPlatformsController)

/**
 * @swagger
 * /api/user/content-platforms:
 *   patch:
 *     summary: Update connected social media platforms for the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               twitterId:
 *                 type: string
 *                 example: "123456789"
 *                 nullable: true
 *               facebookId:
 *                 type: string
 *                 example: "987654321"
 *                 nullable: true
 *               linkedInId:
 *                 type: string
 *                 example: "linkedin_user_123"
 *                 nullable: true
 *               tiktokId:
 *                 type: string
 *                 example: "tiktok_user_123"
 *                 nullable: true
 *               instagramId:
 *                 type: string
 *                 example: "insta_user_123"
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Platforms updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Content platforms updated successfully
 *       400:
 *         description: Bad request (invalid input)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request data
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.patch('/content-platforms', editContentPlatformsController)

/**
 * @swagger
 * /api/user/profile:
 *   patch:
 *     summary: Update authenticated user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.png
 *               bio:
 *                 type: string
 *                 example: Software developer
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: clx123abc
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 avatar:
 *                   type: string
 *                   example: https://example.com/avatar.png
 *                 bio:
 *                   type: string
 *                   example: Software developer
 *       400:
 *         description: Bad request (invalid input)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request data
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.patch('/profile', updateUserProfileController)

/**
 * @swagger
 * /api/user/profile:
 *   delete:
 *     summary: Delete authenticated user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile deleted successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.delete('/profile', deleteUserProfileController)

/**
 * @swagger
 * /api/user/avatar:
 *   post:
 *     summary: Upload (or replace) the authenticated user's avatar
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded; returns updated profile with new avatar URL
 *       400:
 *         description: Missing file or unsupported image type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Upload failed
 */
router.post('/avatar', avatarUpload.single('file'), uploadAvatarController)

/**
 * @swagger
 * /api/user/avatar:
 *   delete:
 *     summary: Remove the authenticated user's avatar
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar cleared; returns updated profile
 *       401:
 *         description: Unauthorized
 */
router.delete('/avatar', deleteAvatarController)

export default router
