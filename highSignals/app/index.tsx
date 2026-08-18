import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native'

export default function RootRedirect() {
	const router = useRouter()
	const { isAuthenticated, loading, hasLoggedInBefore } = useAuth()

	useEffect(() => {
		if (loading) return

		// If authenticated, go to dashboard
		if (isAuthenticated) {
			router.replace('/dashboard-new')
		} else if (hasLoggedInBefore) {
			// Returning user - go straight to login (skip welcome)
			router.replace('/signup-login')
		} else {
			// First-time user - show welcome/get started page
			router.replace('/auth')
		}
	}, [isAuthenticated, loading, hasLoggedInBefore])

	// Show logo/loading while checking auth state (Screen 1 of design)
	return (
		<View style={styles.container}>
			<Image
				source={require('@/assets/images/logo.png')}
				style={styles.logo}
				resizeMode='contain'
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FBF9F5',
	},
	logo: {
		width: 100,
		height: 100,
	},
})
