import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { aura, auraFonts } from '@/theme';

import type { AuraState, Stage } from '../state';

type Props = { state: AuraState; stage: Stage; onBack: () => void };

/**
 * Welcome header (hero-3.6s.png): "WELCOME TO", the mixed sans / serif-italic headline and the
 * subtitle, plus the small back chevron seen from about 7 s (it replays the demo here).
 */
export function WelcomeHeader({ state, stage, onBack }: Props) {
  const { headerOpacity } = state;
  const fade = useAnimatedStyle(() => ({ opacity: headerOpacity.get() }));

  return (
    <Animated.View style={[styles.root, { top: stage.insetTop }, fade]} pointerEvents="box-none">
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back to start"
        style={styles.back}
      >
        <Svg width={8} height={13} viewBox="0 0 8 13">
          <Path
            d="M6.5 1.5 L1.5 6.5 L6.5 11.5"
            stroke={aura.text80}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Pressable>
      <View style={styles.block} pointerEvents="none">
        <Text style={styles.overline}>WELCOME TO</Text>
        <Text style={styles.headline}>
          <Text style={styles.serif}>Aura,</Text> where money{'\n'}meets{' '}
          <Text style={styles.serif}>lifestyle</Text>
        </Text>
        <Text style={styles.subtitle}>
          Your money, your rhythm. Seamless{'\n'}banking that flows with your lifestyle
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  back: {
    position: 'absolute',
    left: 18,
    top: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  block: { alignItems: 'center', paddingTop: 44 },
  overline: {
    color: aura.text70,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.2,
    marginBottom: 8,
  },
  headline: {
    color: aura.white,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  serif: {
    fontFamily: auraFonts.serifItalic,
    fontWeight: '400',
    fontSize: 30,
    letterSpacing: 0,
  },
  subtitle: {
    color: aura.text80,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 10,
  },
});
