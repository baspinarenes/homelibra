import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { NoteRow as WideNoteRow } from '@homelibra/ui/note-row';
import { Text } from '@homelibra/ui/text';
import { Switch } from '@homelibra/ui/switch';
import { cx } from '@homelibra/ui/theme';
import type { Density } from '@homelibra/ui/wide-layout';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import { type ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  SectionList,
  View,
  type PressableInstance,
  type ViewInstance,
} from 'react-native';

import type { NoteFocus } from '@/features/collection/note-focus';
import { MarkedText, type Match, type Matches } from '@/features/search/note-search';

/** What a Collection's view and a Tag's page have in common. */
export type ViewData = Pick<
  inferRouterOutputs<AppRouter>['collections']['view'],
  'groups' | 'noteCount' | 'sourceCount' | 'sourceOnlyCount'
>;
type Group = ViewData['groups'][number];
type Note = Group['notes'][number];

/**
 * The wide tier's list beside its panel (ADR-0012): rows in `density`, the
 * one `focus` names framed, and a press opens the Note in the panel instead
 * of on its Source's page.
 */
export type WideList = {
  density: Density;
  focus: NoteFocus | null;
  onOpen: (focus: NoteFocus) => void;
  /** The keys chose `focus` (↑↓): the focus goes to its row too, so the framed row and the focused one agree. */
  focusRow?: boolean;
};

/** Room kept above a row brought into view, for the Source heading that sticks over the list. */
const STICKY_ROOM = 44;

/**
 * A Collection's view, or a Tag's page (#12 variant C): the fixed top bar
 * the caller fills, then the Notes grouped by Source in the order the API
 * gives, each Source's heading sticking under the bar while its Notes
 * scroll. The same layout on the phone and the desktop. A Source's heading
 * opens the Source page; a Note opens there, in place. While its search
 * finds Notes, `matches` marks the words they matched and the list starts
 * at the top. `underEmpty` stands under `empty` when there are none;
 * `foot` stands under the list. With `wide` it is the list beside a panel:
 * opening a Note there switches the rows to compact while the pressed row
 * stays where it was on the screen, and a row the keys move to is brought
 * into view.
 */
