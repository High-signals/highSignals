import React from 'react' // <-- Needed for TS JSX
import { AuthProvider } from '@/context/AuthContext'
import { Slot } from 'expo-router'
import { View } from 'react-native'

export default function RootLayout() {
	return (
		<AuthProvider>
			<View style={{ flex: 1, backgroundColor: '#000' }}>
				{/* Slot renders the active route based on file structure */}
				<Slot />
			</View>
		</AuthProvider>
	)
}
