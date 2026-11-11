import {
  BlendMode,
  BlurStyle,
  FilterMode,
  MipmapMode,
  PaintStyle,
  Skia,
  TileMode,
  type SkCanvas,
  type SkImage,
  type SkPaint,
} from '@shopify/react-native-skia';

import { aura } from '@/theme';

import { stream } from '../motion';
import {
  F_AGE,
  F_FACE,
  F_KIND,
  F_RADIUS,
  F_ROT,
  F_SX,
  F_SY,
  F_Z,
  KIND_FACE,
  KIND_GLASS,
  STRIDE,
  bubbleAlpha,
  defocusMix,
  perspective,
} from './bubble-sim';

/**
 * Every bubble is drawn in a local space of radius UNIT around (0, 0) and scaled with the canvas
 * matrix. That lets one shader paint per face be reused for every bubble (audit-2 B5).
 */
export const UNIT = 128;

export type BubblePaints = {
  faces: SkPaint[];
  facesSoft: SkPaint[];
  glass: SkPaint;
  rim: SkPaint;
  rimGlow: SkPaint;
  highlight: SkPaint;
  sparkle: SkPaint;
  highlightOval: ReturnType<typeof Skia.XYWHRect>;
};

const IRIDESCENT = [
  aura.iriMagenta,
  aura.iriCyan,
  aura.iriYellow,
  aura.iriLilac,
  aura.iriMint,
  aura.iriMagenta,
].map((c) => Skia.Color(c));

/** Built once on the JS thread after the face images load; captured by the picture worklets. */
export function makeBubblePaints(images: SkImage[]): BubblePaints {
  const faces = images.map((img) => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    const local = Skia.Matrix();
    // Scale the image so it covers the unit circle, centred on the origin.
    const k = (UNIT * 2) / Math.min(img.width(), img.height());
    local.translate(-UNIT, -UNIT);
    local.scale(k, k);
    p.setShader(
      img.makeShaderOptions(
        TileMode.Clamp,
        TileMode.Clamp,
        FilterMode.Linear,
        MipmapMode.None,
        local,
      ),
    );
    return p;
  });
  const facesSoft = faces.map((sharp) => {
    const p = sharp.copy();
    p.setImageFilter(Skia.ImageFilter.MakeBlur(10, 10, TileMode.Decal, null));
    return p;
  });

  // Glass body: clear centre, milky edge, a touch of warm reflection.
  const glass = Skia.Paint();
  glass.setAntiAlias(true);
  glass.setShader(
    Skia.Shader.MakeRadialGradient(
      { x: -UNIT * 0.15, y: -UNIT * 0.2 },
      UNIT * 1.15,
      [
        Skia.Color('rgba(255,255,255,0)'),
        Skia.Color('rgba(255,255,255,0.04)'),
        Skia.Color('rgba(255,236,245,0.22)'),
        Skia.Color('rgba(255,255,255,0.42)'),
      ],
      [0, 0.55, 0.82, 1],
      TileMode.Clamp,
    ),
  );

  const rim = Skia.Paint();
  rim.setAntiAlias(true);
  rim.setStyle(PaintStyle.Stroke);
  rim.setShader(Skia.Shader.MakeSweepGradient(0, 0, IRIDESCENT, null, TileMode.Clamp));

  const rimGlow = rim.copy();
  rimGlow.setBlendMode(BlendMode.Screen);
  rimGlow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 3, false));

  const highlight = Skia.Paint();
  highlight.setAntiAlias(true);
  highlight.setStyle(PaintStyle.Stroke);
  highlight.setColor(Skia.Color('rgba(255,255,255,0.85)'));
  highlight.setStrokeCap(1); // round

  const sparkle = Skia.Paint();
  sparkle.setAntiAlias(true);
  sparkle.setColor(Skia.Color(aura.white));
  sparkle.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 1.2, false));

  const inner = UNIT * 0.74;
  return {
    faces,
    facesSoft,
    glass,
    rim,
    rimGlow,
    highlight,
    sparkle,
    highlightOval: Skia.XYWHRect(-inner, -inner, inner * 2, inner * 2),
  };
}

/** Draws bubble `i` of the sim. Runs inside a picture worklet on the UI thread. */
export function drawBubble(canvas: SkCanvas, d: Float32Array, i: number, paints: BubblePaints) {
  'worklet';
  const o = i * STRIDE;
  const z = d[o + F_Z];
  const alpha = bubbleAlpha(z, d[o + F_AGE]);
  if (alpha <= 0.01) return;
  const s = perspective(Math.max(z, 0));
  const r = d[o + F_RADIUS] * s;
  const x = d[o + F_SX];
  const y = d[o + F_SY];
  const kind = d[o + F_KIND];

  if (kind !== KIND_FACE && kind !== KIND_GLASS) {
    paints.sparkle.setAlphaf(alpha * 0.75);
    canvas.drawCircle(x, y, r, paints.sparkle);
    return;
  }

  const k = r / UNIT;
  canvas.save();
  canvas.translate(x, y);
  canvas.scale(k, k);

  if (kind === KIND_FACE) {
    const face = Math.min(d[o + F_FACE], paints.faces.length - 1);
    const m = defocusMix(z);
    if (m < 1) {
      const p = paints.faces[face];
      p.setAlphaf(alpha * (1 - m));
      canvas.drawCircle(0, 0, UNIT, p);
    }
    if (m > 0) {
      const p = paints.facesSoft[face];
      p.setAlphaf(alpha * m);
      canvas.drawCircle(0, 0, UNIT, p);
    }
  }

  paints.glass.setAlphaf(alpha);
  canvas.drawCircle(0, 0, UNIT, paints.glass);

  // Thin-film rim: a rotated sweep gradient plus a soft screen-blended glow (quality ladder 1+2).
  const rimWidth = stream.rimWidthPt / k;
  canvas.save();
  canvas.rotate(d[o + F_ROT], 0, 0);
  paints.rimGlow.setStrokeWidth(rimWidth * 2.4);
  paints.rimGlow.setAlphaf(alpha * 0.55);
  canvas.drawCircle(0, 0, UNIT - rimWidth, paints.rimGlow);
  paints.rim.setStrokeWidth(rimWidth);
  paints.rim.setAlphaf(alpha * 0.95);
  canvas.drawCircle(0, 0, UNIT - rimWidth * 0.5, paints.rim);
  canvas.restore();

  // Specular highlight arc, upper left.
  paints.highlight.setStrokeWidth(Math.max(2.2 / k, UNIT * 0.035));
  paints.highlight.setAlphaf(alpha * 0.7);
  canvas.drawArc(paints.highlightOval, 200, 50, false, paints.highlight);

  canvas.restore();
}
