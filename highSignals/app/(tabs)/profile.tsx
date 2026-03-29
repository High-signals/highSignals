import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'

interface BackendUserData {
  name: string
  profession?: string
  email: string
  avatar?: string
  bio?: string
  twitterId?: string
  facebookId?: string
  linkedInId?: string
  tiktokId?: string
  instagramId?: string
}

export default function ProfileScreen() {
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [userData, setUserData] = useState<BackendUserData>({
    name: '',
    profession: '',
    email: '',
    bio: '',
    avatar: undefined,
    twitterId: '',
    facebookId: '',
    linkedInId: '',
    tiktokId: '',
    instagramId: '',
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile()
    } else {
      setFetching(false)
    }
  }, [isAuthenticated])

  const fetchUserProfile = async () => {
    setFetching(true)
    try {
      const profile = await api.profile.get()
      setUserData({
        name: profile.name || '',
        profession: profile.profession || '',
        email: profile.email || '',
        bio: profile.bio || '',
        avatar: profile.avatar || undefined,
        twitterId: profile.twitterId || '',
        facebookId: profile.facebookId || '',
        linkedInId: profile.linkedInId || '',
        tiktokId: profile.tiktokId || '',
        instagramId: profile.instagramId || '',
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Fall back to user from auth context
      if (user) {
        setUserData({
          name: user.name,
          email: user.email,
          profession: '',
          bio: user.bio || '',
          avatar: user.avatar || undefined,
          twitterId: '',
          facebookId: '',
          linkedInId: '',
          tiktokId: '',
          instagramId: '',
        })
      }
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      // Backend aligned payload
      const payload = {
        name: userData.name,
        profession: userData.profession || null,
        avatar: userData.avatar || null,
        bio: userData.bio || null,
        twitterId: userData.twitterId || null,
        facebookId: userData.facebookId || null,
        linkedInId: userData.linkedInId || null,
        tiktokId: userData.tiktokId || null,
        instagramId: userData.instagramId || null,
      }

      await api.profile.update(payload)

      Alert.alert('Success', 'Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please enable photo library access')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets[0]) {
      setUserData({ ...userData, avatar: result.assets[0].uri })
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => {
            logout()
            router.replace('/')
          },
          style: 'destructive',
        },
      ]
    )
  }

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#d4af37' />
      </View>
    )
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name='person-circle-outline' size={64} color='#d4af37' />
          <Text style={styles.emptyTitle}>Not Logged In</Text>
          <Text style={styles.emptySubtitle}>Please log in to see your profile</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            <Text style={styles.editButton}>{isEditing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.imageWrapper}
            onPress={handleImagePick}
            disabled={!isEditing}
          >
            {userData.avatar ? (
              <Image
                source={{ uri: userData.avatar }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderInitial}>
                  {userData.name.charAt(0)}
                </Text>
              </View>
            )}
            {isEditing && (
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraEmoji}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={userData.name}
                onChangeText={(text) =>
                  setUserData({ ...userData, name: text })
                }
                placeholder='Enter name'
                autoCapitalize='words'
              />
            ) : (
              <Text style={styles.name}>{userData.name}</Text>
            )}
            {isEditing ? (
              <TextInput
                style={styles.professionInput}
                value={userData.profession || ''}
                onChangeText={(text) =>
                  setUserData({ ...userData, profession: text })
                }
                placeholder='Profession'
                autoCapitalize='words'
              />
            ) : (
              <Text style={styles.profession}>
                {userData.profession || 'No profession'}
              </Text>
            )}
            <Text style={styles.email}>{userData.email}</Text>
          </View>
        </View>

        {/* Bio Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bio</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={userData.bio || ''}
              onChangeText={(text) => setUserData({ ...userData, bio: text })}
              multiline
              numberOfLines={3}
              placeholder='Tell us about yourself...'
              placeholderTextColor='#999'
              maxLength={500}
            />
          ) : (
            <Text style={styles.bioText}>{userData.bio || 'No bio yet'}</Text>
          )}
          {!isEditing && userData.bio && (
            <Text style={styles.bioLength}>{userData.bio.length} chars</Text>
          )}
        </View>

        {/* Social Links */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Social Links</Text>
          {[
            'twitterId',
            'facebookId',
            'linkedInId',
            'tiktokId',
            'instagramId',
          ].map((field) => (
            <TextInput
              key={field}
              style={styles.input}
              value={(userData[field as keyof BackendUserData] as string) || ''}
              onChangeText={(text) =>
                setUserData({ ...userData, [field]: text })
              }
              placeholder={field.replace('Id', '')}
              editable={isEditing}
            />
          ))}
        </View>

        {/* Stats Card (UI only) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>28</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>87%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>📝</Text>
              <Text style={styles.menuText}>Edit ICP Profile</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>Notifications</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>🎯</Text>
              <Text style={styles.menuText}>Goals & Reminders</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>❓</Text>
              <Text style={styles.menuText}>Help & Support</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>HighSignals v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backArrow: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d4af37',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0a192f',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a192f',
  },
  cameraEmoji: {
    fontSize: 14,
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  professionInput: {
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  profession: {
    fontSize: 14,
    color: '#d4af37',
    fontWeight: '600',
  },
  emailInput: {
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a192f',
    marginBottom: 16,
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  bioLength: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0a192f',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8E8E8',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#999',
  },
  logoutButton: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 20,
  },
})
