import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useHaptics, usePressScale } from '@/hooks';

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  haptic?: boolean;
};

/** Pressable with spring scale feedback and optional light haptic. */
export function PressableScale({
  children,
  style,
  pressedScale,
  haptic = true,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const press = usePressScale(pressedScale);
  const haptics = useHaptics();

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        press.onPressIn();
        if (haptic) haptics.light();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, press.animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
