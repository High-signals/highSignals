import React from 'react' // <-- Needed for TS JSX
import { AuthProvider } from '@/context/AuthContext'
import { Slot } from 'expo-router'
import { View } from 'react-native'
import Toast from 'react-native-toast-message'

export default function RootLayout() {
	return (
		<AuthProvider>
			<View style={{ flex: 1, backgroundColor: '#FBF9F5' }}>
				{/* Slot renders the active route based on file structure */}
				<Slot />
			</View>
			<Toast />
		</AuthProvider>
	)
}
