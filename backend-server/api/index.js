import app from '../src/server.js'
import swaggerSpec from '../src/config/swaggerUI.js'

export default function handler(req, res) {
	const url = req.url

	// 🔥 HANDLE DOCS HERE (before Express)
	if (url === '/api/docs.json') {
		res.setHeader('Content-Type', 'application/json')
		return res.status(200).json(swaggerSpec)
	}

	return app(req, res)
}
