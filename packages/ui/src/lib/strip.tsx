import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { type Colors, radius } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

/**
 * A yellow strip at the top of a screen for what waits on the scholar
 * (2 notun kaynağı silinmiş): one link, all of
 * it pressable, a chevron at the right. `detail` is a second line, cut with
 * "…" where it does not fit. Strips stand 8 apart.
 */
export function Strip({ title, detail, onPress }: { title: string; detail?: string; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable role="link" onPress={onPress} style={({ pressed }) => [styles.strip, pressed && styles.pressed]}>
      <View style={styles.text}>
        <Text variant="bodyStrong" color="warn">
          {title}
        </Text>
        {detail !== undefined && (
          <Text variant="caption" color="ink2" numberOfLines={1}>
            {detail}
          </Text>
        )}
      </View>
      <ChevronRight color={colors.warn} size={18} strokeWidth={1.6} />
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 48,
      paddingTop: 10,
      paddingRight: 10,
      paddingBottom: 10,
      paddingLeft: 14,
      borderRadius: radius.control,
      backgroundColor: c.warnSoft,
    },
    pressed: { opacity: 0.7 },
    text: { flex: 1, minWidth: 0, gap: 2 },
  });