export function CollectionView({
  view,
  bar,
  empty,
  underEmpty,
  matches = null,
  wide,
  foot,
}: {
  view: ViewData;
  bar: ReactNode;
  empty: string;
  underEmpty?: ReactNode;
  matches?: Matches | null;
  wide?: WideList;
  foot?: ReactNode;
}) {
  const router = useRouter();
  const sections = view.groups.map((group) => ({ key: group.source.id, source: group.source, data: group.notes }));
  const list = useRef<SectionList<Note, (typeof sections)[number]>>(null);
  const frame = useRef<ViewInstance>(null);
  const rows = useRef(new Map<string, ViewInstance>());
  // Each drawn row's own press target, to put the focus on.
  const targets = useRef(new Map<string, PressableInstance>());
  const scrollY = useRef(0);
  // The pressed row and where it stood on the screen, until the rows have changed under it.
  const pressed = useRef<{ id: string; top: number } | null>(null);
  const density = wide?.density;
  const focused = wide?.focus?.noteId ?? null;

  // The search can open anywhere down the list; what it finds starts at the top.
  useEffect(() => {
    if (matches) list.current?.getScrollResponder()?.scrollTo({ y: 0, animated: false });
  }, [matches]);

  const scrollBy = (dy: number) => {
    if (Math.abs(dy) >= 1) list.current?.getScrollResponder()?.scrollTo({ y: scrollY.current + dy, animated: false });
  };

  // The rows have changed density under the pressed row: put it back where it stood.
  useEffect(() => {
    const was = pressed.current;
    if (!was) return;
    const frameId = requestAnimationFrame(() => {
      pressed.current = null;
      rows.current.get(was.id)?.measureInWindow((_x, top) => scrollBy(top - was.top));
    });
    return () => cancelAnimationFrame(frameId);
    // Only a change of density moves the rows; scrollBy reads refs.
  }, [density]);

  // A row the keys moved to comes into view and takes the focus; a pressed one already has both.
  const focusRow = wide?.focusRow ?? false;
  useEffect(() => {
    if (!focused || pressed.current) return;
    const row = rows.current.get(focused);
    if (focusRow) targets.current.get(focused)?.focus();
    if (!row) {
      // Not drawn yet, far down a long list: the list finds it and draws it.
      const sectionIndex = sections.findIndex((section) => section.data.some((note) => note.id === focused));
      const itemIndex = sections[sectionIndex]?.data.findIndex((note) => note.id === focused) ?? -1;
      if (itemIndex >= 0)
        list.current?.scrollToLocation({ sectionIndex, itemIndex, viewPosition: 0.5, animated: false });
      if (!focusRow) return;
      const frameId = requestAnimationFrame(() => targets.current.get(focused)?.focus());
      return () => cancelAnimationFrame(frameId);
    }
    frame.current?.measureInWindow((_fx, frameTop, _fw, frameHeight) =>
      row.measureInWindow((_x, top, _w, height) => {
        if (top < frameTop + STICKY_ROOM) scrollBy(top - frameTop - STICKY_ROOM);
        else if (top + height > frameTop + frameHeight) scrollBy(top + height - frameTop - frameHeight);
      }),
    );
    // Only a change of the focused Note asks for this.
  }, [focused]);

  const open = (focus: NoteFocus) => {
    if (!wide) return;
    const row = rows.current.get(focus.noteId);
    // With the panel open already the rows keep their density, and nothing moves.
    if (!row || wide.focus) return wide.onOpen(focus);
    row.measureInWindow((_x, top) => {
      pressed.current = { id: focus.noteId, top };
      wide.onOpen(focus);
    });
  };

  return (
    <View className="flex-1 bg-page">
      <View className="gap-2.5 border-b border-line px-lg pt-sm pb-md">{bar}</View>
      <View ref={frame} collapsable={false} className="flex-1">
        <SectionList
          ref={list}
          keyboardShouldPersistTaps="handled"
          className="flex-1 bg-page"
          contentContainerClassName="pb-xxl"
          sections={sections}
          keyExtractor={(note) => note.id}
          extraData={wide ? [matches, density, focused] : matches}
          stickySectionHeadersEnabled
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollY.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          onScrollToIndexFailed={() => {}}
          ListEmptyComponent={
            <View className="gap-sm p-xl">
              <Text variant="body" className="text-center">
                {empty}
              </Text>
              {underEmpty}
            </View>
          }
          renderSectionHeader={({ section }) => (
            <SourceHeading
              source={section.source}
              wide={!!wide}
              onPress={() => router.push({ pathname: '/source/[id]', params: { id: section.source.id } })}
            />
          )}
          renderItem={({ item: note, index, section }) =>
            wide ? (
              <View
                ref={(row) => {
                  if (row) rows.current.set(note.id, row);
                  else rows.current.delete(note.id);
                }}
                collapsable={false}
              >
                <WideRow
                  target={(target) => {
                    if (target) targets.current.set(note.id, target);
                    else targets.current.delete(note.id);
                  }}
                  note={note}
                  match={matches?.get(note.id)}
                  density={wide.density}
                  selected={note.id === focused}
                  divided={index > 0}
                  onPress={() => open({ sourceId: section.source.id, noteId: note.id })}
                />
              </View>
            ) : (
              <NoteRow
                note={note}
                match={matches?.get(note.id)}
                divided={index > 0}
                onPress={() =>
                  router.push({ pathname: '/source/[id]', params: { id: section.source.id, note: note.id } })
                }
              />
            )
          }
        />
      </View>
      {foot}
    </View>
  );
}

