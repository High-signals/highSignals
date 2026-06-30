import 'dotenv/config'
import admin from 'firebase-admin'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let serviceAccount

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim().startsWith('{')) {
	try {
		serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
	} catch (e) {
		console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON, attempting local file fallback:', e.message)
	}
}

if (!serviceAccount) {
	try {
		const fallbackPath = path.resolve(__dirname, '../../../highsignals-firebase-adminsdk-fbsvc-484e9e15b0.json')
		const rawData = fs.readFileSync(fallbackPath, 'utf8')
		serviceAccount = JSON.parse(rawData)
	} catch (err) {
		throw new Error(`Failed to load Firebase service account config: ${err.message}`)
	}
}

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	})
}

export default admin
