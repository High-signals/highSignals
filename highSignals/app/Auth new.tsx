import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

type AuthMode = 'login' | 'signup' | 'otp';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [otp, setOtp] = useState(['', '', '', '']);

  const handleLogin = () => {
    console.log('Logging in:', formData);
    // Show OTP screen
    setMode('otp');
  };

  const handleSignup = () => {
    console.log('Signing up:', formData);
    // Show OTP screen
    setMode('otp');
  };

  const handleOTPVerify = () => {
    console.log('OTP:', otp.join(''));
    // Navigate to onboarding
    router.replace('/onboarding');
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
    }
  };

  if (mode === 'otp') {
    return (
      <View style={styles.container}>
        <View style={styles.otpContainer}>
          {/* Logo */}
          <View style={styles.logo}>
            <Text style={styles.logoText}>⚡</Text>
          </View>

          <Text style={styles.otpTitle}>Enter OTP</Text>
          <Text style={styles.otpSubtitle}>
            OTP sent to your email address{'\n'}
            {formData.email} Enter the code to proceed
          </Text>

          {/* OTP Input */}
          <View style={styles.otpInputContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOTPChange(index, value)}
                keyboardType="number-pad"
                maxLength={1}
              />
            ))}
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleOTPVerify}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textButton}>
            <Text style={styles.textButtonLabel}>Don't receive the OTP? Resend OTP</Text>
          </TouchableOpacity>

          {/* Number Pad */}
          <View style={styles.numberPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '←', 0].map((num) => (
              <TouchableOpacity key={num} style={styles.numberButton}>
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>⚡</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {mode === 'login' ? 'Log In' : 'Create Account'}
        </Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
            secureTextEntry
          />
          <TouchableOpacity style={styles.eyeIcon}>
            <Text style={styles.eyeIconText}>👁️</Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Password (Signup only) */}
        {mode === 'signup' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
              secureTextEntry
            />
            <TouchableOpacity style={styles.eyeIcon}>
              <Text style={styles.eyeIconText}>👁️</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Remember Me / Terms */}
        <View style={styles.checkboxRow}>
          {mode === 'login' ? (
            <>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkboxBox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remember Me</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.linkText}>Forgotten Password?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View style={[styles.checkboxBox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>I agree to the Terms of Service</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Primary Button */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={mode === 'login' ? handleLogin : handleSignup}
        >
          <Text style={styles.primaryButtonText}>
            {mode === 'login' ? 'Sign In' : 'Log In'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or {mode === 'login' ? 'Login' : 'Create'} with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Buttons */}
        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialText}>Log in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialIcon}>f</Text>
          <Text style={styles.socialText}>Log in with Facebook</Text>
        </TouchableOpacity>

        {/* Toggle Mode */}
        <TouchableOpacity 
          style={styles.toggleMode}
          onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          <Text style={styles.toggleText}>
            {mode === 'login' 
              ? "Don't have an account? Create Account"
              : "Not your first login? Sign in"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
  },

  // Logo
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
  },

  // Input
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: '#ffffff',
  },
  eyeIcon: {
    padding: 8,
  },
  eyeIconText: {
    fontSize: 18,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  checkmark: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  checkboxLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  linkText: {
    fontSize: 13,
    color: '#00D9FF',
    fontWeight: '600',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#00D9FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: 12,
  },

  // Social
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 12,
    color: '#ffffff',
  },
  socialText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Toggle
  toggleMode: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  // OTP
  otpContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  otpSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  otpInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: '#00D9FF',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  textButton: {
    marginTop: 16,
  },
  textButtonLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  // Number Pad
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    marginTop: 40,
    gap: 16,
  },
  numberButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
});