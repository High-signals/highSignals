import { S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config()

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
	console.warn(
		'[cloudflare] Cloudflare R2 credentials missing - storage uploads will fail until all are set.',
	)
}

export const s3 = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID || 'placeholder',
		secretAccessKey: R2_SECRET_ACCESS_KEY || 'placeholder',
	},
})

export const R2_AVATARS_BUCKET = process.env.R2_BUCKET || 'test-bucket'
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_BASE_URL || 'https://pub-your-r2-dev-url.r2.dev'
