import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  
  const [userData, setUserData] = useState({
    name: 'Melissa Peters',
    email: 'melpeters@gmail.com',
    password: '••••••••••',
    dateOfBirth: '23/05/1995',
    country: 'Nigeria',
    profileImage: null as string | null,
  });

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUserData({...userData, profileImage: result.assets[0].uri});
    }
  };

  const handleSave = () => {
    console.log('Saving profile:', userData);
    // TODO: Save to backend
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Profile Image */}
        <View style={styles.imageSection}>
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={handleImagePick}
          >
            {userData.profileImage ? (
              <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderInitial}>{userData.name[0]}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraEmoji}>📷</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={userData.name}
              onChangeText={(text) => setUserData({...userData, name: text})}
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={userData.email}
              onChangeText={(text) => setUserData({...userData, email: text})}
              keyboardType="email-address"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={userData.password}
              secureTextEntry
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.dropdownText}>{userData.dateOfBirth}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Country/Region */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country/Region</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.dropdownText}>{userData.country}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save changes</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2b4a',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Profile Image
  imageSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  placeholderInitial: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1a2b4a',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a2b4a',
  },
  cameraEmoji: {
    fontSize: 16,
  },

  // Form
  form: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputGroup: {
    // Input container
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dropdownInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 15,
    color: '#ffffff',
  },
  dropdownIcon: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },

  // Save Button
  saveButton: {
    marginHorizontal: 24,
    marginTop: 40,
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});