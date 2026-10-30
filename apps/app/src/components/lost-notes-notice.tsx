import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useOutbox } from '@/lib/outbox';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * "N notun kaynağı silinmiş ›" on Ana sayfa, while the phone holds Notes
 * whose Source was deleted elsewhere (#58): they wait for a new Source and
 * are never dropped unseen. Opens their list. Nothing otherwise, and never
 * on the web, which has no outbox.
 */
export function LostNotesNotice() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { status } = useOutbox().state;
  const count = [...status.values()].filter((s) => s === 'sourceGone').length;
  if (count === 0) return null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/lost-notes')}
      style={({ pressed }) => [styles.notice, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{`${t('outbox.lostNotes', { count })} ›`}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    notice: { paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: c.lineSoft },
    text: { ...typeScale.label, color: c.warn },
    pressed: { opacity: 0.7 },
  });
