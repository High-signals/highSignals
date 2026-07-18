import { Router } from 'express'
import multer from 'multer'
import { authenticateToken } from '../../shared/middleware/auth.middleware.js'
import { transcribeController } from './transcription.controller.js'

const transcriptionRouter = Router()

// Raw PCM audio held in memory (like the avatar upload) then streamed to Google.
const audioUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB (~13 min of PCM16 @16kHz)
})

transcriptionRouter.use(authenticateToken)

/**
 * @swagger
 * /api/transcribe:
 *   post:
 *     summary: Batch transcribe a recorded audio clip (retry flow)
 *     tags: [Transcription]
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
 *         description: Transcript returned
 *       400:
 *         description: No audio uploaded
 *       401:
 *         description: Unauthorized
 */
transcriptionRouter.post('/', audioUpload.single('file'), transcribeController)

export default transcriptionRouter
