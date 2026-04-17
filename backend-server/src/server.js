import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { swaggerUiServe, swaggerUiSetup } from './config/swaggerUI.js'
import errorHandler from './shared/middleware/error.js'
import authRoutes from './module/auth/auth.route.js'
import icpRoutes from './module/ICP/icp.route.js'
import userProfileRoutes from './module/User profile/userProfile.routes.js'

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

	// 🔥 Fix for proxy environments
	keyGenerator: (req) => {
		return req.ip
	},
})

// middleware
app.use(helmet())
app.use(globalLimiter)
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// Routes
app.get('/docs.json', (req, res) => {
	res.json(swaggerUiSetup)
})

app.get('/docs', (req, res) => {
	res.send(`
	<!DOCTYPE html>
	<html>
	<head>
		<title>Swagger UI</title>
		<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
	</head>
	<body>
		<div id="swagger-ui"></div>

		<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
		<script>
			window.onload = () => {
				SwaggerUIBundle({
					url: '/docs.json',
					dom_id: '#swagger-ui',
				});
			};
		</script>
	</body>
	</html>
	`)
})

// app.use('/api/docs', swaggerUiServe, swaggerUiSetup)
app.use('/api/auth', authRoutes)
app.use('/api/icp', icpRoutes)
app.use('/api/user', userProfileRoutes)

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

// app.listen(PORT, '0.0.0.0', () => {
// 	console.log(`Server running on port ${PORT}`)
// })

export default app
