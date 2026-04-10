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
				description: 'Development server',
			},
		],
	},
	apis: ['./src/module/**/*.js'], // 👈 adjust if needed
}

const swaggerSpec = swaggerJsdoc(options)

// export BOTH
export const swaggerUiServe = swaggerUi.serve
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec)
