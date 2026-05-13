// API Configuration
const API_BASE_URL =
	process.env.EXPO_PUBLIC_API_URL ||
	process.env.REACT_APP_API_URL ||
	'https://high-signals.vercel.app'

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
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...options.headers,
		} as Record<string, string>

		if (requiresAuth && authTokens.accessToken) {
			headers.Authorization = `Bearer ${authTokens.accessToken}`
		}

		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			...options,
			headers,
		})

		const data = await response.json()

		if (!response.ok) {
			const err: Error & { status?: number } = new Error(
				data.message || 'API Error',
			)
			err.status = response.status
			throw err
		}

		return data
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
