import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

const TOKEN_KEY = 'auth_access_token'

let authTokens = {
  accessToken: '',
}

export const api = {
  setTokens: async (tokens: { accessToken: string }) => {
    authTokens.accessToken = tokens.accessToken
    try {
      await AsyncStorage.setItem(TOKEN_KEY, tokens.accessToken)
    } catch (e) {
      console.error('Failed to persist token:', e)
    }
  },

  restoreToken: async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY)
      if (token) {
        authTokens.accessToken = token
      }
      return token
    } catch (e) {
      console.error('Failed to restore token:', e)
      return null
    }
  },

  getToken: () => authTokens.accessToken,

  clearTokens: async () => {
    authTokens.accessToken = ''
    try {
      await AsyncStorage.removeItem(TOKEN_KEY)
    } catch (e) {
      console.error('Failed to clear token:', e)
    }
  },

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

  auth: {
    register: async (email: string, password: string, name: string) => {
      const response = await api.call('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }, false)
      if (response.accessToken) {
        await api.setTokens({ accessToken: response.accessToken })
      }
      return response
    },

    login: async (email: string, password: string) => {
      const response = await api.call('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false)
      if (response.accessToken) {
        await api.setTokens({ accessToken: response.accessToken })
      }
      return response
    },

    googleLogin: async (idToken: string) => {
      const response = await api.call('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }, false)
      if (response.accessToken) {
        await api.setTokens({ accessToken: response.accessToken })
      }
      return response
    },
  },

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
