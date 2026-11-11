import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import type { ComponentRef, RefObject } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { aura, auraFonts } from '@/theme';

import { faceSources } from '../assets/faces';
import { card } from '../motion';
import { Phase, type AuraState, type Stage } from '../state';
import { cardFrame, morphRect, shouldDismiss } from './card-morph';

export type PhoneInputRef = ComponentRef<typeof TextInput>;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

type Props = {
  state: AuraState;
  stage: Stage;
  inputRef: RefObject<PhoneInputRef | null>;
  onRequestClose: () => void;
};

/**
 * #11 to #13: the frosted "Create Your Aura" card. The clip view morphs from the pill rect to
 * the card rect (250 ms open / 300 ms close); the content is laid out once at the final size
 * and only fades/scales, so nothing reflows per frame. The phone field is always mounted and
 * focused at the end of the morph; the bottom block rides the keyboard.
 */
export function CreateAuraCard({ state, stage, inputRef, onRequestClose }: Props) {
  const { cardProgress, cardDrag, pillFrames, morphSource, phase } = state;
  const target = cardFrame(stage);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  const shell = useAnimatedStyle(() => {
    const frames = pillFrames.get();
    const from = morphSource.get() === 0 ? frames.signIn : frames.signUp;
    const r = morphRect(from, target, cardProgress.get());
    return {
      left: r.x,
      top: r.y,
      width: r.width,
      height: r.height,
      borderRadius: r.radius,
      transform: [{ translateY: cardDrag.get() }],
    };
  });
  const blurProps = useAnimatedProps(() => ({
    intensity: Math.max(1, cardProgress.get() * card.blurIntensity),
  }));
  // Starts as the light pill and warms into the brown card.
  const pillTint = useAnimatedStyle(() => ({
    opacity: interpolate(cardProgress.get(), [0, 0.5], [1, 0], 'clamp'),
  }));
  const warmTint = useAnimatedStyle(() => ({
    opacity: interpolate(cardProgress.get(), [0, 0.6], [0.2, 1], 'clamp'),
  }));
  const content = useAnimatedStyle(() => {
    const p = cardProgress.get();
    const closing = phase.get() === Phase.sheetClosing;
    const opacity = closing
      ? interpolate(p, [1 - card.closeContentShare, 1], [0, 1], 'clamp')
      : interpolate(p, [card.contentFrom, 1], [0, 1], 'clamp');
    return {
      opacity,
      transform: [
        { translateY: cardDrag.get() },
        { scale: interpolate(p, [0, 1], [card.contentScaleFrom, 1]) },
      ],
    };
  });
  const bottomBlock = useAnimatedStyle(() => {
    const kb = keyboardHeight.get();
    const lift = kb < 0 ? kb + Math.max(stage.insetBottom, card.insetBottom) + 8 : 0;
    return { transform: [{ translateY: Math.min(0, lift) }] };
  });

  const dismiss = usePanGesture({
    activeOffsetY: [-1000, 12],
    failOffsetX: [-24, 24],
    // Let the back button and text field keep their own touches until the pan activates.
    cancelsJSResponder: false,
    onUpdate: (e) => {
      'worklet';
      if (phase.get() !== Phase.sheet) return;
      cardDrag.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (phase.get() !== Phase.sheet) return;
      if (shouldDismiss(e.translationY, e.velocityY)) {
        scheduleOnRN(onRequestClose);
      } else {
        cardDrag.set(withSpring(0, { damping: 24, stiffness: 240 }));
      }
    },
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.shell, shell]} pointerEvents="none">
        <AnimatedBlurView tint="dark" animatedProps={blurProps} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.warm, warmTint]} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.pillTint, pillTint]} />
      </Animated.View>

      <GestureDetector gesture={dismiss}>
        <Animated.View
          style={[
            styles.content,
            { left: target.x, top: target.y, width: target.width, height: target.height },
            content,
          ]}
        >
          <Pressable
            onPress={onRequestClose}
            hitSlop={12}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Svg width={8} height={13} viewBox="0 0 8 13">
              <Path
                d="M6.5 1.5 L1.5 6.5 L6.5 11.5"
                stroke={aura.white}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Pressable>

          <View style={styles.grabber} />

          <View style={styles.cluster}>
            {[2, 6, 11].map((face, i) => (
              <Image
                key={face}
                source={faceSources[face]}
                style={[styles.avatar, { marginLeft: i === 0 ? 0 : -10, zIndex: i === 1 ? 2 : 1 }]}
              />
            ))}
          </View>

          <Text style={styles.title}>
            Create Your <Text style={styles.titleSerif}>Aura</Text>
          </Text>
          <Text style={styles.subtitle}>
            Your lifestyle banking experience{'\n'}starts in less than a minute.
          </Text>

          <View style={styles.field}>
            <Text style={styles.flag}>🇺🇸</Text>
            <Text style={styles.code}>+1</Text>
            <View style={styles.divider} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Enter Phone"
              placeholderTextColor={aura.text80}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              selectionColor={aura.white}
              keyboardAppearance="dark"
            />
          </View>

          <Animated.View style={[styles.bottom, bottomBlock]}>
            <Text style={styles.useEmail}>Use email</Text>
            <View style={styles.continue}>
              <Text style={styles.continueText}>Continue</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const AVATAR = 30;

const styles = StyleSheet.create({
  shell: { position: 'absolute', overflow: 'hidden' },
  warm: { backgroundColor: aura.sheetTint },
  pillTint: { backgroundColor: aura.pillLight },
  content: { position: 'absolute', alignItems: 'center', paddingHorizontal: 18 },
  back: {
    position: 'absolute',
    left: 14,
    top: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  grabber: {
    marginTop: 8,
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  cluster: { flexDirection: 'row', marginTop: 18 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,214,190,0.9)',
  },
  title: {
    marginTop: 14,
    color: aura.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  titleSerif: { fontFamily: auraFonts.serifItalic, fontWeight: '400', fontSize: 23 },
  subtitle: {
    marginTop: 8,
    color: aura.text80,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  field: {
    marginTop: 22,
    alignSelf: 'stretch',
    height: 44,
    borderRadius: 14,
    backgroundColor: aura.sheetField,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  flag: { fontSize: 15 },
  code: { color: aura.white, fontSize: 12, fontWeight: '600', marginLeft: 6 },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 10,
  },
  input: { flex: 1, color: aura.white, fontSize: 13, fontWeight: '600', height: 44 },
  bottom: { position: 'absolute', left: 18, right: 18, bottom: 22, alignItems: 'center' },
  useEmail: { color: aura.white, fontSize: 12, fontWeight: '600', marginBottom: 14 },
  continue: {
    alignSelf: 'stretch',
    height: 44,
    borderRadius: 22,
    backgroundColor: aura.pillLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { color: aura.pillLightText, fontSize: 13, fontWeight: '500' },
});
