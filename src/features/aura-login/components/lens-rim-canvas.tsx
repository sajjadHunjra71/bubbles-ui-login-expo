import {
  BlurStyle,
  Canvas,
  PaintStyle,
  Picture,
  Skia,
  TileMode,
  createPicture,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  interpolate,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

import { aura } from '@/theme';

import { reveal, stream } from '../motion';
import type { AuraState, Stage } from '../state';

const COLORS = [
  aura.iriMagenta,
  aura.iriCyan,
  aura.iriYellow,
  aura.iriLilac,
  aura.iriMint,
  aura.iriMagenta,
];

type Props = { state: AuraState; stage: Stage };

/**
 * The lens's thin-film rim (#4/#5), drawn above the header so it reads over text. It thins from a
 * fat swelling-bubble rim to the label bubble's rim, and the hues slowly rotate. Drawn
 * imperatively: the sweep shader sits at the origin and the canvas is translated to the lens.
 */
export function LensRimCanvas({ state, stage }: Props) {
  const { lensX, lensY, lensR } = state;
  const spin = useSharedValue(0);

  const paints = useMemo(() => {
    const shader = Skia.Shader.MakeSweepGradient(
      0,
      0,
      COLORS.map((c) => Skia.Color(c)),
      null,
      TileMode.Clamp,
    );
    const rim = Skia.Paint();
    rim.setAntiAlias(true);
    rim.setStyle(PaintStyle.Stroke);
    rim.setShader(shader);
    const glow = rim.copy();
    glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 4, false));
    return { rim, glow };
  }, []);

  useFrameCallback((info) => {
    'worklet';
    spin.set((spin.get() + ((info.timeSincePreviousFrame ?? 16) / 1000) * 30) % 360);
  });

  const picture = useDerivedValue(() => {
    const r = lensR.get();
    const x = lensX.get();
    const y = lensY.get();
    const rotation = spin.get();
    const width = interpolate(
      r,
      [reveal.labelDiameter / 2, 140, stage.diagonal],
      [stream.rimWidthPt, 2.4, 5],
      'clamp',
    );
    return createPicture(
      (canvas) => {
        if (r < 1) return;
        canvas.save();
        canvas.translate(x, y);
        canvas.rotate(rotation, 0, 0);
        paints.glow.setStrokeWidth(width * 3);
        paints.glow.setAlphaf(0.45);
        canvas.drawCircle(0, 0, r, paints.glow);
        paints.rim.setStrokeWidth(width);
        canvas.drawCircle(0, 0, r, paints.rim);
        canvas.restore();
      },
      { width: stage.width, height: stage.height },
    );
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Picture picture={picture} />
    </Canvas>
  );
}
