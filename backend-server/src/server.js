import express from 'express'
import cors from 'cors'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { swaggerUiServe, swaggerUiSetup } from './config/swaggerUI.js'
import errorHandler from './shared/middleware/error.js'
import authRoutes from './module/auth/auth.route.js'
import icpRoutes from './module/ICP/icp.route.js'
import userProfileRoutes from './module/User profile/userProfile.routes.js'
import postRouter from './module/Post/post.route.js'

dotenv.config()

const app = express()
app.set('trust proxy', 1)

// Global rate limiter
const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	message: 'Too many requests from this IP. Please try again later.',
	standardHeaders: true,
	legacyHeaders: false,

	// ✅ FIXED (IPv6 safe)
	keyGenerator: (req) => ipKeyGenerator(req),
})

// middleware
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
				styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
				connectSrc: ["'self'", 'https://unpkg.com'],
				imgSrc: ["'self'", 'data:'],
			},
		},
	}),
)
app.use(globalLimiter)
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// Routes

app.get('/docs', (req, res) => {
	// 🔥 FORCE override CSP for this route only
	res.setHeader(
		'Content-Security-Policy',
		"default-src * 'unsafe-inline' 'unsafe-eval' data: blob: https:;",
	)

	res.send(`
	<!DOCTYPE html>
	<html>
	<head>
		<title>Swagger Docs</title>
		<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
	</head>
	<body>
		<div id="swagger-ui"></div>

		<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
		<script>
			window.onload = () => {
				SwaggerUIBundle({
					url: '/api/docs.json',
					dom_id: '#swagger-ui'
				})
			}
		</script>
	</body>
	</html>
	`)
})

// app.use('/api/docs', swaggerUiServe, swaggerUiSetup)
app.use('/api/auth', authRoutes)
app.use('/api/icp', icpRoutes)
app.use('/api/user', userProfileRoutes)
app.use('/api/post', postRouter)

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running on port ${PORT}`)
})

export default app
