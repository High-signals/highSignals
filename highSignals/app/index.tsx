import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { ActivityIndicator, View } from 'react-native'

export default function RootRedirect() {
  const router = useRouter()
  const { isAuthenticated, loading, hasLoggedInBefore } = useAuth()

  useEffect(() => {
    if (loading) return

    // If authenticated, go to dashboard
    if (isAuthenticated) {
      router.replace('/(tabs)/dashboard' as any)
    } else if (hasLoggedInBefore) {
      // Returning user - go straight to login (skip welcome)
      router.replace('/signup-login')
    } else {
      // First-time user - show welcome/get started page
      router.replace('/auth' as any)
    }
  }, [isAuthenticated, loading, hasLoggedInBefore])

  // Show loading while checking auth state
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a192f' }}>
      <ActivityIndicator size="large" color="#d4af37" />
    </View>
  )
}