import AsyncStorage from '@react-native-async-storage/async-storage'

// API Configuration
// NOTE: the realtime voice feature needs a persistent host (WebSocket + Google
// streaming), which Vercel serverless cannot provide. Point EXPO_PUBLIC_API_URL
// at the new persistent backend (Render/Railway/VPS). The old Vercel URL only
// remains as a last-resort fallback for the plain REST endpoints.
const API_BASE_URL =
	process.env.EXPO_PUBLIC_API_URL ||
	process.env.REACT_APP_API_URL ||
	'https://scripnals.onrender.com'

/** The resolved REST base URL (host), exported for non-`call` fetches. */
export const apiBaseUrl = API_BASE_URL

/**
 * WebSocket URL for the realtime transcription stream. Derived from the API
 * host (http→ws, https→wss) unless EXPO_PUBLIC_WS_URL is set explicitly.
 */
export function getWsUrl(path = '/ws/transcribe'): string {
	const explicit = process.env.EXPO_PUBLIC_WS_URL
	const base = explicit || API_BASE_URL.replace(/^http/, 'ws')
	return `${base.replace(/\/$/, '')}${path}`
}

// Store tokens (in production, use secure storage)
let authTokens = {
	accessToken: '',
	refreshToken: '',
}

// Tiny pub/sub so list screens can react when posts change anywhere
// in the app (create / edit / delete), without each screen having to
// know about the others.
type PostsChangeListener = () => void
const postsChangeListeners = new Set<PostsChangeListener>()

export const postsEvents = {
	onChange(listener: PostsChangeListener) {
		postsChangeListeners.add(listener)
		return () => {
			postsChangeListeners.delete(listener)
		}
	},
	emit() {
		postsChangeListeners.forEach((listener) => {
			try {
				listener()
			} catch (err) {
				console.error('postsEvents listener failed', err)
			}
		})
	},
}

