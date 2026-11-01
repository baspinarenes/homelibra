import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

/**
 * A short notice in ink on paper (“Tanin” silindi), with at most one action
 * (Geri al). It stands 16 in from the screen's edges; whoever holds it
 * decides how high it floats and how long it stays.
 */
export function Toast({ message, action }: { message: string; action?: { label: string; onPress: () => void } }) {
  const styles = useThemedStyles(makeStyles);
  const { shadow } = useTheme();
  return (
    <View role="status" style={[styles.toast, !action && styles.plain, { boxShadow: shadow.lift }]}>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      {action && (
        <Pressable
          role="button"
          aria-label={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    toast: {
      marginHorizontal: 16,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingTop: 6,
      paddingRight: 8,
      paddingBottom: 6,
      paddingLeft: 16,
      borderRadius: radius.control,
      backgroundColor: c.fg,
    },
    // Only a word, no action beside it.
    plain: { paddingRight: 16 },
    message: { ...typeScale.label, flex: 1, color: c.page },
    action: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 8 },
    actionLabel: { fontFamily: typeScale.action.fontFamily, fontSize: 14, lineHeight: 18, color: c.accentSoft },
    pressed: { opacity: 0.7 },
  });
