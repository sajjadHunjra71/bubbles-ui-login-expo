import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { gradients, type GradientName } from '@/theme';

type GradientBackgroundProps = {
  name?: GradientName;
  /** 0..1 start/end points; default is a top-left to bottom-right diagonal. */
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export function GradientBackground({
  name = 'night',
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={gradients[name]}
      start={start}
      end={end}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
