import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';

/**
 * Two or more views of one list as words over a thin rule (Okunuyor | Bitti,
 * Dosyalar | Etiketler): the open one in `fg` on a 2px `accent` underline,
 * each with its count in mono beside it. `right` sits at the row's far end.
 */
export function TextTabs<T extends string>({
  label,
  options,
  value,
  onChange,
  right,
}: {
  /** What screen readers call the tab list. */
  label: string;
  /** A count left out is not shown. */
  options: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-line">
      <View role="tablist" aria-label={label} className="flex-row gap-6">
        {options.map((option) => {
          const selected = option.value === value;
          const counted = option.count !== undefined;
          return (
            <Pressable
              key={option.value}
              role="tab"
              aria-selected={selected}
              aria-label={counted ? `${option.label} ${option.count}` : option.label}
              onPress={() => onChange(option.value)}
              // The underline sits on the row's rule.
              className={cx(
                '-mb-px flex-row items-baseline gap-1.5 border-b-2 pt-3 pb-2.75',
                selected ? 'border-accent' : 'border-transparent',
              )}
            >
              <Text variant="textTab" color={selected ? 'fg' : 'muted'}>
                {option.label}
              </Text>
              {counted && (
                <Text variant="locator" color={selected ? 'ink2' : 'muted'}>
                  {option.count}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      {right}
    </View>
  );
}
