import { Canvas, Picture, createPicture, type SkPaint } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import type { AuraState, Stage } from '../state';
import { F_LAYER, STRIDE } from './bubble-sim';
import { drawBubble, type BubblePaints } from './bubble-paint';

type Props = {
  state: AuraState;
  stage: Stage;
  layer: number;
  paints: BubblePaints | null;
  /** Back canvas only: the welcome gradient, drawn first. */
  background?: SkPaint;
};

/**
 * One depth layer of the bubble field, drawn imperatively into a single picture per frame
 * (review finding 4): no per-bubble React nodes, far → near order from the sim's sort.
 */
export function BubbleCanvas({ state, stage, layer, paints, background }: Props) {
  const { sim, order, frame } = state;
  const { width, height } = stage;

  const picture = useDerivedValue(() => {
    // Read the tick so the picture redraws after every sim step.
    frame.get();
    const d = sim.get();
    const o = order.get();
    return createPicture(
      (canvas) => {
        if (background) canvas.drawRect({ x: 0, y: 0, width, height }, background);
        if (d === null || o === null || paints === null) return;
        for (let n = 0; n < o.length; n++) {
          const i = o[n];
          if (d[i * STRIDE + F_LAYER] === layer) drawBubble(canvas, d, i, paints);
        }
      },
      { width, height },
    );
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Picture picture={picture} />
    </Canvas>
  );
}
