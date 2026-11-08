import { Button } from '@homelibra/ui/button';
import { Text } from '@homelibra/ui/text';
import { space } from '@homelibra/ui/theme';
import { StyleSheet, View } from 'react-native';

/**
 * What stands in the middle of an empty or failed list (`.center` on the
 * boards): a title, a line on what to do, and the button that does it (Yeni
 * dosya, Yeniden dene).
 */
export function ListMessage({
  title,
  lead,
  action,
}: {
  title?: string;
  lead: string;
  action?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'text' };
}) {
  return (
    <View style={styles.center}>
      {title && (
        <Text variant="title" style={styles.centred}>
          {title}
        </Text>
      )}
      <Text variant="body" style={styles.centred}>
        {lead}
      </Text>
      {action && (
        // Button sits at the start of its row (`alignSelf: 'flex-start'`); the wrapper is what `center` centres.
        <View>
          <Button label={action.label} onPress={action.onPress} variant={action.variant ?? 'primary'} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    paddingHorizontal: space.xxl,
    paddingVertical: space.xl,
  },
  centred: { textAlign: 'center' },
});
