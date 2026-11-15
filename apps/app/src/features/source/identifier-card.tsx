import { Button, type IconComponent } from '@homelibra/ui/button';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import type { ReactNode } from 'react';
import { TextInput, View } from 'react-native';

/**
 * The Source form's identifier card: the ISBN (Kitap) or the DOI (Makale) on
 * an accent ground, with the action that asks Open Library or Crossref
 * beside it and what came of asking below. `children` sit under a thin line
 * at the card's foot (the accepted cover).
 */
export function IdentifierCard({
  label,
  value,
  onChangeText,
  placeholder,
  action,
  hint,
  alert = false,
  children,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  action: { label: string; icon: IconComponent; onPress: () => void; disabled: boolean; busy: boolean };
  hint?: string | null;
  /** The hint says asking failed: set heavier. */
  alert?: boolean;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View className="gap-2.5 rounded-control bg-accent px-lg py-3.5">
      <Text variant="fieldLabel" color="accentFg">
        {label}
      </Text>
      <View className="flex-row gap-sm">
        <TextInput
          aria-label={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted2}
          autoCapitalize="none"
          autoCorrect={false}
          className="type-identifier min-h-11.5 min-w-0 flex-1 rounded-control bg-surface px-3.5 py-3 text-fg"
          // Android adds its own padding above and below the line otherwise. Neither has a class.
          style={{ includeFontPadding: false, textAlignVertical: 'center' }}
        />
        {/* The button keeps its own height, centred on the input's. */}
        <View className="justify-center">
          <Button variant="small" onAccent {...action} />
        </View>
      </View>
      {hint && (
        <Text variant="caption" color="accentFg" role={alert ? 'alert' : 'status'}>
          {alert ? <Text variant="strong">{hint}</Text> : hint}
        </Text>
      )}
      {children && <View className="flex-row items-center gap-md border-t border-accent-rule pt-2.5">{children}</View>}
    </View>
  );
}

/**
 * The identifier as a wide screen's Source form panel has it (#180): its
 * name over the field like every other field, the field framed as they
 * are, its action beside it and what came of asking below, no accent card.
 */
export function IdentifierField({
  label,
  value,
  onChangeText,
  placeholder,
  action,
  hint,
  alert = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  action: { label: string; icon: IconComponent; onPress: () => void; disabled: boolean; busy: boolean };
  hint?: string | null;
  alert?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View className="gap-1.5">
      <Text variant="fieldLabel">{label}</Text>
      <View className="flex-row gap-sm">
        <TextInput
          aria-label={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted2}
          autoCapitalize="none"
          autoCorrect={false}
          className="type-identifier min-h-11.5 min-w-0 flex-1 rounded-control border border-line bg-surface px-3.5 py-3 text-fg"
          style={{ includeFontPadding: false, textAlignVertical: 'center' }}
        />
        <View className="justify-center">
          <Button variant="small" {...action} />
        </View>
      </View>
      {hint && (
        <Text variant="caption" role={alert ? 'alert' : 'status'}>
          {alert ? <Text variant="strong">{hint}</Text> : hint}
        </Text>
      )}
    </View>
  );
}
