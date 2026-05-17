import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.warn(
		'[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — storage uploads will fail until both are set.',
	)
}

export const supabase = createClient(
	SUPABASE_URL || 'https://placeholder.supabase.co',
	SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
	{
		auth: { persistSession: false, autoRefreshToken: false },
	},
)

export const AVATARS_BUCKET = process.env.SUPABASE_AVATARS_BUCKET || 'avatars'