/** The wide tier's row, from @homelibra/ui, with why the Note is here in the app's words. */
function WideRow({
  target,
  note,
  match,
  density,
  selected,
  divided,
  onPress,
}: {
  target: (row: PressableInstance | null) => void;
  note: Note;
  match: Match | undefined;
  density: Density;
  selected: boolean;
  divided: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const names = note.why.tags.map((tag) => tag.name).join(', ');
  return (
    <WideNoteRow
      ref={target}
      density={density}
      locator={note.locator}
      excerpt={note.excerpt}
      comment={note.comment}
      marks={match && { excerpt: match.excerpt, comment: match.comment }}
      why={{ text: note.why.via === 'note' ? names : t('collection.viaSource', { names }), via: note.why.via }}
      selected={selected}
      divided={divided}
      hint={t('widePanel.openNote')}
      labels={{ withComment: t('widePanel.withComment') }}
      onPress={onPress}
    />
  );
}

/** Tür, `Yazar, Başlık` (in the serif on a wide screen), and on the right the Date as entered, or "tarihsiz". */
function SourceHeading({ source, wide, onPress }: { source: Group['source']; wide: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      // A button, not a link, so ↵ opens it on the web (react-native-web never presses role="link").
      accessibilityRole="button"
      accessibilityLabel={[t(`sourceTypes.${source.type}.label`), source.author, source.title]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint={t('collection.openSource')}
      onPress={onPress}
      className="flex-row items-baseline gap-sm border-b border-line bg-page px-lg pt-md pb-1.5 active:opacity-70"
    >
      <Text variant="micro" color="accent">
        {t(`sourceTypes.${source.type}.label`)}
      </Text>
      <Text variant={wide ? 'sourceTitleSm' : 'label'} className="min-w-0 flex-1" numberOfLines={1}>
        {[source.author, source.title].filter(Boolean).join(', ')}
      </Text>
      <Text variant="caption">{source.date ? formatDate(source.date) : t('collection.undated')}</Text>
    </Pressable>
  );
}

/**
 * Locator on the left (— when it has none), Excerpt and ↳ Comment on the
 * right, and under them why the Note is here: its own Tags in the
 * definition, or in another colour the Source's that brought it.
 */
function NoteRow({
  note,
  match,
  divided,
  onPress,
}: {
  note: Note;
  match: Match | undefined;
  divided: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const names = note.why.tags.map((tag) => tag.name).join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('collection.openNote')}
      onPress={onPress}
      className={cx('flex-row gap-md px-lg py-2.5 active:opacity-70', divided && 'border-t border-line-soft')}
    >
      <Text variant="locator" className="w-18 pt-0.75">
        {note.locator ?? '—'}
      </Text>
      <View className="flex-1 gap-1">
        {note.excerpt && <MarkedText text={note.excerpt} marks={match?.excerpt} variant="excerptSm" />}
        {note.comment && <MarkedText text={note.comment} marks={match?.comment} variant="commentSm" prefix="↳ " />}
        {note.why.via === 'note' ? (
          <Text variant="caption" color="chipInk">
            {names}
          </Text>
        ) : (
          <Text variant="caption" color="warn">
            {t('collection.viaSource', { names })}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/**
 * The Collection's or the Tag's name at the top of the bar, in full on as many
 * lines as it takes (#139): the header only says DOSYA or ETİKET. `onPress`
 * makes it the way to its renaming.
 */
export function ViewName({ name, onPress, hint }: { name: string; onPress?: () => void; hint?: string }) {
  // EB Garamond reaches 27 below and above at 21; the padding keeps g, ğ, y of the last line.
  const heading = (
    <Text variant="sourceTitle" className="pb-0.5">
      {name}
    </Text>
  );
  return onPress ? (
    <Pressable role="button" accessibilityHint={hint} onPress={onPress} className="active:opacity-70">
      {heading}
    </Pressable>
  ) : (
    heading
  );
}

/** "Kaynak notları" and how many Notes only a Source's Tag brings ("+5"), named in full for screen readers. */
export function SourceNotesSwitch({
  value,
  count,
  onChange,
}: {
  value: boolean;
  count: number;
  onChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-sm">
      <Text variant="caption">
        {count > 0 ? t('collection.sourceNotesShortCount', { count }) : t('collection.sourceNotesShort')}
      </Text>
      <Switch label={t('collection.sourceNotes')} value={value} onChange={onChange} />
    </View>
  );
}

/**
 * "N not · M kaynak"; while a search narrows the view, "2 / 15 not · 1 kaynak"
 * against the whole view's `of`. `aside` stands at the right of the line: the
 * source-notes switch, beside the count it changes.
 */
export function ViewCount({ view, of, aside }: { view: ViewData; of?: ViewData; aside?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between gap-md">
      <Text variant="caption" className="shrink">
        {of && of !== view
          ? t('noteSearch.viewMatchCounts', { shown: view.noteCount, notes: of.noteCount, sources: view.sourceCount })
          : t('collection.counts', { notes: view.noteCount, sources: view.sourceCount })}
      </Text>
      {aside}
    </View>
  );
}
