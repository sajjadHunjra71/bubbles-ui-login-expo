import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

/** Thin, fire-and-forget wrapper so components never await haptics. */
export function useHaptics() {
  return useMemo(
    () => ({
      light: () => {
        if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      medium: () => {
        if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
      selection: () => {
        if (enabled) void Haptics.selectionAsync();
      },
      success: () => {
        if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    }),
    [],
  );
}
