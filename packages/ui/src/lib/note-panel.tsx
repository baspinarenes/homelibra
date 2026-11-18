import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Chip, ChipRow } from './chip';
import { cx } from './cx';
import { Key, Panel } from './panel';
import { Text } from './text';

/** The Note in focus. */
export type PanelNote = {
  locator: string | null;
  excerpt: string | null;
  comment: string | null;
  /** The Note's own Tags, by name. */
  tags: readonly string[];
};

/** Another Note of the same Source; `inView` is false for one the screen's list does not hold. */
export type SiblingNote = { id: string; locator: string | null; text: string; inView: boolean };

/** Where the Note stands among its Source's Notes, in Locator order: the `n`th of `total`. */
export type NotePlace = {
  n: number;
  total: number;
  previous: { id: string; locator: string | null } | null;
  next: { id: string; locator: string | null } | null;
};

/** The panel's words, in the app's language. */
export type NotePanelLabels = {
  /** What screen readers call the panel. */
  panel: string;
  close: string;
  previous: string;
  next: string;
  /** n / m as a screen reader reads it. */
  place: (n: number, total: number) => string;
  copy: string;
  edit: string;
  openSource: string;
  siblings: string;
  /** After a sibling the screen's list does not hold: "bu dosyada değil". */
  notInView: string;
};

type Props = {
  note: PanelNote;
  /** The Source line along the top: its type and date already in words. */
  source?: { type: string; title: string; date?: string | null };
  /** ‹ before · n / m · after › in the Source. */
  place?: NotePlace;
  /** Bu kaynaktan diğer notlar. */
  siblings?: readonly SiblingNote[];
  labels: NotePanelLabels;
  /** Moves the panel to another Note of the Source (‹ ›, a sibling). */
  onGo: (id: string) => void;
  onCopy: () => void;
  onEdit: () => void;
  onOpenSource?: () => void;
  onClose: () => void;
  /** Stands in place of the Note's detail and its actions: the Note's editor. */
  children?: ReactNode;
};

/**
 * One Note in focus beside a list of Notes (a Collection, a Tag's page,
 * Ara): along the top the Source's line and ‹ › through the Source's Notes
 * with n / m, then the Note (Locator, the Excerpt large, the Comment, its
 * Tags, Kopyala ⌘C · Düzenle E · Kaynağı aç), and under it the Source's
 * other Notes, those the list does not hold faded and named so.
 */
