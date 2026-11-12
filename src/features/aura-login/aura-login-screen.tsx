import { BlurView } from 'expo-blur';
import { makeImageFromView, type SkImage } from '@shopify/react-native-skia';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react';
import { Keyboard, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, useManualGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnUI } from 'react-native-worklets';

import { useHaptics } from '@/hooks';
import { aura } from '@/theme';

import { BubbleCanvas } from './bubbles/bubble-canvas';
import { LAYER_BACK, LAYER_FRONT } from './bubbles/bubble-sim';
import { useBubblePaints } from './bubbles/use-bubble-images';
import { useBubbleSim } from './bubbles/use-bubble-sim';
import { AuthButtons } from './components/auth-buttons';
import { makeBackgroundPaint } from './components/background-gradient';
import { closeCard, openCard } from './components/card-morph';
import { CreateAuraCard, type PhoneInputRef } from './components/create-aura-card';
import { IntroOverlay, SwipeDot } from './components/intro-overlay';
import { LabelBubble } from './components/label-bubble';
import { LensCanvas } from './components/lens-canvas';
import { handleCenter, useSwipeReveal } from './components/use-swipe-reveal';
import { WelcomeHeader } from './components/welcome-header';
import { bubblePop, swipe } from './motion';
import { Phase, useAuraState, type AuraState, type PillId, type Stage } from './state';

/** Preview blur over the live scene while dragging (#2). */
const PREVIEW_BLUR_INTENSITY = 60;

/** React-side mirror of the phase machine: only mounts and pointer events, never per frame. */
type Ui = {
  preview: boolean;
  lens: boolean;
  intro: boolean;
  welcome: boolean;
  cycling: boolean;
  card: boolean;
  /** The sheet is mounted (off-screen) from the first welcome, so opening never waits on a mount. */
  sheetMounted: boolean;
  runId: number;
};

const INITIAL_UI: Ui = {
  preview: true,
  lens: false,
  intro: true,
  welcome: false,
  cycling: false,
  card: false,
  sheetMounted: false,
  runId: 0,
};

function useStage(): Stage {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return useMemo(
    () => ({
      width,
      height,
      emitterX: width / 2,
      // Label bubble centre at about 48% of the screen height (analysis §5).
      emitterY: height * 0.48,
      diagonal: Math.hypot(width, height),
      insetTop: insets.top,
      insetBottom: insets.bottom,
    }),
    [width, height, insets.top, insets.bottom],
  );
}

export function AuraLoginScreen() {
  const stage = useStage();
  const state = useAuraState();
  const paints = useBubblePaints();
  const haptics = useHaptics();
  const [ui, setUi] = useState<Ui>(INITIAL_UI);
  const inputRef = useRef<PhoneInputRef>(null);
  const background = useMemo(() => makeBackgroundPaint(stage.height), [stage.height]);

  useBubbleSim(state, stage, haptics.light);

  // One-off snapshot of the header and buttons, so the lens can blur them too (they are RN
  // views, which a Skia canvas cannot see). Taken once fonts and layout have settled.
  const welcomeRef = useRef<ComponentRef<typeof View>>(null);
  const [uiSnapshot, setUiSnapshot] = useState<SkImage | null>(null);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      // Skia's typing predates RN 0.88's element refs; at runtime it only needs the native view.
      makeImageFromView(welcomeRef as unknown as RefObject<number | null>)
        .then((image) => {
          if (!cancelled) setUiSnapshot(image);
        })
        .catch((error: unknown) => console.warn('[aura] UI snapshot failed', error));
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [stage.width, stage.height]);

  // Park the knob on the handle.
  const { dotX, dotY } = state;
  useEffect(() => {
    const home = handleCenter(stage);
    dotX.set(home.x);
    dotY.set(home.y);
  }, [stage, dotX, dotY]);

  const swipeGesture = useSwipeReveal(state, stage, {
    onCommit: () => {
      haptics.light();
      setUi((u) => ({ ...u, lens: true, cycling: true, runId: u.runId + 1 }));
    },
    onLensFull: () => setUi((u) => ({ ...u, preview: false })),
    onRevealed: () => setUi((u) => ({ ...u, intro: false, welcome: true, sheetMounted: true })),
  });

  const touchGesture = useBubbleTouch(state);

  const onCardClosed = useCallback(() => {
    setUi((u) => ({ ...u, card: false, welcome: true, cycling: true }));
  }, []);

  const requestClose = useCallback(() => {
    Keyboard.dismiss();
    scheduleOnUI(closeCard, state, onCardClosed);
  }, [state, onCardClosed]);

  const onOpen = useCallback(
    (pill: PillId) => {
      haptics.selection();
      setUi((u) => ({ ...u, card: true, welcome: false, cycling: false }));
      const focus = () => inputRef.current?.focus();
      scheduleOnUI(openCard, state, pill === 'signIn' ? 0 : 1, focus);
    },
    [haptics, state],
  );

  const onReset = useCallback(() => {
    const { phase, progress, introOpacity, headerOpacity, lensR, lensTint, cardProgress } = state;
    const home = handleCenter(stage);
    phase.set(Phase.locked);
    progress.set(0);
    introOpacity.set(1);
    headerOpacity.set(1);
    lensR.set(0);
    lensTint.set(0);
    cardProgress.set(0);
    dotX.set(home.x);
    dotY.set(home.y);
    setUi((u) => ({ ...INITIAL_UI, runId: u.runId }));
  }, [state, stage, dotX, dotY]);

  return (
    <GestureDetector gesture={touchGesture}>
      <View style={styles.root}>
        <BubbleCanvas
          state={state}
          stage={stage}
          layer={LAYER_BACK}
          paints={paints}
          background={background}
        />
        <View
          ref={welcomeRef}
          collapsable={false}
          style={StyleSheet.absoluteFill}
          pointerEvents={ui.welcome ? 'box-none' : 'none'}
        >
          <WelcomeLayer state={state} stage={stage} onOpen={onOpen} onReset={onReset} />
        </View>
        <BubbleCanvas state={state} stage={stage} layer={LAYER_FRONT} paints={paints} />

        {ui.preview && <PreviewBlur state={state} />}
        {ui.lens && (
          <LensCanvas
            state={state}
            stage={stage}
            paints={paints}
            background={background}
            uiSnapshot={uiSnapshot}
          />
        )}

        <LabelBubble key={ui.runId} stage={stage} cycling={ui.cycling} tappable={ui.welcome} />

        {ui.intro && <IntroOverlay state={state} stage={stage} gesture={swipeGesture} />}
        {ui.intro && <SwipeDot state={state} stage={stage} />}

        {ui.sheetMounted && (
          <CreateAuraCard
            open={ui.card}
            state={state}
            stage={stage}
            inputRef={inputRef}
            onRequestClose={requestClose}
          />
        )}
      </View>
    </GestureDetector>
  );
}

