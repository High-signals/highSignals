export const COLORS = {
  // Base backgrounds
  background: '#FBF9F5',
  surface: '#FFFFFF',
  surfaceCard: '#F5EFE6',
  surfaceLight: '#FAF7F2',
  surfaceHover: '#EDE6DA',
  border: '#EADBCE',
  borderLight: '#EFEAE2',

  // Primary Navy Brand
  navy: '#163354',
  navyLight: '#1D4A79',
  navyDark: '#0F243C',
  navyMuted: 'rgba(22, 51, 84, 0.08)',
  navyBorder: 'rgba(22, 51, 84, 0.15)',

  // Gold / Warm Sand Accents
  gold: '#D4AF37',
  goldLight: '#E8C94A',
  goldMuted: '#F4EFE6',
  goldBorder: '#EADBCE',
  sand: '#EADBCE',
  sandDark: '#D8C8B4',

  // Typography
  text: '#163354',
  textSecondary: '#4A5568',
  textMuted: '#7E8B9B',
  textSubtle: '#A6B4C4',

  // Status Badges & Accents
  ideaBg: '#E0F2FE',
  ideaText: '#0284C7',
  scriptingBg: '#F3E8FF',
  scriptingText: '#7C3AED',
  recordingBg: '#FFE4E6',
  recordingText: '#E11D48',
  editingBg: '#FEF3C7',
  editingText: '#D97706',
  postedBg: '#D1FAE5',
  postedText: '#059669',

  // Destructive / Danger
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',
  dangerText: '#DC2626',

  // Functional
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
}
