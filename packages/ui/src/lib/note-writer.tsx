import type { ReactNode, Ref } from 'react';
import { ActivityIndicator, Pressable, type TextInputInstance, View } from 'react-native';

import { cx } from './cx';
import type { NoteText } from './note-editor';
import { Key } from './panel';
import { Text } from './text';
import { TextField } from './text-field';
import { useTheme } from './use-theme';

/** The writing's words, in the app's language. */
export type NoteWriterLabels = {
  title: string;
  /** After N: "odak". */
  focusHint: string;
  /** After ⌘↵: "kaydet". */
  saveHint: string;
  source: string;
  locator: string;
  locatorPlaceholder: string;
  excerpt: string;
  excerptPlaceholder: string;
  comment: string;
  commentPlaceholder: string;
  save: string;
  /** Under Kaydet: what saving does to the fields. */
  footnote: string;
};

type Props = {
  text: NoteText;
  onTextChange: (text: NoteText) => void;
  /** Under Konum: where the next Note goes on from ("s. 201'den devam"), or that it has none. */
  locatorNote: string;
  /** The Tags for the Note being written and the way to choose them. */
  tags: ReactNode;
  /** The Kaynak field on top, where the page is not one Source's (the global Not al); none on a Source page. */
  source?: ReactNode;
  /** What went wrong, over Kaydet, in danger. */
  error?: string;
  canSave: boolean;
  saving?: boolean;
  onSave: () => void;
  /** Alıntı, which takes the cursor on N, after a save and on coming back to the writing. */
  excerptRef?: Ref<TextInputInstance>;
  /** Yeni Not and its keys along the top; false in a panel whose head already names the writing. */
  heading?: boolean;
  labels: NoteWriterLabels;
};

/**
 * The writing on a wide screen (#177, ADR-0012), on the page rather than in
 * the phone's sheet (#157): Yeni Not with N odak · ⌘↵ kaydet along its
 * top (unless a panel's head has them), then (off a Source page) Kaynak, Konum with where the next Note goes
 * on from, Alıntı, Yorum, the Tags, Kaydet ⌘↵ and what saving does. It
 * fills the width it is given; the screen holds the draft and hears the keys.
 */
export function NoteWriter({
  text,
  onTextChange,
  locatorNote,
  tags,
  source,
  error,
  canSave,
  saving = false,
  onSave,
  excerptRef,
  heading = true,
  labels,
}: Props) {
  const { colors } = useTheme();
  const inactive = !canSave || saving;
  return (
    <View className="gap-md px-gutter pt-5 pb-xl">
      {heading && (
        <View className="flex-row items-center justify-between gap-md">
          <Text variant="sourceTitleSm" role="heading">
            {labels.title}
          </Text>
          <View className="flex-row items-center gap-1">
            <Key keys="N" />
            <Text variant="caption">{` ${labels.focusHint} · `}</Text>
            <Key keys="⌘↵" />
            <Text variant="caption">{` ${labels.saveHint}`}</Text>
          </View>
        </View>
      )}
      {source && (
        <View className="gap-1.5">
          <Text variant="fieldLabel">{labels.source}</Text>
          {source}
        </View>
      )}
      <View className="gap-1">
        <TextField
          label={labels.locator}
          value={text.locator}
          onChangeText={(locator) => onTextChange({ ...text, locator })}
          placeholder={labels.locatorPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text variant="caption">{locatorNote}</Text>
      </View>
      <TextField
        inputRef={excerptRef}
        label={labels.excerpt}
        value={text.excerpt}
        onChangeText={(excerpt) => onTextChange({ ...text, excerpt })}
        placeholder={labels.excerptPlaceholder}
        multiline
        excerpt
      />
      <TextField
        label={labels.comment}
        value={text.comment}
        onChangeText={(comment) => onTextChange({ ...text, comment })}
        placeholder={labels.commentPlaceholder}
        multiline
      />
      {tags}
      {error && (
        <Text variant="bodySm" color="danger">
          {error}
        </Text>
      )}
      <Pressable
        role="button"
        aria-label={labels.save}
        aria-disabled={inactive || undefined}
        aria-busy={saving || undefined}
        disabled={inactive}
        onPress={onSave}
        className={cx(
          'min-h-9.5 flex-row items-center justify-center gap-1.5 rounded-control border border-accent bg-accent px-2.5 py-2 active:opacity-80',
          !canSave && 'opacity-45',
        )}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.accentFg} />
        ) : (
          <>
            <Text variant="button" color="accentFg">
              {labels.save}
            </Text>
            <Key keys="⌘↵" tone="onAccent" />
          </>
        )}
      </Pressable>
      <Text variant="caption">{labels.footnote}</Text>
    </View>
  );
}
