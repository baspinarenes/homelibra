import { Button } from '@homelibra/ui/button';
import { StyleSheet, Text, View } from 'react-native';

import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * What stands in the middle of an empty or failed list: a title, a line on
 * what to do, and the button that does it (Yeni dosya, Yeniden dene).
 */
export function ListMessage({
  title,
  lead,
  action,
}: {
  title?: string;
  lead: string;
  action?: { label: string; onPress: () => void; variant?: 'primary' | 'text' };
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.center}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.lead}>{lead}</Text>
      {action && <Button label={action.label} onPress={action.onPress} variant={action.variant ?? 'primary'} />}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.md,
      paddingHorizontal: space.xxl,
      paddingVertical: space.xl,
    },
    title: { ...typeScale.sourceTitleSm, color: c.fg, textAlign: 'center' },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
  });
