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

/** Distance the sheet travels: from fully below the screen to its resting frame. */
export function sheetTravel(stage: Stage): number {
  'worklet';
  return stage.height - cardFrame(stage).y;
}

/** Opens the glass sheet; `onOpened` focuses the phone field. */
export function openCard(state: AuraState, source: 0 | 1, onOpened: () => void) {
  'worklet';
  const { phase, cardProgress, cardDrag, morphSource } = state;
  if (phase.get() !== Phase.welcome) return;
  morphSource.set(source);
  cardDrag.set(0);
  phase.set(Phase.sheetOpening);
  cardProgress.set(
    withTiming(1, { duration: card.openMs, easing: card.openEasing }, (finished) => {
      'worklet';
      if (!finished) return;
      phase.set(Phase.sheet);
      scheduleOnRN(onOpened);
    }),
  );
}

/** Slides the sheet back down; the bubble field resumes on the first frame (audit-2 A7). */
export function closeCard(state: AuraState, onClosed: () => void) {
  'worklet';
  const { phase, cardProgress, cardDrag } = state;
  const p = phase.get();
  if (p !== Phase.sheet && p !== Phase.sheetOpening) return;
  phase.set(Phase.sheetClosing);
  cardDrag.set(withSpring(0, { damping: 30, stiffness: 260 }));
  cardProgress.set(
    withTiming(0, { duration: card.closeMs, easing: card.closeEasing }, (finished) => {
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