function WelcomeLayer({
  state,
  stage,
  onOpen,
  onReset,
}: {
  state: AuraState;
  stage: Stage;
  onOpen: (pill: PillId) => void;
  onReset: () => void;
}) {
  return (
    <>
      <WelcomeHeader state={state} stage={stage} onBack={onReset} />
      <AuthButtons state={state} stage={stage} onOpen={onOpen} />
    </>
  );
}

/**
 * #2: the live welcome scene under a fixed-intensity blur (its own opacity never animates,
 * audit-2 A3); only the dim layer follows p. Removed the frame the lens covers the screen.
 */
function PreviewBlur({ state }: { state: AuraState }) {
  const { progress } = state;
  const dim = useAnimatedStyle(() => ({ opacity: progress.get() * swipe.dimMax }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <BlurView intensity={PREVIEW_BLUR_INTENSITY} tint="default" style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dim]} />
    </View>
  );
}

/**
 * Bubble touch (optional, analysis §7): a manual gesture on the root that never activates. It
 * only reads touches, so pills and the label keep receiving their own touches (audit-2 B4).
 */
function useBubbleTouch(state: AuraState) {
  const {
    phase,
    pillFrames,
    touchActive,
    touchX,
    touchY,
    touchVX,
    touchVY,
    touchStartX,
    touchStartY,
    touchStartT,
    tapPending,
  } = state;
  return useManualGesture({
    onTouchesDown: (e) => {
      'worklet';
      const t = e.allTouches[0];
      if (t === undefined || phase.get() !== Phase.welcome) return;
      touchStartX.set(t.x);
      touchStartY.set(t.y);
      touchStartT.set(Date.now());
      touchX.set(t.x);
      touchY.set(t.y);
      touchVX.set(0);
      touchVY.set(0);
      // Pushing only starts once the finger actually moves (a tap pops instead).
      touchActive.set(0);
    },
    onTouchesMove: (e) => {
      'worklet';
      const t = e.allTouches[0];
      if (t === undefined || phase.get() !== Phase.welcome) return;
      const moved = Math.hypot(t.x - touchStartX.get(), t.y - touchStartY.get());
      if (moved > bubblePop.tapMaxMove) touchActive.set(1);
      // Per-event delta → rough velocity, low-pass filtered (events arrive at ~60-120 Hz).
      const vx = (t.x - touchX.get()) * 60;
      const vy = (t.y - touchY.get()) * 60;
      touchVX.set(touchVX.get() * 0.6 + vx * 0.4);
      touchVY.set(touchVY.get() * 0.6 + vy * 0.4);
      touchX.set(t.x);
      touchY.set(t.y);
    },
    onTouchesUp: (e) => {
      'worklet';
      const wasDrag = touchActive.get() === 1;
      touchActive.set(0);
      const t = e.changedTouches[0];
      if (t === undefined || wasDrag || phase.get() !== Phase.welcome) return;
      const quick = Date.now() - touchStartT.get() < bubblePop.tapMaxMs;
      // Taps on the buttons belong to the buttons, not to bubbles behind them.
      const onButtons = t.y >= pillFrames.get().signIn.y - 4 && pillFrames.get().signIn.y > 0;
      if (quick && !onButtons) {
        touchX.set(t.x);
        touchY.set(t.y);
        tapPending.set(1);
      }
    },
    onTouchesCancel: () => {
      'worklet';
      touchActive.set(0);
    },
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aura.nightDeep, overflow: 'hidden' },
  dim: { backgroundColor: aura.dim },
});
