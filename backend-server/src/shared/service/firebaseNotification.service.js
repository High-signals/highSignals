import admin from '../../config/firebase.js'
import prisma from '../../config/db.js'

const INVALID_TOKEN_CODES = [
	'messaging/registration-token-not-registered',
	'messaging/invalid-registration-token',
	'messaging/invalid-argument',
]

function isInvalidTokenError(error) {
	const code = error?.code ?? ''
	return INVALID_TOKEN_CODES.some((c) => code.includes(c))
}

async function deactivateInvalidTokens(tokens) {
	if (!tokens.length) return

	await prisma.deviceToken.updateMany({
		where: {
			token: { in: tokens },
		},
		data: {
			isActive: false,
		},
	})
}

export async function sendNotificationToToken(deviceToken, payload) {
	try {
		return await admin.messaging().send({
			token: deviceToken,
			notification: {
				title: payload.title,
				body: payload.body,
			},
			data: payload.data,
		})
	} catch (error) {
		if (isInvalidTokenError(error)) {
			await deactivateInvalidTokens([deviceToken]).catch((err) =>
				console.error('Failed to deactivate token:', err),
			)
		}
		console.error('Firebase single-token send failed:', error)
		return null
	}
}

export async function sendNotificationToTokens(deviceTokens, payload) {
	if (!deviceTokens.length) {
		return {
			successCount: 0,
			failureCount: 0,
			responses: [],
		}
	}

	const response = await admin.messaging().sendEachForMulticast({
		tokens: deviceTokens,
		notification: {
			title: payload.title,
			body: payload.body,
		},
		data: payload.data,
	})

	const invalidTokens = response.responses
		.map((item, index) => (!item.success && isInvalidTokenError(item.error) ? deviceTokens[index] : null))
		.filter(Boolean)

	await deactivateInvalidTokens(invalidTokens)

	return response
}

export async function sendNotificationToUser(userId, payload) {
	const tokens = await prisma.deviceToken.findMany({
		where: {
			userId,
			isActive: true,
		},
		select: {
			token: true,
		},
	})

	return sendNotificationToTokens(
		tokens.map((item) => item.token),
		payload,
	)
}
