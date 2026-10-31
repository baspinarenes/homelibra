import { Button } from '@homelibra/ui/button';
import { StyleSheet, View } from 'react-native';

/**
 * The red action at the very foot of a form that deletes what the form
 * edits ("Notu sil", "Kaynağı sil"): a `text` Button in `danger`, its word
 * on the form's left edge.
 */
export function DangerAction({
  label,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={styles.place}>
      <Button label={label} variant="text" tone="danger" busy={busy} disabled={disabled} onPress={onPress} />
    </View>
  );
}

// The Button keeps 4 on each side of its word; this puts the word on the edge.
const styles = StyleSheet.create({ place: { marginLeft: -4 } });