export function NotePanel({
  note,
  source,
  place,
  siblings,
  labels,
  onGo,
  onCopy,
  onEdit,
  onOpenSource,
  onClose,
  children,
}: Props) {
  return (
    <Panel
      label={labels.panel}
      closeLabel={labels.close}
      onClose={onClose}
      head={source && <SourceLine {...source} />}
      actions={place && <PlaceWalk place={place} labels={labels} onGo={onGo} />}
    >
      {children ?? (
        <NoteDetail note={note} labels={labels} onCopy={onCopy} onEdit={onEdit} onOpenSource={onOpenSource} />
      )}
      {siblings && siblings.length > 0 && (
        <View className="border-t border-line px-xl pt-md">
          <Text variant="micro" className="pb-1.5">
            {labels.siblings}
          </Text>
          {siblings.map((sibling) => (
            <Pressable
              key={sibling.id}
              // A button, not a link: react-native-web never presses a focused role="link" div on ↵.
              role="button"
              aria-label={`${sibling.locator ?? '—'} ${sibling.text}`}
              onPress={() => onGo(sibling.id)}
              className="flex-row gap-2.5 border-t border-line-soft py-1.75 active:opacity-70"
            >
              <Text variant="locator" color={sibling.inView ? 'accent' : 'muted'} className="w-16">
                {sibling.locator ?? '—'}
              </Text>
              <Text
                variant="bodySm"
                color={sibling.inView ? 'ink2' : 'muted'}
                numberOfLines={1}
                className="min-w-0 flex-1"
              >
                {sibling.inView ? sibling.text : `${sibling.text} · ${labels.notInView}`}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Panel>
  );
}

/** Tür · Yazar, Başlık · Tarih on one line, cut at its end when it is longer. */
function SourceLine({ type, title, date }: { type: string; title: string; date?: string | null }) {
  return (
    <Text variant="bodySm" color="muted" numberOfLines={1}>
      <Text variant="micro" color="accent">
        {type}
      </Text>
      {` · ${title}`}
      {date ? ` · ${date}` : ''}
    </Text>
  );
}

function PlaceWalk({ place, labels, onGo }: { place: NotePlace; labels: NotePanelLabels; onGo: (id: string) => void }) {
  const step = (to: NotePlace['previous'], label: string, word: string) => (
    <Pressable
      role="button"
      aria-label={to?.locator ? `${label}: ${to.locator}` : label}
      aria-disabled={!to || undefined}
      disabled={!to}
      onPress={() => to && onGo(to.id)}
      className={cx('rounded-control px-1.5 py-1 active:opacity-70', !to && 'opacity-45')}
    >
      <Text variant="link" color="accent">
        {word}
      </Text>
    </Pressable>
  );
  return (
    <>
      {step(place.previous, labels.previous, place.previous?.locator ? `‹ ${place.previous.locator}` : '‹')}
      <Text variant="count" aria-label={labels.place(place.n, place.total)}>
        {`${place.n} / ${place.total}`}
      </Text>
      {step(place.next, labels.next, place.next?.locator ? `${place.next.locator} ›` : '›')}
    </>
  );
}

/**
 * The Note itself: Locator, the Excerpt large on the quote's rule, the
 * Comment, its Tags, and Kopyala ⌘C (first, on the accent), Düzenle E,
 * Kaynağı aç ›.
 */
export function NoteDetail({
  note,
  labels,
  onCopy,
  onEdit,
  onOpenSource,
}: {
  note: PanelNote;
  labels: Pick<NotePanelLabels, 'copy' | 'edit' | 'openSource'>;
  onCopy: () => void;
  onEdit: () => void;
  onOpenSource?: () => void;
}) {
  return (
    <View className="max-w-[620px] gap-3.5 px-xl pt-xl pb-5.5">
      <Text variant="locator" color="accent">
        {note.locator ?? '—'}
      </Text>
      {note.excerpt && (
        <View className="border-l-2 border-quote-bar pl-lg">
          <Text variant="excerptLg" color="quoteInk">
            {note.excerpt}
          </Text>
        </View>
      )}
      {note.comment && <Text variant="bodyLg">{note.comment}</Text>}
      {note.tags.length > 0 && (
        <ChipRow>
          {note.tags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </ChipRow>
      )}
      <View className="flex-row flex-wrap gap-sm pt-1.5">
        <Pressable
          role="button"
          aria-label={labels.copy}
          onPress={onCopy}
          className="flex-row items-center gap-1.5 rounded-control border border-accent bg-accent px-2.5 py-1.5 active:opacity-80"
        >
          <Text variant="button" color="accentFg">
            {labels.copy}
          </Text>
          <Key keys="⌘C" tone="onAccent" />
        </Pressable>
        <Pressable
          role="button"
          aria-label={labels.edit}
          onPress={onEdit}
          className="flex-row items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 py-1.5 active:opacity-80"
        >
          <Text variant="button" color="fg">
            {labels.edit}
          </Text>
          <Key keys="E" />
        </Pressable>
        {onOpenSource && (
          <Pressable
            role="button"
            aria-label={labels.openSource}
            onPress={onOpenSource}
            className="flex-row items-center rounded-control border border-line bg-surface px-2.5 py-1.5 active:opacity-80"
          >
            <Text variant="button" color="fg">
              {`${labels.openSource} ›`}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
