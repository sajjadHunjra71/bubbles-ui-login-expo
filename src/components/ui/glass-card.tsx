import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radii, spacing } from '@/theme';

type GlassCardProps = {
  children: ReactNode;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Frosted card. BlurView is relatively expensive: avoid animating its intensity
 * per frame or stacking many of them in a scrolling list.
 */
export function GlassCard({ children, intensity = 40, style }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  content: { padding: spacing.lg },
});
