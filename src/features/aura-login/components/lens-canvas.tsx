import {
  BlurStyle,
  Canvas,
  ClipOp,
  PaintStyle,
  Picture,
  Skia,
  TileMode,
  createPicture,
  type SkImage,
  type SkPaint,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { interpolate, useDerivedValue } from 'react-native-reanimated';

import { aura } from '@/theme';

import { F_POP, STRIDE } from '../bubbles/bubble-sim';
import { drawBubble, type BubblePaints } from '../bubbles/bubble-paint';
import { lens, reveal, stream } from '../motion';
import type { AuraState, Stage } from '../state';

const RIM_COLORS = [
  aura.iriMagenta,
  aura.iriCyan,
  aura.iriYellow,
  aura.iriLilac,
  aura.iriMint,
  aura.iriMagenta,
];

type Props = {
  state: AuraState;
  stage: Stage;
  paints: BubblePaints | null;
  background: SkPaint;
  /** One-off capture of the welcome header and buttons, so they blur inside the lens too. */
  uiSnapshot: SkImage | null;
};

/**
 * #4/#5 and the label bubble body, in ONE Skia picture per frame (Sajjad's review: the old
 * BlurView-in-a-scaled-view lens stuttered and its rim drifted from the blur).
 *
 * Inside the circle the scene is re-drawn (gradient, both bubble layers, the UI snapshot) into a
 * blurred layer, then tinted; the iridescent rim is stroked in the same pass. Blur, tint and rim
 * therefore always share the exact same radius on the exact same frame. Outside the circle the
 * real scene shows through, sharp.
 */
export function LensCanvas({ state, stage, paints, background, uiSnapshot }: Props) {
  const { lensX, lensY, lensR, lensTint, sim, order, frame } = state;
  const { width, height } = stage;

  const p = useMemo(() => {
    const blur = Skia.Paint();
    blur.setImageFilter(
      Skia.ImageFilter.MakeBlur(lens.blurSigma, lens.blurSigma, TileMode.Clamp, null),
    );
    const image = Skia.Paint();
    image.setAntiAlias(true);
    const veil = Skia.Paint();
    veil.setColor(Skia.Color(lens.veil));
    const tint = Skia.Paint();
    tint.setAntiAlias(true);
    tint.setColor(Skia.Color(aura.labelBody));
    const sheen = Skia.Paint();
    sheen.setAntiAlias(true);
    sheen.setShader(
      Skia.Shader.MakeRadialGradient(
        { x: -0.3, y: -0.35 },
        1.25,
        [
          Skia.Color('rgba(255,255,255,0.10)'),
          Skia.Color('rgba(255,255,255,0.02)'),
          Skia.Color('rgba(255,236,245,0.16)'),
        ],
        [0, 0.6, 1],
        TileMode.Clamp,
      ),
    );
    const rim = Skia.Paint();
    rim.setAntiAlias(true);
    rim.setStyle(PaintStyle.Stroke);
    rim.setShader(
      Skia.Shader.MakeSweepGradient(
        0,
        0,
        RIM_COLORS.map((c) => Skia.Color(c)),
        null,
        TileMode.Clamp,
      ),
    );
    const glow = rim.copy();
    glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 4, false));
    return { blur, image, veil, tint, sheen, rim, glow };
  }, []);

  const picture = useDerivedValue(() => {
    frame.get(); // redraw with the live bubbles
    const r = lensR.get();
    const x = lensX.get();
    const y = lensY.get();
    const tintAmount = lensTint.get();
    const d = sim.get();
    const o = order.get();
    const rimWidth = interpolate(
      r,
      [reveal.labelDiameter / 2, 140, stage.diagonal],
      [stream.rimWidthPt, 2.4, 5],
      'clamp',
    );
    const spin = (frame.get() * lens.rimSpinDegPerFrame) % 360;

    return createPicture(
      (canvas) => {
        if (r < 1) return;
        const left = Math.max(0, x - r);
        const top = Math.max(0, y - r);
        const bounds = Skia.XYWHRect(
          left,
          top,
          Math.min(width, x + r) - left,
          Math.min(height, y + r) - top,
        );

        canvas.save();
        canvas.clipRRect(
          { rect: Skia.XYWHRect(x - r, y - r, r * 2, r * 2), rx: r, ry: r },
          ClipOp.Intersect,
          true,
        );
        // Blurred copy of everything under the lens.
        canvas.saveLayer(p.blur, bounds);
        canvas.drawRect(Skia.XYWHRect(0, 0, width, height), background);
        if (d !== null && o !== null && paints !== null) {
          for (let n = 0; n < o.length; n++) {
            const i = o[n];
            // Skip popping bubbles' spray: it reads as noise when blurred.
            if (d[i * STRIDE + F_POP] < 0) drawBubble(canvas, d, i, paints);
          }
        }
        if (uiSnapshot !== null) {
          canvas.drawImageRect(
            uiSnapshot,
            Skia.XYWHRect(0, 0, uiSnapshot.width(), uiSnapshot.height()),
            Skia.XYWHRect(0, 0, width, height),
            p.image,
          );
        }
        canvas.restore();
        canvas.drawRect(bounds, p.veil);
        // Glass body: the dark tint fades in over the last third so the lens becomes the label.
        if (tintAmount > 0) {
          p.tint.setAlphaf(tintAmount * lens.tintAlpha);
          canvas.drawCircle(x, y, r, p.tint);
        }
        canvas.save();
        canvas.translate(x, y);
        canvas.scale(r, r);
        canvas.drawCircle(0, 0, 1, p.sheen);
        canvas.restore();
        canvas.restore();

        // Thin-film rim, same frame, same radius.
        canvas.save();
        canvas.translate(x, y);
        canvas.rotate(spin, 0, 0);
        p.glow.setStrokeWidth(rimWidth * 3);
        p.glow.setAlphaf(0.45);
        canvas.drawCircle(0, 0, r, p.glow);
        p.rim.setStrokeWidth(rimWidth);
        canvas.drawCircle(0, 0, r - rimWidth / 2, p.rim);
        canvas.restore();
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
