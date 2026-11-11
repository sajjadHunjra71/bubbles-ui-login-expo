import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { rubberBand, springs } from '@/animations';
import { gradients, shadows } from '@/theme';

const ORB_SIZE = 96;
const TRACK_LIMIT = 120;

/**
 * Pan gesture with rubber-band resistance past TRACK_LIMIT and a spring back
 * to rest. Everything runs on the UI thread, so the JS thread stays free.
 */
export function DraggableOrb() {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const pressed = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin(() => {
      pressed.set(withSpring(1, springs.snappy));
    })
    .onUpdate((e) => {
      x.set(rubberBand(e.translationX, TRACK_LIMIT));
      y.set(rubberBand(e.translationY, TRACK_LIMIT));
    })
    .onFinalize((e) => {
      x.set(withSpring(0, { ...springs.bouncy, velocity: e.velocityX }));
      y.set(withSpring(0, { ...springs.bouncy, velocity: e.velocityY }));
      pressed.set(withSpring(0, springs.smooth));
    });

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { scale: 1 + pressed.get() * 0.12 },
      { rotate: `${x.get() * 0.15}deg` },
    ],
  }));

  return (
    <View style={styles.stage}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.orb, shadows.glow, orbStyle]}>
          <LinearGradient
            colors={gradients.aurora}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 220, alignItems: 'center', justifyContent: 'center' },
  orb: { width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2, overflow: 'hidden' },
});
