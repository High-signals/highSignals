import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SkeletonProps {
  style?: ViewStyle | ViewStyle[];
}

export default function Skeleton({ style }: SkeletonProps) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.4,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);
    Animated.loop(pulse).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surfaceHover, // Use surfaceHover for subtle contrast
          opacity: pulseAnim,
          borderRadius: 8,
        },
        style,
      ]}
    />
  );
}
