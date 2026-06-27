import dotenv from 'dotenv'
import AppError from './appError.js'
dotenv.config()

export async function sendVerificationEmail(email, otp) {
	try {
		const response = await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': process.env.BREVO_API_KEY,
			},
			body: JSON.stringify({
				sender: {
					email: process.env.EMAIL_FROM,
					name: 'HighSignals',
				},
				to: [{ email }],
				templateId: Number(process.env.BREVO_TEMPLATE_ID),
				params: {
					OTP_CODE: otp,
				},
			}),
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new AppError(JSON.stringify(errorData), 500)
		}

		return { success: true }
	} catch (error) {
		console.error('Error sending verification email:', error.message)
		return { success: false, error: error.message }
	}
}
