import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'

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
	},
	apis: ['./src/module/**/*.route.js', './src/module/**/*.routes.js'], // Path to the API route files
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
			},
		},
	},
}

const swaggerSpec = swaggerJsdoc(options)

// export BOTH
export const swaggerUiServe = swaggerUi.serve
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec)
