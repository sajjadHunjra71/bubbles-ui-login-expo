import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** Rendered behind the safe area (e.g. a GradientBackground). */
  background?: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
};

export function Screen({ children, background, edges = ['top', 'bottom'], style }: ScreenProps) {
  return (
    <View style={styles.root}>
      {background}
      <SafeAreaView edges={edges} style={[styles.content, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl },
});
