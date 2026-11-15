import { type Ref, useState } from 'react';
import { Pressable, type PressableInstance, View } from 'react-native';

import { cx } from './cx';
import { Text, type Variant } from './text';
import type { Density } from './wide-layout';

/** A run of a Note's text as a search cut it; `hit` runs are the words it matched. */
export type MarkSegment = { text: string; hit: boolean };

/** Why a Note is in a view: its own Tags (`note`), or its Source's (`source`), already worded. */
export type NoteRowWhy = { text: string; via: 'note' | 'source' };

type Props = {
  /** `full`: Excerpt and Comment whole; `compact`: one line, while a panel is open beside the list. */
  density: Density;
  locator: string | null;
  excerpt: string | null;
  comment: string | null;
  /** The runs a search found in the Excerpt and the Comment, the matched words marked. */
  marks?: { excerpt?: readonly MarkSegment[] | null; comment?: readonly MarkSegment[] | null };
  /** Under the texts in `full` only. */
  why?: NoteRowWhy;
  /** The Note the panel shows. */
  selected?: boolean;
  /** A line above it, parting it from the Note before it under the same Source. */
  divided?: boolean;
  onPress: () => void;
  /** The row itself, so a screen can put the focus on the row its keys chose. */
  ref?: Ref<PressableInstance>;
  /** What screen readers hear the press does. */
  hint?: string;
  labels: {
    /** After a compact row's Excerpt when the Note has a Comment too: "+ yorum". */
    withComment: string;
  };
};

/**
 * One Note in a list of Notes (a Collection, a Tag's page, Ara, the lost
 * Notes): the Locator on the left (— when it has none), and in `full` the
 * Excerpt and ↳ the Comment whole with why the Note is here under them; in
 * `compact` one line of the Excerpt, or of the Comment when there is no
 * Excerpt, + yorum marked when the search matched the Comment hidden
 * behind it. The row the panel shows is framed in the accent; a row under
 * the pointer takes the chip's ground.
 */
export function NoteRow({
  density,
  locator,
  excerpt,
  comment,
  marks,
  why,
  selected = false,
  divided = false,
  onPress,
  hint,
  labels,
  ref,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const compact = density === 'compact';
  // Both states have a 2px frame, so choosing a row never moves the rows under it.
  const frame = selected
    ? 'border-2 border-accent bg-accent-soft'
    : hovered
      ? 'border-2 border-transparent bg-chip-bg'
      : 'border-2 border-transparent';
  return (
    <View className={cx(divided && 'border-t border-line-soft')}>
      <Pressable
        ref={ref}
        role="button"
        aria-current={selected || undefined}
        accessibilityHint={hint}
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        className={cx(
          'flex-row active:opacity-70',
          compact ? 'items-baseline gap-2.5 px-4.5 py-1' : 'gap-md px-3.5 py-2',
          frame,
        )}
      >
        <Text variant="locator" color="accent" className={compact ? 'w-18' : 'w-18 pt-1'}>
          {locator ?? '—'}
        </Text>
        {compact ? (
          <>
            <Marked
              text={excerpt ?? comment ?? ''}
              marks={excerpt ? marks?.excerpt : marks?.comment}
              variant={excerpt ? 'excerptSm' : 'commentSm'}
              oneLine
            />
            {excerpt &&
              comment &&
              // The words the search matched in the Comment are off this line: + yorum takes the mark for them.
              (hits(comment, marks?.comment) ? (
                <Text variant="count" color="fg" className="shrink-0 bg-mark">
                  {labels.withComment}
                </Text>
              ) : (
                <Text variant="count" className="shrink-0">
                  {labels.withComment}
                </Text>
              ))}
          </>
        ) : (
          <View className="min-w-0 flex-1 gap-1">
            {excerpt && (
              <View className="border-l-2 border-quote-bar pl-md">
                <Marked text={excerpt} marks={marks?.excerpt} variant="excerpt" />
              </View>
            )}
            {comment && <Marked text={comment} marks={marks?.comment} variant="comment" prefix={excerpt ? '↳ ' : ''} />}
            {why && (
              <Text variant="caption" color={why.via === 'note' ? 'chipInk' : 'warn'}>
                {why.text}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

/** The marks still spell `text` (the Note has not changed since the search) and one of them is a hit. */
function hits(text: string, marks: readonly MarkSegment[] | null | undefined) {
  return !!marks && marks.map((segment) => segment.text).join('') === text && marks.some((segment) => segment.hit);
}

/** The text with its matched words on the mark's ground; marks that no longer spell it are left out. */
function Marked({
  text,
  marks,
  variant,
  prefix = '',
  oneLine = false,
}: {
  text: string;
  marks: readonly MarkSegment[] | null | undefined;
  variant: Extract<Variant, 'excerpt' | 'excerptSm' | 'comment' | 'commentSm'>;
  prefix?: string;
  oneLine?: boolean;
}) {
  const current = marks && marks.map((segment) => segment.text).join('') === text ? marks : null;
  return (
    <Text variant={variant} numberOfLines={oneLine ? 1 : undefined} className={oneLine ? 'min-w-0 flex-1' : undefined}>
      {prefix}
      {current
        ? current.map((segment, i) =>
            segment.hit ? (
              <Text key={i} variant={variant} color="fg" className="bg-mark">
                {segment.text}
              </Text>
            ) : (
              segment.text
            ),
          )
        : text}
    </Text>
  );
}
