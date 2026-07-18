import { transcribeBufferService } from './transcription.service.js'
import AppError from '../../shared/service/appError.js'
import asyncHandler from '../../shared/service/asyncHandler.js'

// POST /api/transcribe — batch (retry) transcription of a full recording.
// Expects a multipart upload with a single `file` field containing raw PCM16
// (LINEAR16 @ 16kHz mono), matching what the app records.
export const transcribeController = asyncHandler(async (req, res) => {
	const userId = req.user?.id
	if (!userId) {
		throw new AppError('Unauthorized', 401)
	}

	const file = req.file
	if (!file || !file.buffer) {
		throw new AppError('No audio uploaded', 400)
	}

	const result = await transcribeBufferService(file.buffer)
	return res.status(200).json(result)
})
