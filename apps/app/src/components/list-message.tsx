import { Button } from '@homelibra/ui/button';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { StyleSheet, Text, View } from 'react-native';

/**
 * What stands in the middle of an empty or failed list (`.center` on the
 * boards): a title, a line on what to do, and the button that does it (Yeni
 * dosya, Yeniden dene).
 */
export function ListMessage({
  title,
  large = false,
  lead,
  action,
}: {
  title?: string;
  /** The title in the larger face, where the whole screen is empty (Kaynaklar's "Henüz kaynak yok"). */
  large?: boolean;
  lead: string;
  action?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'text' };
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.center}>
      {title && <Text style={[styles.title, large && styles.large]}>{title}</Text>}
      <Text style={styles.lead}>{lead}</Text>
      {action && (
        // Button sits at the start of its row (`alignSelf: 'flex-start'`); the wrapper is what `center` centres.
        <View>
          <Button label={action.label} onPress={action.onPress} variant={action.variant ?? 'primary'} />
        </View>
      )}
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
    large: typeScale.title,
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
  });
