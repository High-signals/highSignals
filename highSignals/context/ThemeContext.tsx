import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LIGHT_COLORS = {
  background: '#FBF9F5',
  surface: '#FFFFFF',
  surfaceCard: '#F5EFE6',
  surfaceLight: '#FAF7F2',
  surfaceHover: '#EDE6DA',
  border: '#EADBCE',
  borderLight: '#EFEAE2',

  navy: '#163354',
  navyLight: '#1D4A79',
  primaryIcon: '#1D4A79',
  primaryAction: '#1D4A79',
  primaryActionText: '#FFFFFF',
  navyDark: '#0F243C',
  navyMuted: 'rgba(22, 51, 84, 0.08)',
  navyBorder: 'rgba(22, 51, 84, 0.15)',

  gold: '#D4AF37',
  goldLight: '#E8C94A',
  goldMuted: '#F4EFE6',
  goldBorder: '#EADBCE',
  sand: '#EADBCE',
  sandDark: '#D8C8B4',

  text: '#163354',
  textSecondary: '#4A5568',
  textMuted: '#7E8B9B',
  textSubtle: '#A6B4C4',

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

  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',
  dangerText: '#DC2626',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const DARK_COLORS = {
  background: '#0B1221',
  surface: '#151F32',
  surfaceCard: '#151F32',
  surfaceLight: '#1B263B',
  surfaceHover: '#25334D',
  border: '#25334D',
  borderLight: '#1E293B',

  navy: '#0B1221',
  navyLight: '#1B263B',
  primaryIcon: '#EBB305',
  primaryAction: '#EBB305',
  primaryActionText: '#000000',
  navyDark: '#050A14',
  navyMuted: 'rgba(27, 38, 59, 0.3)',
  navyBorder: '#25334D',

  gold: '#EBB305',
  goldLight: '#FCE089',
  goldMuted: 'rgba(235, 179, 5, 0.15)',
  goldBorder: 'rgba(235, 179, 5, 0.3)',
  sand: '#FCE089',
  sandDark: '#EBB305',

  text: '#FFFFFF',
  textSecondary: '#A0ABC0',
  textMuted: '#718096',
  textSubtle: '#4A5568',

  ideaBg: 'rgba(2, 132, 199, 0.2)',
  ideaText: '#38BDF8',
  scriptingBg: 'rgba(124, 58, 237, 0.2)',
  scriptingText: '#A78BFA',
  recordingBg: 'rgba(225, 29, 72, 0.2)',
  recordingText: '#FB7185',
  editingBg: 'rgba(217, 119, 6, 0.2)',
  editingText: '#FBBF24',
  postedBg: 'rgba(5, 150, 105, 0.2)',
  postedText: '#34D399',

  dangerBg: 'rgba(220, 38, 38, 0.2)',
  dangerBorder: '#991B1B',
  dangerText: '#FCA5A5',

  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

type ThemeType = 'light' | 'dark';

interface ThemeContextData {
  theme: ThemeType;
  colors: typeof LIGHT_COLORS;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({
  theme: 'light',
  colors: LIGHT_COLORS,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('appTheme').then((savedTheme) => {
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
      }
      setIsLoaded(true);
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    AsyncStorage.setItem('appTheme', newTheme);
  };

  const colors = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
