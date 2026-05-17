import admin from '../../config/firebase.js'
import AppError from './appError.js'

export const verifyFirebaseToken = async (idToken) => {
	try {
		const decoded = await admin.auth().verifyIdToken(idToken)
		const googleId = decoded.firebase?.identities?.['google.com']?.[0]

		return {
			uid: decoded.uid,
			googleId: googleId || decoded.uid,
			email: decoded.email,
			name: decoded.name,
			emailVerified: decoded.email_verified === true,
			provider: decoded.firebase?.sign_in_provider,
		}
	} catch (error) {
		throw new AppError('Invalid Firebase token', 400)
	}
}
