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
    restoreSession()
  }, [])

  const restoreSession = async () => {
    try {
      const [hasLoggedBefore, savedToken] = await Promise.all([
        AsyncStorage.getItem('hasLoggedInBefore'),
        api.restoreToken(),
      ])

      setHasLoggedInBefore(hasLoggedBefore === 'true')

      if (savedToken) {
        setToken(savedToken)
        try {
          const userData = await api.profile.get()
          setUser(userData)
        } catch {
          // Token is expired or invalid — clear it
          await api.clearTokens()
          setToken(null)
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error)
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

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password)
    setToken(response.accessToken)
    setUser(response.user)
    await markUserAsLoggedIn()
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await api.auth.register(email, password, name)
    setToken(response.accessToken)
    setUser(response.user)
    await markUserAsLoggedIn()
  }

  const googleLogin = async (idToken: string) => {
    const response = await api.auth.googleLogin(idToken)
    setToken(response.accessToken)
    setUser(response.user)
    await markUserAsLoggedIn()
  }

  const logout = async () => {
    await api.clearTokens()
    setToken(null)
    setUser(null)
  }

  const refreshUserData = async () => {
    if (token) {
      try {
        const userData = await api.profile.get()
        setUser(userData)
      } catch {
        await api.clearTokens()
        setToken(null)
        setUser(null)
      }
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
