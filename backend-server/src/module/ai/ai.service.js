import { GoogleGenerativeAI } from '@google/generative-ai'
import { VertexAI } from '@google-cloud/vertexai'
import prisma from '../../config/db.js'
import AppError from '../../shared/service/appError.js'

let geminiModel = null

function getAIModel() {
	if (geminiModel) return geminiModel

	const apiKey = process.env.GEMINI_API_KEY
	const vertexProjectId = process.env.VERTEX_PROJECT_ID
	const vertexLocation = process.env.VERTEX_LOCATION || 'us-central1'

	// Fallback to gemini-3.0-flash (current generation in 2026)
	const modelName = process.env.GEMINI_MODEL || 'gemini-3.0-flash'

	if (apiKey) {
		const genAI = new GoogleGenerativeAI(apiKey)
		geminiModel = genAI.getGenerativeModel({ model: modelName })
	} else if (vertexProjectId) {
		const vertexAI = new VertexAI({
			project: vertexProjectId,
			location: vertexLocation,
		})
		geminiModel = vertexAI.getGenerativeModel({ model: modelName })
	} else {
		throw new AppError('AI configuration missing in environment', 500)
	}
	return geminiModel
}

export async function analyzePostService(
	userId,
	postId,
	content,
	contentType,
	icpProfile,
	title,
) {
	if (!postId || !content) {
		throw new AppError('Post ID and content are required', 400)
	}

	// 1. Check if feedback already exists for this exact post
	const existingFeedback = await prisma.aiAnalysisFeedback.findUnique({
		where: { userId_postId: { userId, postId } },
	})

	if (existingFeedback) {
		return existingFeedback
	}

	const model = getAIModel()

	// 2. Call AI
	const prompt = `Act as an expert content strategist. Analyze the following post content against the latest trends and popular topics and contents using short video content principles.
    Title: ${title || 'N/A'}
    Content Type: ${contentType || 'Idea'}
    ICP Profile: ${icpProfile ? JSON.stringify(icpProfile) : 'N/A'}
    Content: ${content}
    
    Return a strictly valid JSON object with EXACTLY this structure and insights should be concise and actionable. Do not include any other text or explanation outside of the JSON object.:
    {
       "score": <number between 0-100 based on virality and quality>,
       "insights": ["insight 1", "insight 2", "insight 3"]
    }`

	const result = await model.generateContent(prompt)
	let text = result.response.text()

	// clean up potential markdown code blocks returned by AI
	text = text
		.replace(/```json/gi, '')
		.replace(/```/g, '')
		.trim()

	let parsed
	try {
		parsed = JSON.parse(text)
	} catch (e) {
		throw new AppError('Failed to parse AI response', 500)
	}

	// 3. Save to database
	const feedback = await prisma.aiAnalysisFeedback.create({
		data: {
			userId,
			postId,
			score: parsed.score || 0,
			insights: parsed.insights || [],
		},
	})

	return feedback
}

export async function revampPostService(
	userId,
	postId,
	content,
	contentType,
	icpProfile,
	title,
) {
	if (!postId || !content) {
		throw new AppError('Post ID and content are required', 400)
	}

	// 1. Check usage limits
	const user = await prisma.user.findUnique({ where: { id: userId } })
	if (!user) throw new AppError('User not found', 404)

	const today = new Date()
	today.setHours(0, 0, 0, 0)

	let currentUsage = user.aiUsage
	let lastUsageDate = user.lastAiUsageDate

	if (!lastUsageDate || lastUsageDate < today) {
		// Reset to 10 for a new day
		currentUsage = 10
	}

	if (currentUsage <= 0) {
		const midnight = new Date(today)
		midnight.setDate(midnight.getDate() + 1)
		const msLeft = midnight.getTime() - new Date().getTime()
		const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60))
		const minsLeft = Math.floor(
			(msLeft % (1000 * 60 * 60)) / (1000 * 60),
		)

		throw new AppError(
			`You've exceeded your daily limit, try in ${hoursLeft}h ${minsLeft}m`,
			429,
		)
	}

	const model = getAIModel()

	const prompt = `Act as an expert content strategist. Revamp the following post content to make it highly engaging and optimized for the target audience.
    Title: ${title || 'N/A'}
    Content Type: ${contentType || 'Idea'}
    ICP Profile: ${icpProfile ? JSON.stringify(icpProfile) : 'N/A'}
    Original Content: ${content}
    
    Return ONLY the revamped text in Markdown format. Do not include introductory conversational text.`

	const result = await model.generateContent(prompt)
	const revampedText = result.response.text()

	// 2. Deduct usage
	await prisma.user.update({
		where: { id: userId },
		data: {
			aiUsage: currentUsage - 1,
			lastAiUsageDate: new Date(),
		},
	})

	return {
		revampedContent: revampedText,
		creditsRemaining: currentUsage - 1,
	}
}
