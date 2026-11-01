import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, fonts, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

/**
 * A yellow strip at the top of a screen for what waits on the scholar
 * (2 notun kaynağı silinmiş, Düzenlenecekler · 3 kaynak): one link, all of
 * it pressable, a chevron at the right. `detail` is a second line, cut with
 * "…" where it does not fit. Strips stand 8 apart.
 */
export function Strip({ title, detail, onPress }: { title: string; detail?: string; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable role="link" onPress={onPress} style={({ pressed }) => [styles.strip, pressed && styles.pressed]}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {detail !== undefined && (
          <Text style={styles.detail} numberOfLines={1}>
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
    title: { ...typeScale.body, fontFamily: fonts.sansSemiBold, color: c.warn },
    detail: { ...typeScale.caption, color: c.ink2 },
  });
