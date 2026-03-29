// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

interface TokenData {
  access_token: string
  user: {
    id: string
    email: string
    name: string
  }
}

// Store tokens (in production, use secure storage)
let authTokens = {
  accessToken: '',
  refreshToken: '',
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
    requiresAuth = true
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
      throw new Error(data.message || 'API Error')
    }

    return data
  },

  // Auth endpoints
  auth: {
    register: async (email: string, password: string, name: string) => {
      const response = await api.call('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }, false)
      return response
    },

    login: async (email: string, password: string) => {
      const response = await api.call('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false)
      if (response.access_token) {
        api.setTokens({ accessToken: response.access_token })
      }
      return response
    },

    googleLogin: async (idToken: string) => {
      const response = await api.call('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }, false)
      if (response.access_token) {
        api.setTokens({ accessToken: response.access_token })
      }
      return response
    },
  },

  // User Profile endpoints
  profile: {
    get: async () => {
      return api.call('/api/user/profile', {
        method: 'GET',
      }, true)
    },

    update: async (profileData: any) => {
      return api.call('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      }, true)
    },

    delete: async () => {
      return api.call('/api/user/profile', {
        method: 'DELETE',
      }, true)
    },
  },

  // ICP endpoints
  icp: {
    create: async (icpData: any) => {
      return api.call('/api/icp', {
        method: 'POST',
        body: JSON.stringify(icpData),
      }, true)
    },

    get: async () => {
      return api.call('/api/icp', {
        method: 'GET',
      }, true)
    },

    update: async (icpData: any) => {
      return api.call('/api/icp/edit', {
        method: 'PUT',
        body: JSON.stringify(icpData),
      }, true)
    },
  },

  // Posts endpoints
  posts: {
    create: async (postData: any) => {
      return api.call('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      }, true)
    },

    getAll: async () => {
      return api.call('/api/posts', {
        method: 'GET',
      }, true)
    },

    getByStatus: async (status: string) => {
      return api.call(`/api/posts/status?status=${status}`, {
        method: 'GET',
      }, true)
    },

    update: async (postId: string, postData: any) => {
      return api.call(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(postData),
      }, true)
    },

    delete: async (postId: string) => {
      return api.call(`/api/posts/${postId}`, {
        method: 'DELETE',
      }, true)
    },
  },
}
