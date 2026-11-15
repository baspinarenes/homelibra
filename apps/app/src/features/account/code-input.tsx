import { TextField } from '@homelibra/ui/text-field';

/**
 * The six digits from an email, keeping only digits; `onSubmit` fires once
 * all six are in. The package's code TextField, focused on arrival; `label`
 * sits above it as a field's label does.
 */
export function CodeInput({
  label,
  value,
  onChange,
  onSubmit,
}: {
  label?: string;
  value: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
}) {
  return (
    <TextField
      label={label ?? ''}
      labelHidden={label === undefined}
      code
      value={value}
      onChangeText={onChange}
      placeholder="000000"
      autoFocus
      onSubmitEditing={() => value.length === 6 && onSubmit()}
    />
  );
}
