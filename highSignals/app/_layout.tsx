import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0a192f' },
          }}
        >
          <Stack.Screen
            name='index'
            options={{
              title: 'Welcome',
            }}
          />
          <Stack.Screen
            name='auth'
            options={{
              title: 'Login',
            }}
          />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  )
}
