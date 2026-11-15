import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './text';

/**
 * One part of a sheet that sets several things (Filtrele ve sırala, Filtrele): its
 * label in Turkish upper case, as a TextField's, and its control 6 under it.
 */
export function SheetField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text variant="fieldLabel">{label}</Text>
      {children}
    </View>
  );
}
