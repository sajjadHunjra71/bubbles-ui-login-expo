import { usePanGesture } from 'react-native-gesture-handler';
import { withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { reveal, swipe } from '../motion';
import { Phase, type AuraState, type Stage } from '../state';

export type SwipeCallbacks = {
  /** Fired on release past the threshold (haptic, timers). */
  onCommit: () => void;
  /** The lens covers the whole screen: the preview blur can be removed (#4). */
  onLensFull: () => void;
  /** The lens has become the label bubble (#5 end). */
  onRevealed: () => void;
};

export function handleCenter(stage: Stage) {
  'worklet';
  return { x: stage.width / 2, y: stage.height - stage.insetBottom - 64 };
}

/**
 * #2/#3/#4/#5: the swipe-up handle. p follows the finger 1:1; release past the threshold (or
 * with an upward fling) runs the lens: grow to the screen diagonal while the centre moves from
 * the dot to the emitter, then shrink into the label bubble.
 */
export function useSwipeReveal(state: AuraState, stage: Stage, callbacks: SwipeCallbacks) {
  const { phase, progress, dotX, dotY, lensX, lensY, lensR, lensTint, introOpacity } = state;
  const travel = stage.height * swipe.travelFraction;
  const finalRadius = reveal.labelDiameter / 2;
  const { onCommit, onLensFull, onRevealed } = callbacks;

  return usePanGesture({
    activeOffsetY: [-8, 8],
    onActivate: () => {
      'worklet';
      if (phase.get() === Phase.locked) phase.set(Phase.dragging);
    },
    onUpdate: (e) => {
      'worklet';
      if (phase.get() !== Phase.dragging) return;
      const p = Math.min(1, Math.max(0, -e.translationY / travel));
      const home = handleCenter(stage);
      progress.set(p);
      introOpacity.set(1 - p * (1 - swipe.introMinOpacity));
      dotX.set(home.x + e.translationX * 0.35);
      dotY.set(home.y + Math.min(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (phase.get() !== Phase.dragging) return;
      const commit = progress.get() > swipe.commitProgress || e.velocityY < swipe.commitVelocity;
      const home = handleCenter(stage);

      if (!commit) {
        // #3: spring back with no overshoot.
        progress.set(withSpring(0, swipe.cancelSpring));
        introOpacity.set(withSpring(1, swipe.cancelSpring));
        dotX.set(withSpring(home.x, swipe.cancelSpring));
        dotY.set(withSpring(home.y, swipe.cancelSpring));
        phase.set(Phase.locked);
        return;
      }

      phase.set(Phase.revealing);
      scheduleOnRN(onCommit);

      // #4: the bubble swells from the dot over the whole screen in 100 ms...
      lensX.set(dotX.get());
      lensY.set(dotY.get());
      lensR.set(swipe.dotRadius);
      lensTint.set(0);
      const grow = { duration: reveal.growMs, easing: reveal.growEasing };
      lensX.set(withTiming(stage.emitterX, grow));
      lensY.set(withTiming(stage.emitterY, grow));
      // #5: ...then shrinks into the label bubble over 900 ms (A1).
      lensR.set(
        withSequence(
          withTiming(stage.diagonal, grow, (finished) => {
            'worklet';
            if (finished) scheduleOnRN(onLensFull);
          }),
          withTiming(
            finalRadius,
            { duration: reveal.shrinkMs, easing: reveal.shrinkEasing },
            (finished) => {
              'worklet';
              if (!finished) return;
              phase.set(Phase.welcome);
              scheduleOnRN(onRevealed);
            },
          ),
        ),
      );
      lensTint.set(
        withDelay(reveal.growMs + reveal.tintDelayMs, withTiming(1, { duration: reveal.tintMs })),
      );
      introOpacity.set(withTiming(0, { duration: reveal.introOutMs }));
    },
  });
}
