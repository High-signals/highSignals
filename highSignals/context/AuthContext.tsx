import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '@/services/api'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  bio?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  hasLoggedInBefore: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  googleLogin: (idToken: string) => Promise<void>
  logout: () => void
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false)

  useEffect(() => {
    checkFirstTimeUser()
  }, [])

  const checkFirstTimeUser = async () => {
    try {
      const hasLoggedBefore = await AsyncStorage.getItem('hasLoggedInBefore')
      setHasLoggedInBefore(hasLoggedBefore === 'true')
    } catch (error) {
      console.error('Error checking first time user:', error)
    } finally {
      setLoading(false)
    }
  }

  const markUserAsLoggedIn = async () => {
    try {
      await AsyncStorage.setItem('hasLoggedInBefore', 'true')
      setHasLoggedInBefore(true)
    } catch (error) {
      console.error('Error marking user as logged in:', error)
    }
  }

  const fetchUserData = async () => {
    try {
      const response = await api.profile.get()
      setUser(response)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      api.clearTokens()
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await api.auth.login(email, password)
      api.setTokens({ accessToken: response.access_token })
      setToken(response.access_token)
      setUser(response.user)
      await markUserAsLoggedIn()
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const response = await api.auth.register(email, password, name)
      api.setTokens({ accessToken: response.access_token })
      setToken(response.access_token)
      setUser(response.user)
      await markUserAsLoggedIn()
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async (idToken: string) => {
    setLoading(true)
    try {
      const response = await api.auth.googleLogin(idToken)
      api.setTokens({ accessToken: response.access_token })
      setToken(response.access_token)
      setUser(response.user)
      await markUserAsLoggedIn()
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    api.clearTokens()
    setToken(null)
    setUser(null)
  }

  const refreshUserData = async () => {
    if (token) {
      await fetchUserData()
    }
  }

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    hasLoggedInBefore,
    login,
    register,
    googleLogin,
    logout,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
