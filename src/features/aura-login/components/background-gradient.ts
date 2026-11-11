import { Skia, TileMode, type SkPaint } from '@shopify/react-native-skia';

import { aura } from '@/theme';

/**
 * Welcome gradient (analysis §3, sampled from hero-3.6s.png): lavender haze under the status
 * bar, orange, ember, maroon, then near-black from about 75% down. Drawn first in the back canvas.
 */
export function makeBackgroundPaint(height: number): SkPaint {
  const paint = Skia.Paint();
  paint.setShader(
    Skia.Shader.MakeLinearGradient(
      { x: 0, y: 0 },
      { x: 0, y: height },
      [
        aura.skyTop,
        aura.peach,
        aura.orange,
        aura.ember,
        aura.maroon,
        aura.night,
        aura.nightDeep,
      ].map((c) => Skia.Color(c)),
      [0, 0.09, 0.2, 0.4, 0.58, 0.76, 1],
      TileMode.Clamp,
    ),
  );
  return paint;
}
