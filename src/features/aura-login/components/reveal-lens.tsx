import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { aura } from '@/theme';

import type { AuraState, Stage } from '../state';

/** Must match the preview blur so the hand-off at full size is invisible (#4). */
export const LENS_BLUR_INTENSITY = 60;

type Props = { state: AuraState; stage: Stage };

/**
 * #4/#5: the soap-bubble lens. A fixed-size circle (diameter = 2 × screen diagonal, constant
 * borderRadius) clips a BlurView; only transform and the tint opacity animate (audit-2 A2), so
 * there is no layout pass per frame. Everything under it (RN text and both bubble canvases) is
 * truly blurred. Its end state is the label bubble's dark glass body (A6).
 */
export function RevealLens({ state, stage }: Props) {
  const { lensX, lensY, lensR, lensTint } = state;
  const size = stage.diagonal * 2;
  const half = size / 2;

  const circle = useAnimatedStyle(() => ({
    transform: [
      { translateX: lensX.get() - half },
      { translateY: lensY.get() - half },
      { scale: Math.max(0.0001, lensR.get() / half) },
    ],
  }));
  const tint = useAnimatedStyle(() => ({ opacity: lensTint.get() }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.circle, { width: size, height: size, borderRadius: half }, circle]}
    >
      <BlurView intensity={LENS_BLUR_INTENSITY} tint="default" style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.tint, tint]} />
      <View style={[StyleSheet.absoluteFill, styles.sheen]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  tint: { backgroundColor: aura.labelBody },
  sheen: { backgroundColor: 'rgba(255,255,255,0.03)' },
});
