import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { entrances } from '@/animations';
import { GlassCard, GradientBackground, PressableScale, Screen, Text } from '@/components/ui';
import { useHaptics } from '@/hooks';
import { colors, radii, spacing } from '@/theme';

import { DraggableOrb } from './components/draggable-orb';
import { ProgressRing } from './components/progress-ring';

/**
 * Smoke-test screen for the starter: exercises Reanimated (layout + shared values),
 * Gesture Handler, SVG, Linear Gradient, Blur and Haptics in one place.
 * Replace this feature when a reel project is created.
 */
export function ShowcaseScreen() {
  const haptics = useHaptics();

  return (
    <Screen background={<GradientBackground name="night" />}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={entrances.riseIn(0)}>
          <Text variant="overline" color="accentSoft">
            Expo Animation Starter
          </Text>
          <Text variant="display" style={styles.title}>
            Motion first.
          </Text>
          <Text color="textSecondary">
            Drag the orb, watch the ring, tap the button. Every effect runs on the UI thread.
          </Text>
        </Animated.View>

        <Animated.View entering={entrances.pop(1)}>
          <DraggableOrb />
        </Animated.View>

        <Animated.View entering={entrances.riseIn(2)}>
          <GlassCard style={styles.card}>
            <View style={styles.row}>
              <ProgressRing size={84} strokeWidth={8} />
              <View style={styles.rowText}>
                <Text variant="heading">SVG + Reanimated</Text>
                <Text variant="caption" color="textSecondary">
                  Stroke offset driven by useAnimatedProps.
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={entrances.riseIn(3)}>
          <PressableScale style={styles.button} onPress={haptics.success}>
            <Text variant="bodyStrong">Press me</Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.xxl, gap: spacing.xl },
  title: { marginVertical: spacing.sm },
  card: { marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  rowText: { flex: 1, gap: spacing.xs },
  button: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
});
