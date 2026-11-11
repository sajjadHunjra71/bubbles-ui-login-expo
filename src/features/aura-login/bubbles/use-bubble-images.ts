import { Skia, type SkImage } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { Image } from 'react-native';

import { faceSources } from '../assets/faces';
import { makeBubblePaints, type BubblePaints } from './bubble-paint';

/** Loads every face as an SkImage once, then builds the shared paints (sharp + defocused). */
export function useBubblePaints(): BubblePaints | null {
  const [paints, setPaints] = useState<BubblePaints | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const images = await Promise.all(
        faceSources.map(async (source) => {
          const resolved = Image.resolveAssetSource(source);
          if (resolved === undefined) return null;
          const data = await Skia.Data.fromURI(resolved.uri);
          return Skia.Image.MakeImageFromEncoded(data);
        }),
      );
      const ok = images.filter((img): img is SkImage => img !== null);
      if (!cancelled && ok.length > 0) setPaints(makeBubblePaints(ok));
    };
    load().catch((error: unknown) => {
      console.warn('[aura] failed to load face images', error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return paints;
}

export const FACE_COUNT = faceSources.length;
