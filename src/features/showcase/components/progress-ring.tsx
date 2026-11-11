import { useEffect } from 'react';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { durations, easings } from '@/animations';
import { colors, palette } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProgressRingProps = {
  size?: number;
  strokeWidth?: number;
};

/** SVG stroke animated via useAnimatedProps (UI thread, no re-render per frame). */
export function ProgressRing({ size = 120, strokeWidth = 10 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: durations.slower * 2, easing: easings.fastOutSlowIn }),
          withTiming(0, { duration: durations.slower * 2, easing: easings.fastOutSlowIn }),
        ),
        -1,
      ),
    );
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.get()),
  }));

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={palette.cyan} />
          <Stop offset="1" stopColor={palette.violet} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.border}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#ring)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        animatedProps={animatedProps}
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}
