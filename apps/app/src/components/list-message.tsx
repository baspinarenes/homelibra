import { Button } from '@homelibra/ui/button';
import { Text } from '@homelibra/ui/text';
import { View } from 'react-native';

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
    <View className="flex-1 items-center justify-center gap-md px-xxl py-xl">
      {title && (
        <Text variant="title" className="text-center">
          {title}
        </Text>
      )}
      <Text variant="body" className="text-center">
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
