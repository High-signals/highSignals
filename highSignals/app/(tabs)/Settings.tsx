import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItemProps {
  icon: IoniconsName;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function MenuItem({ icon, label, onPress, rightElement }: MenuItemProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconWrap}>
          <Ionicons name={icon} size={18} color={COLORS.gold} />
        </View>
        <Text style={styles.menuText}>{label}</Text>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSubtle} />
      )}
    </Wrapper>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/signup-login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => {}} />
          <MenuItem icon="lock-closed-outline" label="Change Password" onPress={() => {}} />
          <MenuItem
            icon="create-outline"
            label="Edit ICP Profile"
            onPress={() => router.push('/(tabs)/icp-profile' as any)}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <MenuItem
            icon="notifications-outline"
            label="Push Notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#3e3e3e', true: COLORS.gold }}
                thumbColor="#ffffff"
              />
            }
          />
          <MenuItem
            icon="moon-outline"
            label="Dark Mode"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#3e3e3e', true: COLORS.gold }}
                thumbColor="#ffffff"
              />
            }
          />
        </View>

        {/* Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          <MenuItem icon="flag-outline" label="Content Goals" onPress={() => {}} />
          <MenuItem icon="phone-portrait-outline" label="Connected Platforms" onPress={() => {}} />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => {}} />
          <MenuItem icon="chatbubble-outline" label="Send Feedback" onPress={() => {}} />
          <MenuItem icon="shield-outline" label="Privacy Policy" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
        </View>

        {/* Premium */}
        <TouchableOpacity activeOpacity={0.8} style={styles.premiumWrap}>
          <LinearGradient
            colors={[COLORS.surface, COLORS.surfaceLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumCard}
          >
            <View style={styles.premiumIconWrap}>
              <Ionicons name="diamond-outline" size={22} color={COLORS.gold} />
            </View>
            <View style={styles.premiumContent}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumDesc}>Unlock advanced analytics & AI features</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>HighSignals v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Sections
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
    marginBottom: SPACING.md,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACING.sm,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Premium Card
  premiumWrap: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  premiumIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  premiumDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    marginBottom: SPACING.md,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },

  // Version
  versionText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
  },
});
