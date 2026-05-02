import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

export default function TabsLayout() {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    {
      href: '/(tabs)/dashboard',
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
      href: '/(tabs)/posts',
      label: 'Posts',
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

  const isActive = (href: string) => pathname === href

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack screenOptions={{ headerShown: false }} />
      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <TouchableOpacity
              key={tab.href}
              style={styles.tabButton}
              onPress={() => router.push(tab.href as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Ionicons
                  name={(active ? tab.activeIcon : tab.icon) as any}
                  size={22}
                  color={active ? COLORS.gold : COLORS.textSubtle}
                />
              </View>
              <Text style={[styles.tabLabel, active && styles.activeLabel]}>
                {tab.label}
              </Text>
              {active && <View style={styles.activeDot} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.goldBorder,
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    paddingBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xs,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  iconWrapActive: {
    backgroundColor: COLORS.goldMuted,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  activeLabel: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    marginTop: 3,
  },
})
