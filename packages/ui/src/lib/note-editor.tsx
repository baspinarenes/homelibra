import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { cx } from './cx';
import { Key } from './panel';
import { Text } from './text';
import { TextField } from './text-field';
import { useTheme } from './use-theme';

/** A Note's words as they are being edited. */
export type NoteText = { locator: string; excerpt: string; comment: string };

/** The editor's words, in the app's language. */
export type NoteEditorLabels = {
  title: string;
  source: string;
  locator: string;
  locatorPlaceholder: string;
  excerpt: string;
  comment: string;
  cancel: string;
  save: string;
  /** Değişiklikler atılsın mı? */
  ask: string;
  discard: string;
  keepEditing: string;
  deleteNote: string;
};

type Props = {
  text: NoteText;
  onTextChange: (text: NoteText) => void;
  /** The Kaynak field, and its choice when open: what moves the Note to another Source. */
  source: ReactNode;
  /** The Note's Tags and the way to change them. */
  tags: ReactNode;
  /** Beside the title, at its right (+ Yeni not on a Source's page). */
  aside?: ReactNode;
  /** Why the Note waits, under the title, in warn ("gönderilemedi"). */
  lead?: string;
  /** What went wrong or what is missing, over the buttons, in danger. */
  error?: string;
  /** "Değişiklikler atılsın mı?" in place of Vazgeç and Kaydet. */
  asking: boolean;
  canSave: boolean;
  saving?: boolean;
  deleting?: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDiscard: () => void;
  onKeepEditing: () => void;
  onDelete: () => void;
  labels: NoteEditorLabels;
};

/**
 * A Note edited where it is open, on a wide screen (ADR-0012): the panel
 * beside a list, a Source page's column. Notu düzenle along its top, then
 * Kaynak, Konum, Alıntı, Yorum and the Tags, Vazgeç Esc and Kaydet ⌘↵ at
 * their foot, which give way to "Değişiklikler atılsın mı?" while that is
 * asked, and Notu sil under them all. It fills the width it is given.
 */
export function NoteEditor({
  text,
  onTextChange,
  source,
  tags,
  aside,
  lead,
  error,
  asking,
  canSave,
  saving = false,
  deleting = false,
  onSave,
  onCancel,
  onDiscard,
  onKeepEditing,
  onDelete,
  labels,
}: Props) {
  const busy = saving || deleting;
  return (
    <View className="gap-md px-gutter pt-5 pb-xl">
      <View className="flex-row items-center justify-between gap-md">
        <Text variant="sourceTitleSm">{labels.title}</Text>
        {aside}
      </View>
      {lead && (
        <Text variant="bodySm" color="warn">
          {lead}
        </Text>
      )}
      <View className="gap-1.5">
        <Text variant="fieldLabel">{labels.source}</Text>
        {source}
      </View>
      <TextField
        label={labels.locator}
        value={text.locator}
        onChangeText={(locator) => onTextChange({ ...text, locator })}
        placeholder={labels.locatorPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField
        label={labels.excerpt}
        value={text.excerpt}
        onChangeText={(excerpt) => onTextChange({ ...text, excerpt })}
        multiline
        excerpt
      />
      <TextField
        label={labels.comment}
        value={text.comment}
        onChangeText={(comment) => onTextChange({ ...text, comment })}
        multiline
      />
      {tags}
      {error && (
        <Text variant="bodySm" color="danger">
          {error}
        </Text>
      )}
      {asking ? (
        <View className="flex-row flex-wrap items-center justify-end gap-sm">
          <Text variant="bodySm" className="min-w-0 flex-1">
            {labels.ask}
          </Text>
          <Action label={labels.keepEditing} onPress={onKeepEditing} />
          <Action label={labels.discard} look="danger" onPress={onDiscard} />
        </View>
      ) : (
        <View className="flex-row justify-end gap-sm">
          <Action label={labels.cancel} keys="Esc" onPress={onCancel} disabled={busy} />
          <Action label={labels.save} keys="⌘↵" look="accent" onPress={onSave} disabled={!canSave} busy={saving} />
        </View>
      )}
      <Pressable
        role="button"
        aria-label={labels.deleteNote}
        aria-busy={deleting || undefined}
        aria-disabled={busy || undefined}
        disabled={busy}
        onPress={onDelete}
        className={cx('mt-sm self-start py-1 active:opacity-70', busy && 'opacity-45')}
      >
        <Text variant="button" color="danger">
          {labels.deleteNote}
        </Text>
      </Pressable>
    </View>
  );
}

const looks = {
  plain: 'border-line bg-surface',
  accent: 'border-accent bg-accent',
  danger: 'border-danger bg-danger',
} as const;

/** One of the edit's buttons, its key after its word. */
function Action({
  label,
  keys,
  look = 'plain',
  onPress,
  disabled = false,
  busy = false,
}: {
  label: string;
  keys?: string;
  look?: keyof typeof looks;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const { colors } = useTheme();
  const filled = look !== 'plain';
  const inactive = disabled || busy;
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={inactive || undefined}
      aria-busy={busy || undefined}
      disabled={inactive}
      onPress={onPress}
      className={cx(
        'min-h-8.5 flex-row items-center gap-1.5 rounded-control border px-2.5 py-1.5 active:opacity-80',
        looks[look],
        disabled && 'opacity-45',
      )}
    >
      {busy ? (
        <ActivityIndicator size="small" color={filled ? colors.accentFg : colors.accent} />
      ) : (
        <>
          <Text variant="button" color={filled ? 'accentFg' : 'fg'}>
            {label}
          </Text>
          {keys && <Key keys={keys} tone={filled ? 'onAccent' : 'muted'} />}
        </>
      )}
    </Pressable>
  );
}
