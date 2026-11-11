import { useEffect } from 'react';
import { useFrameCallback } from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

import { Phase, type AuraState, type Stage } from '../state';
import { initSim, stepSim, type SimBounds } from './bubble-sim';
import { FACE_COUNT } from './use-bubble-images';

/**
 * Owns the sim lifecycle: allocate + pre-warm on the UI runtime before the first draw, step it
 * every frame, and freeze it (not empty it) while the card fully covers the field (audit-2 A7).
 */
export function useBubbleSim(state: AuraState, stage: Stage) {
  const { sim, order, frame, phase, touchActive, touchX, touchY, touchVX, touchVY } = state;
  const { width, height, emitterX, emitterY } = stage;

  useEffect(() => {
    const bounds: SimBounds = { width, height, emitterX, emitterY, faceCount: FACE_COUNT };
    scheduleOnUI(() => {
      'worklet';
      try {
        const created = initSim(bounds);
        sim.set(created.sim);
        order.set(created.order);
        frame.set(frame.get() + 1);
      } catch (error) {
        console.error('[aura] initSim failed', String(error), (error as Error).stack);
      }
    });
  }, [width, height, emitterX, emitterY, sim, order, frame]);

  useFrameCallback((info) => {
    'worklet';
    // Frozen (not emptied) while the card fully covers the field; no frame bump = no redraw.
    if (phase.get() === Phase.sheet) return;
    const d = sim.get();
    const o = order.get();
    if (d === null || o === null) return;
    const dt = (info.timeSincePreviousFrame ?? 16.7) / 1000;
    stepSim(
      d,
      o,
      dt,
      { width, height, emitterX, emitterY, faceCount: FACE_COUNT },
      {
        active: touchActive.get(),
        x: touchX.get(),
        y: touchY.get(),
        vx: touchVX.get(),
        vy: touchVY.get(),
      },
    );
    frame.set(frame.get() + 1);
  }, true);
}
