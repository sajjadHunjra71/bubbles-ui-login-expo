import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '@/animations';

/**
 * Press-down scale feedback driven entirely on the UI thread.
 * Returns handlers for Pressable plus an animated style to spread onto an Animated.View.
 */
export function usePressScale(pressedScale = 0.96) {
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.set(withSpring(pressedScale, springs.snappy));
  }, [pressedScale, scale]);

  const onPressOut = useCallback(() => {
    scale.set(withSpring(1, springs.bouncy));
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return { onPressIn, onPressOut, animatedStyle };
}
