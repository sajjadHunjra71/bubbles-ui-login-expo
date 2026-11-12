import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import type { ComponentRef, RefObject } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { aura, auraFonts } from '@/theme';

import { faceSources } from '../assets/faces';
import { card } from '../motion';
import { Phase, type AuraState, type Stage } from '../state';
import { cardFrame, sheetTravel, shouldDismiss } from './card-morph';

export type PhoneInputRef = ComponentRef<typeof TextInput>;

type Props = {
  /** Interactive only while open; otherwise it waits off-screen. */
  open: boolean;
  state: AuraState;
  stage: Stage;
  inputRef: RefObject<PhoneInputRef | null>;
  onRequestClose: () => void;
};

/**
 * #11 to #13, revised after Sajjad's review: the frosted "Create Your Aura" glass sheet slides up
 * from the bottom (520 ms, easeOutQuart) over a dimmed backdrop and slides back down on close
 * (380 ms). Only transform and opacity animate, so there is no layout work per frame, and the
 * blur keeps a fixed intensity (animating it re-renders the effect every frame). The phone field
 * is always mounted and focused when the sheet lands; the bottom block rides the keyboard.
 */
export function CreateAuraCard({ open, state, stage, inputRef, onRequestClose }: Props) {
  const { cardProgress, cardDrag, phase } = state;
  const target = cardFrame(stage);
  const travel = sheetTravel(stage);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  const backdrop = useAnimatedStyle(() => ({ opacity: cardProgress.get() * card.dimMax }));
  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - cardProgress.get()) * travel + cardDrag.get() }],
  }));
  const content = useAnimatedStyle(() => {
    const p = cardProgress.get();
    const closing = phase.get() === Phase.sheetClosing;
    return {
      opacity: closing
        ? interpolate(p, [1 - card.closeContentShare, 1], [0, 1], 'clamp')
        : interpolate(p, [card.contentFrom, 1], [0, 1], 'clamp'),
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
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'box-none' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onRequestClose}
          accessibilityLabel="Close sheet"
        />
      </Animated.View>

      <GestureDetector gesture={dismiss}>
        <Animated.View
          style={[
            styles.sheet,
            { left: target.x, top: target.y, width: target.width, height: target.height },
            sheet,
          ]}
        >
          <BlurView tint="dark" intensity={card.blurIntensity} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.warm]} pointerEvents="none" />
          <Animated.View style={[StyleSheet.absoluteFill, styles.content, content]}>
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
                  style={[
                    styles.avatar,
                    { marginLeft: i === 0 ? 0 : -10, zIndex: i === 1 ? 2 : 1 },
                  ]}
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
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const AVATAR = 30;

const styles = StyleSheet.create({
  backdrop: { backgroundColor: aura.dim },
  sheet: { position: 'absolute', overflow: 'hidden', borderRadius: card.radius },
  warm: { backgroundColor: aura.sheetTint },
  content: { alignItems: 'center', paddingHorizontal: 18 },
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
