import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import errorHandler from './shared/middleware/error.js'
import authRoutes from './module/auth/auth.route.js'
import icpRoutes from './module/ICP/icp.route.js'
import userProfileRoutes from './module/User profile/userProfile.routes.js'

dotenv.config()

const app = express()

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: 'Too many requests from this IP. Please try again later.',
})

// middleware
app.use(helmet())
app.use(globalLimiter)
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// Routes
app.use('/', (req, res, next) => {
  res.status(200).json({ message: '!Welcome to the High Signals API!' })
})
app.use('/api/auth', authRoutes)
app.use('/api/icp', icpRoutes)
app.use('/api/user', userProfileRoutes)

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`)
// })

export default app
