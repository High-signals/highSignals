import 'dotenv/config'
import admin from 'firebase-admin'

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

if (!serviceAccountKey) {
	throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required')
}

const serviceAccount = JSON.parse(serviceAccountKey)

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	})
}

export default admin
