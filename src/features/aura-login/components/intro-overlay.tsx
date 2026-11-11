import {
  Canvas,
  LinearGradient,
  Oval,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, type PanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { aura } from '@/theme';

import { handlePulse, swipe } from '../motion';
import type { AuraState, Stage } from '../state';
import { handleCenter } from './use-swipe-reveal';

type Props = { state: AuraState; stage: Stage; gesture: PanGesture };

const HANDLE_RING = 44;
const HANDLE_KNOB = 26;

/**
 * Intro (locked) state (#1/#2): warm gradient, blue glow along the bottom edge, the pulsing
 * handle and its caption. Fades as 1 − p while dragging, so the blurred welcome scene shows
 * through (audit-2 A3: the blur itself never fades).
 */
export function IntroOverlay({ state, stage, gesture }: Props) {
  const { introOpacity, progress } = state;
  const { width, height } = stage;
  const home = handleCenter(stage);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(
      withRepeat(
        withTiming(1, { duration: handlePulse.durationMs, easing: handlePulse.easing }),
        -1,
        true,
      ),
    );
  }, [pulse]);

  const overlay = useAnimatedStyle(() => ({ opacity: introOpacity.get() }));
  // The blue glow goes faster than the gradient (gone by 1.2 s in the reference).
  const glow = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, progress.get() * 1.6) }));
  const caption = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, progress.get() * 4) }));
  const ring = useAnimatedStyle(() => ({
    opacity: (1 - Math.min(1, progress.get() * 3)) * interpolate(pulse.get(), [0, 1], [0.9, 0.35]),
    transform: [{ scale: interpolate(pulse.get(), [0, 1], [1, handlePulse.scaleTo]) }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, overlay]} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            <Rect x={0} y={0} width={width} height={height}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height)}
                colors={[aura.introOrange, '#E8603A', '#A8473A', aura.introPlum, '#2B1C2A']}
                positions={[0, 0.3, 0.5, 0.72, 0.9]}
              />
            </Rect>
          </Canvas>
          <Animated.View style={[StyleSheet.absoluteFill, glow]}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Oval x={-width * 0.25} y={height * 0.84} width={width * 1.5} height={height * 0.36}>
                <RadialGradient
                  c={vec(width / 2, height * 1.02)}
                  r={width * 0.75}
                  colors={[aura.introBlueEdge, aura.introBlueCore, 'rgba(10,75,219,0)']}
                  positions={[0, 0.45, 1]}
                />
              </Oval>
            </Canvas>
          </Animated.View>
          <Animated.View
            style={[
              styles.ring,
              { left: home.x - HANDLE_RING / 2, top: home.y - HANDLE_RING / 2 },
              ring,
            ]}
          />
          <Animated.View
            style={[styles.captionWrap, { top: home.y + HANDLE_RING / 2 + 6 }, caption]}
          >
            <Text style={styles.caption}>Swipe up to get started</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

type DotProps = { state: AuraState; stage: Stage };

/** The white knob that shrinks into a glowing dot and follows the finger (#2). Above the blur. */
export function SwipeDot({ state }: DotProps) {
  const { progress, dotX, dotY, introOpacity, phase } = state;

  const knob = useAnimatedStyle(() => {
    const p = progress.get();
    const size = interpolate(p, [0, 0.25], [HANDLE_KNOB, swipe.dotRadius * 2], 'clamp');
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      opacity: phase.get() >= 2 ? introOpacity.get() : 1,
      transform: [{ translateX: dotX.get() - size / 2 }, { translateY: dotY.get() - size / 2 }],
    };
  });
  const chevron = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, progress.get() * 6) }));

  return (
    <Animated.View pointerEvents="none" style={[styles.knob, knob]}>
      <Animated.View style={chevron}>
        <Svg width={12} height={8} viewBox="0 0 12 8">
          <Path
            d="M1.5 6.5 L6 2 L10.5 6.5"
            stroke="#3A2A33"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    width: HANDLE_RING,
    height: HANDLE_RING,
    borderRadius: HANDLE_RING / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  captionWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  caption: { color: aura.text80, fontSize: 11, fontWeight: '500', letterSpacing: 0.2 },
  knob: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: aura.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: aura.white,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
