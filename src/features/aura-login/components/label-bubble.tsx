import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { aura } from '@/theme';

import { label, reveal } from '../motion';
import type { Stage } from '../state';

function nextWord({ index }: { index: number; previous: number }) {
  return { index: (index + 1) % label.words.length, previous: index };
}

type Props = {
  stage: Stage;
  /** True from the commit until the card opens (A4: the first swap lands during the reveal). */
  cycling: boolean;
  /** Tap-to-advance only once the welcome scene is interactive. */
  tappable: boolean;
};

/**
 * #8: the SEND / RECEIVE / SWAP text that sits on the lens body. Two stacked texts crossfade
 * with a small pop. First swap 0.6 s after commit, then every 2.6 s; a tap advances and restarts.
 */
/** The parent keys this component by the run, so a replay restarts from SEND. */
export function LabelBubble({ stage, cycling, tappable }: Props) {
  const [{ index, previous }, setWords] = useState({ index: 0, previous: 0 });
  const [restartKey, setRestartKey] = useState(0);
  const swap = useSharedValue(1);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!cycling) return;
    const advance = () => setWords(nextWord);
    let interval: ReturnType<typeof setInterval> | undefined;
    const delay = firstRun.current ? label.firstSwapMs : label.intervalMs;
    firstRun.current = false;
    const timeout = setTimeout(() => {
      advance();
      interval = setInterval(advance, label.intervalMs);
    }, delay);
    return () => {
      clearTimeout(timeout);
      if (interval !== undefined) clearInterval(interval);
    };
  }, [cycling, restartKey]);

  useEffect(() => {
    if (index === previous) return;
    swap.set(0);
    swap.set(withTiming(1, { duration: label.crossfadeMs }));
  }, [index, previous, swap]);

  const outgoing = useAnimatedStyle(() => ({ opacity: 1 - swap.get() }));
  const incoming = useAnimatedStyle(() => ({
    opacity: swap.get(),
    transform: [{ scale: label.popFrom + (1 - label.popFrom) * swap.get() }],
  }));

  const size = reveal.labelDiameter;
  const onPress = () => {
    setWords(nextWord);
    setRestartKey((k) => k + 1);
  };

  return (
    <Pressable
      disabled={!tappable}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Action: ${label.words[index]}`}
      style={[
        styles.hit,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: stage.emitterX - size / 2,
          top: stage.emitterY - size / 2,
        },
      ]}
    >
      {index !== previous && (
        <Animated.Text style={[styles.word, outgoing]}>{label.words[previous]}</Animated.Text>
      )}
      <Animated.Text style={[styles.word, incoming]}>{label.words[index]}</Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  word: {
    position: 'absolute',
    color: aura.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
});
