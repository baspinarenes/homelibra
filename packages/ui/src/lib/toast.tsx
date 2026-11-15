import { Pressable, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';

/**
 * A short notice in ink on paper (“Tanin” silindi), with at most one action
 * (Geri al). It stands 16 in from the screen's edges; whoever holds it
 * decides how high it floats and how long it stays.
 */
export function Toast({ message, action }: { message: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View
      role="status"
      className={cx(
        'mx-4 min-h-12 flex-row items-center justify-between gap-3 rounded-control bg-fg py-1.5 pl-4 shadow-lift',
        // Only a word, no action beside it.
        action ? 'pr-2' : 'pr-4',
      )}
    >
      <Text variant="label" color="page" className="flex-1" numberOfLines={2}>
        {message}
      </Text>
      {action && (
        <Pressable
          role="button"
          aria-label={action.label}
          onPress={action.onPress}
          className="min-h-9 justify-center px-2 active:opacity-70"
        >
          <Text variant="button" color="accentSoft">
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
