import React from 'react' // <-- Needed for TS JSX
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { Slot } from 'expo-router'
import { View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'

function RootLayoutContent() {
  const { colors, theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Slot />
    </View>
  )
}

export default function RootLayout() {
	return (
    <ThemeProvider>
		  <AuthProvider>
        <RootLayoutContent />
			  <Toast />
		  </AuthProvider>
    </ThemeProvider>
	)
}
