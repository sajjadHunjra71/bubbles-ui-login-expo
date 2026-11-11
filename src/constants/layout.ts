import { Dimensions } from 'react-native';

/**
 * Window size at launch. For layouts that must react to rotation or resizing,
 * use `useWindowDimensions()` instead.
 */
export const WINDOW = Dimensions.get('window');

/** Logical width of the device the reference reel was recorded on (iPhone 15/16 Pro: 393pt). */
export const REFERENCE_WIDTH = 393;

/** Scale a measurement taken from the reference so it fits the current device width. */
export const scaleFromReference = (points: number): number =>
  (points * WINDOW.width) / REFERENCE_WIDTH;
