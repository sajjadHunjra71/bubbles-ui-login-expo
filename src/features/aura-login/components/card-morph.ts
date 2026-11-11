import { withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { card } from '../motion';
import { Phase, type AuraState, type Rect, type Stage } from '../state';

export function cardFrame(stage: Stage): Rect {
  'worklet';
  const y = stage.insetTop + card.insetTop;
  return {
    x: card.insetX,
    y,
    width: stage.width - card.insetX * 2,
    height: stage.height - y - Math.max(stage.insetBottom, card.insetBottom),
  };
}

export function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

/** Container transform between the source pill rect and the card rect (#11/#13). */
export function morphRect(from: Rect, to: Rect, t: number): Rect & { radius: number } {
  'worklet';
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
    radius: lerp(Math.min(card.radiusFrom, from.height / 2), card.radiusTo, t),
  };
}

/** #11: open from the tapped pill; `onOpened` focuses the phone field. */
export function openCard(state: AuraState, source: 0 | 1, onOpened: () => void) {
  'worklet';
  const { phase, cardProgress, cardDrag, morphSource } = state;
  if (phase.get() !== Phase.welcome) return;
  morphSource.set(source);
  cardDrag.set(0);
  phase.set(Phase.sheetOpening);
  cardProgress.set(
    withTiming(1, { duration: card.openMs, easing: card.easing }, (finished) => {
      'worklet';
      if (!finished) return;
      phase.set(Phase.sheet);
      scheduleOnRN(onOpened);
    }),
  );
}

/** #13: collapse back into the pill; the pill reappears on the frame the card unmounts. */
export function closeCard(state: AuraState, onClosed: () => void) {
  'worklet';
  const { phase, cardProgress, cardDrag } = state;
  const p = phase.get();
  if (p !== Phase.sheet && p !== Phase.sheetOpening) return;
  // The sim resumes on this first frame, so a full field sits behind the collapsing card (A7).
  phase.set(Phase.sheetClosing);
  cardDrag.set(withSpring(0, { damping: 30, stiffness: 260 }));
  cardProgress.set(
    withTiming(0, { duration: card.closeMs, easing: card.easing }, (finished) => {
      'worklet';
      if (!finished) return;
      phase.set(Phase.welcome);
      scheduleOnRN(onClosed);
    }),
  );
}

/** Swipe-down dismiss thresholds (audit-2 A10). */
export function shouldDismiss(translationY: number, velocityY: number): boolean {
  'worklet';
  return translationY > card.dismissDistance || velocityY > card.dismissVelocity;
}
