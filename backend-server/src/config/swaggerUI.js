import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import path from 'path'
import { fileURLToPath } from 'url'

// Fix for ES modules (__dirname not available by default)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'HighSignals API',
			version: '1.0.0',
			description: 'HighSignals API documentation',
		},
		servers: [
			{
				url: 'http://localhost:5000',
				description: 'Local server',
			},
			{
				url: 'https://high-signals.vercel.app',
				description: 'Production server',
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
		// Optional but recommended: apply auth globally
		security: [
			{
				bearerAuth: [],
			},
		],
	},

	apis: [
		path.join(__dirname, '../module/**/*.js'),
		path.join(__dirname, '../module/**/*.route.js'),
		path.join(__dirname, '../module/**/*.routes.js'),
	],
}

const swaggerSpec = swaggerJsdoc(options)

// Optional debug (remove after confirming it works)
console.log('Swagger loaded paths:', options.apis)
console.log('Swagger endpoints:', Object.keys(swaggerSpec.paths || {}))

export const swaggerUiServe = swaggerUi.serve
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec)
export default swaggerSpec
