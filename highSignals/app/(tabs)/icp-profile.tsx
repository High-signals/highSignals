import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

interface ICPData {
  id: string
  userId: string
  profession: string
  dreamClient: string
  mainProblem: string
  dreamOutcome: string
  authorityStory: string
  clientDemographics: string
  otherDetails?: string
  createdAt: string
  updatedAt: string
}

export default function ICPProfileScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [icp, setIcp] = useState<ICPData | null>(null)
  const [editedIcp, setEditedIcp] = useState<ICPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchICP()
    }
  }, [isAuthenticated])

  const fetchICP = async () => {
    try {
      setLoading(true)
      const icpData = await api.icp.get()
      setIcp(icpData)
      setEditedIcp(icpData)
    } catch (error) {
      console.error('Error fetching ICP:', error)
      Alert.alert('Info', 'No ICP profile found. Create one to get started.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!editedIcp) return

    // Validate required fields
    if (
      !editedIcp.profession ||
      !editedIcp.dreamClient ||
      !editedIcp.mainProblem ||
      !editedIcp.dreamOutcome ||
      !editedIcp.authorityStory ||
      !editedIcp.clientDemographics
    ) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    try {
      setIsSaving(true)
      if (icp) {
        // Update existing ICP
        await api.icp.update({
          profession: editedIcp.profession,
          dreamClient: editedIcp.dreamClient,
          mainProblem: editedIcp.mainProblem,
          dreamOutcome: editedIcp.dreamOutcome,
          authorityStory: editedIcp.authorityStory,
        })
      } else {
        // Create new ICP
        await api.icp.create({
          profession: editedIcp.profession,
          dreamClient: editedIcp.dreamClient,
          mainProblem: editedIcp.mainProblem,
          dreamOutcome: editedIcp.dreamOutcome,
          authorityStory: editedIcp.authorityStory,
          clientDemographics: editedIcp.clientDemographics,
          otherDetails: editedIcp.otherDetails,
        })
      }
      setIcp(editedIcp)
      setIsEditing(false)
      Alert.alert('Success', 'ICP profile updated successfully')
    } catch (error) {
      console.error('Error saving ICP:', error)
      Alert.alert('Error', 'Failed to save ICP profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateNew = () => {
    setEditedIcp({
      id: '',
      userId: '',
      profession: '',
      dreamClient: '',
      mainProblem: '',
      dreamOutcome: '',
      authorityStory: '',
      clientDemographics: '',
      otherDetails: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setIsEditing(true)
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={24} color='#ffffff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ICP Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size='large' color='#d4af37' />
        </View>
      </View>
    )
  }

  const displayIcp = isEditing ? editedIcp : icp
  const hasICP = icp !== null

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (isEditing ? setIsEditing(false) : router.back())}>
          <Ionicons name='arrow-back' size={24} color='#ffffff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit ICP' : 'ICP Profile'}</Text>
        {!isEditing && hasICP && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name='create-outline' size={24} color='#d4af37' />
          </TouchableOpacity>
        )}
        {isEditing && (
          <TouchableOpacity onPress={handleSaveChanges} disabled={isSaving}>
            <Text style={styles.saveButton}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        )}
        {!isEditing && !hasICP && <View style={{ width: 24 }} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!hasICP && !isEditing ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No ICP Profile Yet</Text>
            <Text style={styles.emptySubtext}>
              Create your Ideal Client Profile to help generate better content ideas
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
              <Ionicons name='add-circle-outline' size={20} color='#ffffff' />
              <Text style={styles.createButtonText}>Create ICP Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Section: Professional Background */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Background</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Your Profession</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedIcp?.profession || ''}
                    onChangeText={(text) =>
                      setEditedIcp(editedIcp ? { ...editedIcp, profession: text } : null)
                    }
                    placeholder='e.g., Digital Marketing Expert'
                    placeholderTextColor='rgba(255,255,255,0.3)'
                  />
                ) : (
                  <Text style={styles.value}>{displayIcp?.profession}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Authority Story</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={editedIcp?.authorityStory || ''}
                    onChangeText={(text) =>
                      setEditedIcp(
                        editedIcp ? { ...editedIcp, authorityStory: text } : null
                      )
                    }
                    placeholder='Tell your story of expertise...'
                    placeholderTextColor='rgba(255,255,255,0.3)'
                    multiline
                    numberOfLines={4}
                  />
                ) : (
                  <Text style={styles.value}>{displayIcp?.authorityStory}</Text>
                )}
              </View>
            </View>

            {/* Section: Ideal Client Profile */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ideal Client Profile</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Dream Client Description</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={editedIcp?.dreamClient || ''}
                    onChangeText={(text) =>
                      setEditedIcp(editedIcp ? { ...editedIcp, dreamClient: text } : null)
                    }
                    placeholder='Describe your ideal client...'
                    placeholderTextColor='rgba(255,255,255,0.3)'
                    multiline
                    numberOfLines={4}
                  />
                ) : (
                  <Text style={styles.value}>{displayIcp?.dreamClient}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Client Demographics</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={editedIcp?.clientDemographics || ''}
                    onChangeText={(text) =>
                      setEditedIcp(
                        editedIcp ? { ...editedIcp, clientDemographics: text } : null
                      )
                    }
                    placeholder='Age, location, industry, etc...'
                    placeholderTextColor='rgba(255,255,255,0.3)'
                    multiline
                    numberOfLines={4}
                  />
                ) : (
                  <Text style={styles.value}>{displayIcp?.clientDemographics}</Text>
                )}
              </View>
            </View>

            {/* Section: Problems & Solutions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Problems & Solutions</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Main Problem They Face</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={editedIcp?.mainProblem || ''}
                    onChangeText={(text) =>
                      setEditedIcp(editedIcp ? { ...editedIcp, mainProblem: text } : null)
                    }
                    placeholder='What problem are you solving?'
                    placeholderTextColor='rgba(255,255,255,0.3)'
                    multiline
                    numberOfLines={4}
                  />
                ) : (
                  <Text style={styles.value}>{displayIcp?.mainProblem}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Dream Outcome</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={editedIcp?.dreamOutcome || ''}
                    onChangeText={(text) =>
                      setEditedIcp(editedIcp ? { ...editedIcp, dreamOutcome: text } : null)
                    }
                    placeholder='What result do they want?'
                    placeholderTextColor='rgba(255,255,255,0.3)'
                    multiline
                    numberOfLines={4}
                  />
                ) : (
                  <Text style={styles.value}>{displayIcp?.dreamOutcome}</Text>
                )}
              </View>
            </View>

            {/* Section: Additional Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Details</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Other Details (Optional)</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={editedIcp?.otherDetails || ''}
                    onChangeText={(text) =>
                      setEditedIcp(
                        editedIcp ? { ...editedIcp, otherDetails: text } : null
                      )
                    }
                    placeholder='Any other relevant information...'
                    placeholderTextColor='rgba(255,255,255,0.3)'
                    multiline
                    numberOfLines={3}
                  />
                ) : (
                  displayIcp?.otherDetails && (
                    <Text style={styles.value}>{displayIcp.otherDetails}</Text>
                  )
                )}
              </View>
            </View>

            {/* Metadata */}
            {hasICP && !isEditing && (
              <View style={styles.metadata}>
                <Text style={styles.metaText}>
                  Created: {new Date(displayIcp!.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.metaText}>
                  Updated: {new Date(displayIcp!.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d4af37',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: '80%',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#d4af37',
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a192f',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d4af37',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  value: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  metadata: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.2)',
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
})