// API methods
export const api = {
	setTokens: (tokens: { accessToken: string; refreshToken?: string }) => {
		authTokens.accessToken = tokens.accessToken
		if (tokens.refreshToken) {
			authTokens.refreshToken = tokens.refreshToken
		}
	},

	getToken: () => authTokens.accessToken,

	clearTokens: () => {
		authTokens.accessToken = ''
		authTokens.refreshToken = ''
	},

	// Helper for API calls
	call: async (
		endpoint: string,
		options: RequestInit = {},
		requiresAuth = true,
	) => {
		const url = `${API_BASE_URL}${endpoint}`
		const method = options.method || 'GET'
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...options.headers,
		} as Record<string, string>

		if (requiresAuth && authTokens.accessToken) {
			headers.Authorization = `Bearer ${authTokens.accessToken}`
		}

		const config: RequestInit = {
			method,
			headers,
			...options,
		}

		try {
			const response = await fetch(url, config)

			if (!response.ok) {
				let errorMessage = 'An error occurred'
				try {
					const textData = await response.text()
					try {
						const errorData = JSON.parse(textData)
						errorMessage = errorData.message || errorMessage
					} catch (e) {
						errorMessage = textData || errorMessage
					}
				} catch (e) {
					// Fallback
				}
				throw new Error(errorMessage)
			}

			const data = await response.json()

			// Cache successful GET requests for offline support
			if (method === 'GET' && requiresAuth) {
				try {
					await AsyncStorage.setItem(`cache_${endpoint}`, JSON.stringify(data))
				} catch (err) {
					console.warn('Cache write failed:', err)
				}
			}

			return data
		} catch (error: any) {
			// If network fails, try to return cached data for GET requests
			if (method === 'GET' && requiresAuth) {
				try {
					const cachedData = await AsyncStorage.getItem(`cache_${endpoint}`)
					if (cachedData) {
						console.log(`Serving cached data for ${endpoint}`)
						return JSON.parse(cachedData)
					}
				} catch (err) {
					console.warn('Cache read failed:', err)
				}
			}
			throw error
		}
	},

	// Auth endpoints
	auth: {
		register: async (email: string, password: string, name: string) => {
			const response = await api.call(
				'/api/auth/register',
				{
					method: 'POST',
					body: JSON.stringify({ email, password, name }),
				},
				false,
			)
			if (response.accessToken) {
				api.setTokens({ accessToken: response.accessToken })
			}
			return response
		},

		login: async (email: string, password: string) => {
			const response = await api.call(
				'/api/auth/login',
				{
					method: 'POST',
					body: JSON.stringify({ email, password }),
				},
				false,
			)
			if (response.accessToken) {
				api.setTokens({ accessToken: response.accessToken })
			}
			return response
		},

		googleLogin: async (idToken: string) => {
			const response = await api.call(
				'/api/auth/google',
				{
					method: 'POST',
					body: JSON.stringify({ idToken }),
				},
				false,
			)
			if (response.accessToken) {
				api.setTokens({ accessToken: response.accessToken })
			}
			return response
		},
	},

	// User Profile endpoints
	profile: {
		get: async () => {
			return api.call(
				'/api/user/profile',
				{
					method: 'GET',
				},
				true,
			)
		},

		update: async (profileData: any) => {
			return api.call(
				'/api/user/profile',
				{
					method: 'PATCH',
					body: JSON.stringify(profileData),
				},
				true,
			)
		},

		delete: async () => {
			return api.call(
				'/api/user/profile',
				{
					method: 'DELETE',
				},
				true,
			)
		},

		uploadAvatar: async (asset: {
			uri: string
			mimeType?: string | null
			fileName?: string | null
		}) => {
			const mime =
				asset.mimeType ||
				(asset.uri.toLowerCase().endsWith('.png')
					? 'image/png'
					: asset.uri.toLowerCase().endsWith('.webp')
						? 'image/webp'
						: 'image/jpeg')
			const ext = mime.split('/')[1] || 'jpg'
			const name = asset.fileName || `avatar.${ext}`

			const form = new FormData()
			// React Native's FormData accepts { uri, name, type } shape
			form.append('file', {
				uri: asset.uri,
				name,
				type: mime,
			} as any)

			const headers: Record<string, string> = {}
			if (authTokens.accessToken) {
				headers.Authorization = `Bearer ${authTokens.accessToken}`
			}

			const response = await fetch(`${API_BASE_URL}/api/user/avatar`, {
				method: 'POST',
				headers,
				body: form,
			})
			const data = await response.json()
			if (!response.ok) {
				const err: Error & { status?: number } = new Error(
					data.message || 'Avatar upload failed',
				)
				err.status = response.status
				throw err
			}
			return data
		},

		deleteAvatar: async () => {
			return api.call(
				'/api/user/avatar',
				{ method: 'DELETE' },
				true,
			)
		},

		submitFeedback: async (feedbackData: { name: string; email: string; feedback: string }) => {
			return api.call(
				'/api/user/feedback',
				{
					method: 'POST',
					body: JSON.stringify(feedbackData),
				},
				true,
			)
		},
	},

	// ICP endpoints
	icp: {
		create: async (icpData: any) => {
			return api.call(
				'/api/icp',
				{
					method: 'POST',
					body: JSON.stringify(icpData),
				},
				true,
			)
		},

		get: async () => {
			return api.call(
				'/api/icp',
				{
					method: 'GET',
				},
				true,
			)
		},

		update: async (icpData: any) => {
			return api.call(
				'/api/icp/edit',
				{
					method: 'PUT',
					body: JSON.stringify(icpData),
				},
				true,
			)
		},
	},

	// Posts endpoints
	posts: {
		create: async (postData: any) => {
			const response = await api.call(
				'/api/post',
				{
					method: 'POST',
					body: JSON.stringify(postData),
				},
				true,
			)
			postsEvents.emit()
			return response
		},

		getAll: async (queryParams?: {
			page?: number
			limit?: number
			search?: string
			status?: string
			sort?: string
		}) => {
			// Build query string if params provided
			let endpoint = '/api/post'
			if (queryParams) {
				const params = new URLSearchParams()
				if (queryParams.page)
					params.append('page', String(queryParams.page))
				if (queryParams.limit)
					params.append('limit', String(queryParams.limit))
				if (queryParams.search)
					params.append('search', queryParams.search)
				if (queryParams.status)
					params.append('status', queryParams.status)
				if (queryParams.sort)
					params.append('sort', queryParams.sort)

				const queryString = params.toString()
				if (queryString) {
					endpoint += `?${queryString}`
				}
			}

			const response = await api.call(
				endpoint,
				{
					method: 'GET',
				},
				true,
			)
			return response.posts ?? response
		},

		getByStatus: async (status: string) => {
			const posts = await api.posts.getAll({ status })
			return Array.isArray(posts) ? posts : []
		},

		update: async (postId: string, postData: any) => {
			const response = await api.call(
				`/api/post/${postId}`,
				{
					method: 'PUT',
					body: JSON.stringify(postData),
				},
				true,
			)
			postsEvents.emit()
			return response
		},

		delete: async (postId: string) => {
			const response = await api.call(
				`/api/post/${postId}`,
				{
					method: 'DELETE',
				},
				true,
			)
			postsEvents.emit()
			return response
		},
	},
}

export type PostStatus =
	| 'IDEA'
	| 'SCRIPTING'
	| 'RECORDING'
	| 'EDITING'
	| 'POSTED'
	| 'DRAFT'
	| 'SCHEDULED'
	| 'PUBLISHED'
	| 'FAILED'

