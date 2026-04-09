import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useAuth } from '@/context/AuthContext'

export default function AuthScreen() {
  const router = useRouter()
  const { googleLogin } = useAuth()
  const [loading, setLoading] = useState(false)

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      // TODO: Implement Google Sign-In SDK
      // For now, show alert
      Alert.alert('Coming Soon', 'Google Sign-In integration coming soon')
      // Once implemented:
      // const idToken = await getGoogleIdToken()
      // await googleLogin(idToken)
      // router.replace('/(tabs)/dashboard')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = () => {
    router.push('/signup-login')
  }

  const handleLogIn = () => {
    router.push({
      pathname: '/signup-login',
      params: { tab: 'login' },
    })
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0a192f' />

      <Animated.View
        style={[
          styles.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Score Gauge Section */}
        <View style={styles.gaugeSection}>
          <View style={styles.gaugeWrapper}>
            {/* Background track */}
            <View style={styles.gaugeTrack} />

            {/* Colored segments - red to green */}
            <View style={[styles.gaugeSegment, styles.gaugeRed]} />
            <View style={[styles.gaugeSegment, styles.gaugeOrange]} />
            <View style={[styles.gaugeSegment, styles.gaugeYellow]} />
            <View style={[styles.gaugeSegment, styles.gaugeGreen]} />

            {/* Score in center */}
            <View style={styles.gaugeCenter}>
              <Text style={styles.gaugeLabel}>CONTENT SCORE</Text>
              <Text style={styles.gaugeScore}>98</Text>
            </View>
          </View>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>
          Publish with{'\n'}
          <Text style={styles.headlineAccent}>Confidence.</Text>
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          The only mobile AI that audits your content before you post.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Continue with Google */}
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.disabledButton]}
            activeOpacity={0.85}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='#fff' size='small' />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Continue with Email */}
          <TouchableOpacity
            style={styles.emailButton}
            activeOpacity={0.85}
            onPress={handleEmailSignUp}
          >
            <Text style={styles.emailIcon}>✉</Text>
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f', // Brand blue background
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  inner: {
    alignItems: 'center',
  },

  // Gauge section
  gaugeSection: {
    marginBottom: 28,
    alignItems: 'center',
  },
  gaugeWrapper: {
    width: 200,
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  gaugeTrack: {
    position: 'absolute',
    width: 200,
    height: 100,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderWidth: 14,
    borderColor: '#152238', // Slightly lighter than brand blue for track
    borderBottomWidth: 0,
    top: 0,
  },
  gaugeSegment: {
    position: 'absolute',
    width: 200,
    height: 100,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderWidth: 14,
    borderBottomWidth: 0,
    top: 0,
  },
  gaugeRed: {
    borderColor: '#FF4444',
    opacity: 0.9,
    transform: [{ rotate: '-90deg' }],
    width: 100,
    left: 0,
    borderTopRightRadius: 0,
    borderRightWidth: 0,
  },
  gaugeOrange: {
    borderColor: '#FF8C00',
    opacity: 0.9,
    width: 100,
    left: 0,
    borderTopRightRadius: 0,
    borderRightWidth: 0,
    transform: [{ rotate: '-45deg' }],
  },
  gaugeYellow: {
    borderColor: '#d4af37', // Brand gold for yellow segment
    opacity: 0.9,
    width: 100,
    right: 0,
    borderTopLeftRadius: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: '45deg' }],
  },
  gaugeGreen: {
    borderColor: '#00C853',
    opacity: 0.9,
    width: 100,
    right: 0,
    borderTopLeftRadius: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: '90deg' }],
  },
  gaugeCenter: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  gaugeLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  gaugeScore: {
    color: '#ffffff', // Brand white
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },

  // Text
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff', // Brand white
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    color: '#d4af37', // Brand gold
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 40,
    paddingHorizontal: 10,
  },

  // Buttons
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  googleButton: {
    backgroundColor: '#ffffff', // Brand white
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  googleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleIconText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  googleButtonText: {
    color: '#0a192f', // Brand blue text
    fontSize: 15,
    fontWeight: '600',
  },
  emailButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)', // Gold border
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emailIcon: {
    color: '#d4af37', // Brand gold
    fontSize: 15,
    marginRight: 10,
  },
  emailButtonText: {
    color: '#ffffff', // Brand white
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Login link
  loginRow: {
    paddingVertical: 8,
  },
  loginText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  loginAccent: {
    color: '#d4af37', // Brand gold
    fontWeight: '600',
  },
})
