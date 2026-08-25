import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/context/ThemeContext'

export default function TabsLayout() {
	const { colors, theme } = useTheme();
	const styles = React.useMemo(() => getStyles(colors), [colors]);
	const pathname = usePathname()
	const router = useRouter()

	const NAV_HEIGHT = 85 // 👈 controls spacing for navbar
	const hideNavOnPaths = [
		'/create-post',
		'/(tabs)/create-post',
		'/post-detail',
		'/(tabs)/post-detail',
	]
	const showNav = !hideNavOnPaths.includes(pathname)

	const tabs = [
		{
			href: '/(tabs)/dashboard-new',
			label: 'Dashboard',
			icon: 'home-outline',
			activeIcon: 'home',
		},
		{
			href: '/(tabs)/create-post',
			label: 'Create',
			icon: 'add-circle-outline',
			activeIcon: 'add-circle',
		},
		{
			href: '/(tabs)/GetContent',
			label: 'Content',
			icon: 'document-text-outline',
			activeIcon: 'document-text',
		},
		{
			href: '/(tabs)/profile',
			label: 'Profile',
			icon: 'person-outline',
			activeIcon: 'person',
		},
	]

	const isActive = (href: string) => pathname === href || pathname === href.replace('/(tabs)', '')

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			{/* MAIN CONTENT AREA */}
			<View style={{ flex: 1, paddingBottom: showNav ? NAV_HEIGHT : 0 }}>
				<Stack screenOptions={{ headerShown: false }} />
			</View>

			{/* BOTTOM NAVBAR */}
			{showNav && (
			<View style={[styles.bottomNav, { height: NAV_HEIGHT }]}>
				{tabs.map((tab) => {
					const active = isActive(tab.href)

					return (
						<TouchableOpacity
							key={tab.href}
							style={[
								styles.tabButton,
								active && styles.activeTab,
							]}
							onPress={() => router.push(tab.href as any)}
						>
							<Ionicons
								name={(active ? tab.activeIcon : tab.icon) as any}
								size={24}
								color={
									colors.primaryIcon
								}
							/>
							<Text
								style={[
									styles.tabLabel,
									active && styles.activeLabel,
								]}
							>
								{tab.label}
							</Text>
						</TouchableOpacity>
					)
				})}
			</View>
			)}
		</SafeAreaView>
	)
}

const getStyles = (colors: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},

	bottomNav: {
		flexDirection: 'row',
		backgroundColor: colors.surface,
		borderTopColor: colors.border,
		borderTopWidth: 1,
		paddingVertical: 10,
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		shadowColor: colors.text,
		shadowOffset: {
			width: 0,
			height: -3,
		},
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 8,
	},

	tabButton: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 4,
	},

	activeTab: {},

	tabLabel: {
		fontSize: 11,
		fontWeight: '600',
		color: colors.textMuted,
		marginTop: 4,
	},

	activeLabel: {
		color: colors.primaryIcon,
		fontWeight: '700',
	},
})
