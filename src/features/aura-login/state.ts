import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/** Phase machine. Kept as numbers so worklets can compare cheaply. */
export const Phase = {
  locked: 0,
  dragging: 1,
  revealing: 2,
  welcome: 3,
  sheetOpening: 4,
  sheet: 5,
  sheetClosing: 6,
} as const;
export type PhaseValue = (typeof Phase)[keyof typeof Phase];

export type Rect = { x: number; y: number; width: number; height: number };
export type PillId = 'signIn' | 'signUp';
export type PillFrames = { signIn: Rect; signUp: Rect };

const EMPTY_RECT: Rect = { x: 0, y: 0, width: 0, height: 0 };

/**
 * The typed shared-value contract between every layer of the screen.
 * Read with `.get()` only inside worklets and animated hooks, never during render.
 */
export type AuraState = {
  phase: SharedValue<number>;
  /** Swipe progress 0..1 (#2). */
  progress: SharedValue<number>;
  /** Finger-following dot centre while dragging. */
  dotX: SharedValue<number>;
  dotY: SharedValue<number>;
  /** Lens centre and radius in screen points (#4/#5). */
  lensX: SharedValue<number>;
  lensY: SharedValue<number>;
  lensR: SharedValue<number>;
  /** 0..1 dark tint that turns the lens into the label bubble body. */
  lensTint: SharedValue<number>;
  introOpacity: SharedValue<number>;
  headerOpacity: SharedValue<number>;
  /** Touch on the welcome scene (bubble interaction). */
  touchActive: SharedValue<number>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  touchVX: SharedValue<number>;
  touchVY: SharedValue<number>;
  /** Card morph progress 0..1 and which pill it grows from (0 = Sign in, 1 = Sign up). */
  cardProgress: SharedValue<number>;
  cardDrag: SharedValue<number>;
  morphSource: SharedValue<number>;
  pillFrames: SharedValue<PillFrames>;
  /** Incremented after every sim step; pictures redraw on it. */
  frame: SharedValue<number>;
  /** Sim pool; allocated on the UI runtime (see bubble-sim.ts). */
  sim: SharedValue<Float32Array | null>;
  order: SharedValue<Int16Array | null>;
};

export function useAuraState(): AuraState {
  return {
    phase: useSharedValue<number>(Phase.locked),
    progress: useSharedValue(0),
    dotX: useSharedValue(0),
    dotY: useSharedValue(0),
    lensX: useSharedValue(0),
    lensY: useSharedValue(0),
    lensR: useSharedValue(0),
    lensTint: useSharedValue(0),
    introOpacity: useSharedValue(1),
    headerOpacity: useSharedValue(0),
    touchActive: useSharedValue(0),
    touchX: useSharedValue(0),
    touchY: useSharedValue(0),
    touchVX: useSharedValue(0),
    touchVY: useSharedValue(0),
    cardProgress: useSharedValue(0),
    cardDrag: useSharedValue(0),
    morphSource: useSharedValue(0),
    pillFrames: useSharedValue<PillFrames>({ signIn: EMPTY_RECT, signUp: EMPTY_RECT }),
    frame: useSharedValue(0),
    sim: useSharedValue<Float32Array | null>(null),
    order: useSharedValue<Int16Array | null>(null),
  };
}

/** Screen geometry shared by every layer. */
export type Stage = {
  width: number;
  height: number;
  emitterX: number;
  emitterY: number;
  diagonal: number;
  insetTop: number;
  insetBottom: number;
};
