import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
              style={[styles.tabButton, active && styles.activeTab]}
              onPress={() => router.push(tab.href as any)}
            >
              <Ionicons
                name={(active ? tab.activeIcon : tab.icon) as any}
                size={28}
                color={active ? '#d4af37' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.tabLabel, active && styles.activeLabel]}>
                {tab.label}
              </Text>
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
    backgroundColor: '#0a192f',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0a192f',
    borderTopColor: 'rgba(212,175,55,0.3)',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingBottom: 32,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  activeTab: {},
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  activeLabel: {
    color: '#d4af37',
  },
})
