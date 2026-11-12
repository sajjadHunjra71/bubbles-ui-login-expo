import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type AnimatedRef,
} from 'react-native-reanimated';

import { springs } from '@/animations';
import { aura } from '@/theme';

import { card } from '../motion';
import { Phase, type AuraState, type PillId, type Stage } from '../state';

type Props = {
  state: AuraState;
  stage: Stage;
  onOpen: (pill: PillId) => void;
};

export const PILL_HEIGHT = 44;

/**
 * Sign in / Sign up pills and the terms text. Each pill's window rect is measured on the UI
 * thread when the phase enters `welcome` (scale is 1 then, audit-2 A9) and cached in pillFrames
 * for the card morph. The source pill hides while the card is open.
 */
export function AuthButtons({ state, stage, onOpen }: Props) {
  const signInRef = useAnimatedRef<Animated.View>();
  const signUpRef = useAnimatedRef<Animated.View>();
  const { phase, pillFrames } = state;

  useAnimatedReaction(
    () => phase.get(),
    (now, prev) => {
      if (now !== Phase.welcome || prev === Phase.welcome) return;
      try {
        const a = measure(signInRef);
        const b = measure(signUpRef);
        if (a === null || b === null) return;
        pillFrames.set({
          signIn: { x: a.pageX, y: a.pageY, width: a.width, height: a.height },
          signUp: { x: b.pageX, y: b.pageY, width: b.width, height: b.height },
        });
      } catch (error) {
        console.error('[aura] measure failed', String(error));
      }
    },
  );

  return (
    <View style={[styles.root, { bottom: stage.insetBottom + 10 }]} pointerEvents="box-none">
      <Pill id="signIn" animatedRef={signInRef} onOpen={onOpen} label="Sign in" variant="light" />
      <View style={styles.gap} />
      <Pill id="signUp" animatedRef={signUpRef} onOpen={onOpen} label="Sign up" variant="dark" />
      <Text style={styles.terms}>
        By using our platform, you agree to our terms.{'\n'}Please read them to understand your
        rights.
      </Text>
    </View>
  );
}

type PillProps = {
  id: PillId;
  label: string;
  variant: 'light' | 'dark';
  animatedRef: AnimatedRef<Animated.View>;
  onOpen: (pill: PillId) => void;
};

function Pill({ id, label, variant, animatedRef, onOpen }: PillProps) {
  const scale = useSharedValue(1);

  // The sheet now slides up over the pills, so the pills stay put.
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      onPressIn={() => scale.set(withSpring(card.pressScale, springs.snappy))}
      onPressOut={() => scale.set(withSpring(1, springs.smooth))}
      onPress={() => onOpen(id)}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        ref={animatedRef}
        style={[styles.pill, variant === 'light' ? styles.light : styles.dark, style]}
      >
        <Text style={variant === 'light' ? styles.lightText : styles.darkText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 24, right: 24 },
  gap: { height: 8 },
  pill: {
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    backgroundColor: aura.pillLight,
    shadowColor: aura.white,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  dark: {
    backgroundColor: aura.pillDark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: aura.pillDarkBorder,
  },
  lightText: { color: aura.pillLightText, fontSize: 13, fontWeight: '500' },
  darkText: { color: aura.white, fontSize: 13, fontWeight: '600' },
  terms: {
    color: aura.text70,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 18,
  },
});
