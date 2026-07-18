import {
	speechClient,
	storage,
	GCS_BUCKET,
	RECOGNITION_CONFIG,
} from '../../config/google.js'
import AppError from '../../shared/service/appError.js'

// LINEAR16 @ 16kHz mono = 32000 bytes/sec. Google's synchronous recognize
// accepts up to ~60s; we keep a safety margin and route anything longer to the
// asynchronous longRunningRecognize (which requires a gs:// URI).
const BYTES_PER_SECOND = 16000 * 2 * 1
const SYNC_MAX_SECONDS = 55
const SYNC_MAX_BYTES = BYTES_PER_SECOND * SYNC_MAX_SECONDS

function joinTranscripts(results) {
	return (results || [])
		.map((r) => r.alternatives?.[0]?.transcript ?? '')
		.filter(Boolean)
		.join(' ')
		.trim()
}

/**
 * Transcribe a full recording buffer (used by the Retry flow). Short clips go
 * through the fast synchronous API; long clips are uploaded to GCS and run
 * through longRunningRecognize, then the temporary object is deleted.
 */
export async function transcribeBufferService(buffer) {
	if (!buffer || !buffer.length) {
		throw new AppError('No audio uploaded', 400)
	}

	// Short audio → synchronous recognition (no bucket needed).
	if (buffer.length <= SYNC_MAX_BYTES) {
		const [response] = await speechClient.recognize({
			config: RECOGNITION_CONFIG,
			audio: { content: buffer.toString('base64') },
		})
		return { transcript: joinTranscripts(response.results) }
	}

	// Long audio → must go via Cloud Storage + async recognition.
	if (!GCS_BUCKET) {
		throw new AppError(
			'Recording too long for direct transcription and no storage bucket is configured.',
			500,
		)
	}

	const objectName = `voice/${Date.now()}-${Math.round(
		buffer.length,
	)}.pcm`
	const file = storage.bucket(GCS_BUCKET).file(objectName)

	await file.save(buffer, {
		contentType: 'audio/l16',
		resumable: false,
	})

	try {
		const [operation] = await speechClient.longRunningRecognize({
			config: RECOGNITION_CONFIG,
			audio: { uri: `gs://${GCS_BUCKET}/${objectName}` },
		})
		const [response] = await operation.promise()
		return { transcript: joinTranscripts(response.results) }
	} finally {
		// Best-effort cleanup of the temporary object.
		file.delete().catch(() => {})
	}
}
