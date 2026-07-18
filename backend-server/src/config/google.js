import { SpeechClient } from '@google-cloud/speech'
import { Storage } from '@google-cloud/storage'

// Service-account credentials are provided as a single stringified JSON env var
// (GOOGLE_APPLICATION_CREDENTIALS_JSON) so the app can run on hosts that only
// support env vars, not credential files (Render/Railway).
let creds = {}
try {
	creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}')
} catch {
	console.warn(
		'[google] GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON — speech features will fail until it is set correctly.',
	)
}

if (!creds.project_id) {
	console.warn(
		'[google] GOOGLE_APPLICATION_CREDENTIALS_JSON missing — Speech-to-Text and GCS uploads will fail until it is set.',
	)
}

// True only when a real service-account was supplied. Used to fail fast with a
// clear message instead of letting the Google client throw NO_ADC_FOUND (which
// otherwise surfaces as an uncaught exception and crashes the process).
export const GOOGLE_READY = !!creds.project_id

const clientOptions = creds.project_id
	? { credentials: creds, projectId: creds.project_id }
	: {}

export const speechClient = new SpeechClient(clientOptions)
export const storage = new Storage(clientOptions)

// Bucket used for long (> ~1 min) audio that must go through Google's
// asynchronous longRunningRecognize (which only accepts gs:// URIs).
export const GCS_BUCKET = process.env.GCS_BUCKET_NAME || ''

// Shared recognition config. LINEAR16 @ 16kHz mono matches the PCM the app
// captures with react-native-live-audio-stream.
export const RECOGNITION_CONFIG = {
	encoding: 'LINEAR16',
	sampleRateHertz: 16000,
	languageCode: 'en-US',
	enableAutomaticPunctuation: true,
}
