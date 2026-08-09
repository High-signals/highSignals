import dotenv from 'dotenv'
import AppError from './appError.js'
dotenv.config()

export async function sendFeedbackEmail(name, email, feedback) {
	try {
		const response = await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': process.env.BREVO_API_KEY,
			},
			body: JSON.stringify({
				sender: {
					email: process.env.EMAIL_FROM || 'noreply@scripnals.com',
					name: 'Scripnals App',
				},
				to: [{ email: 'repzysam@gmail.com' }],
				subject: `Scripnals Feedback from ${name}`,
				htmlContent: `
					<h2>New Feedback Received</h2>
					<p><strong>Name:</strong> ${name}</p>
					<p><strong>Email:</strong> ${email}</p>
					<p><strong>Feedback:</strong></p>
					<p>${feedback}</p>
				`,
			}),
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new AppError(JSON.stringify(errorData), 500)
		}

		return { success: true }
	} catch (error) {
		console.error('Error sending feedback email:', error.message)
		return { success: false, error: error.message }
	}
}
