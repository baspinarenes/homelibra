import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { Text } from '@homelibra/ui/text';
import { Switch } from '@homelibra/ui/switch';
import { cx } from '@homelibra/ui/theme';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import { type ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SectionList, View } from 'react-native';

import { MarkedText, type Match, type Matches } from '@/features/search/note-search';

/** What a Collection's view and a Tag's page have in common. */
export type ViewData = Pick<
  inferRouterOutputs<AppRouter>['collections']['view'],
  'groups' | 'noteCount' | 'sourceCount' | 'sourceOnlyCount'
>;
type Group = ViewData['groups'][number];
type Note = Group['notes'][number];

/**
 * A Collection's view, or a Tag's page (#12 variant C): the fixed top bar
 * the caller fills, then the Notes grouped by Source in the order the API
 * gives, each Source's heading sticking under the bar while its Notes
 * scroll. The same layout on the phone and the desktop. A Source's heading
 * opens the Source page; a Note opens there, in place. While its search
 * finds Notes, `matches` marks the words they matched and the list starts
 * at the top. `underEmpty` stands under `empty` when there are none.
 */
export function CollectionView({
  view,
  bar,
  empty,
  underEmpty,
  matches = null,
}: {
  view: ViewData;
  bar: ReactNode;
  empty: string;
  underEmpty?: ReactNode;
  matches?: Matches | null;
}) {
  const router = useRouter();
  const sections = view.groups.map((group) => ({ key: group.source.id, source: group.source, data: group.notes }));
  const list = useRef<SectionList<Note, (typeof sections)[number]>>(null);

  // The search can open anywhere down the list; what it finds starts at the top.
  useEffect(() => {
    if (matches) list.current?.getScrollResponder()?.scrollTo({ y: 0, animated: false });
  }, [matches]);

  return (
    <View className="flex-1 bg-page">
      <View className="gap-2.5 border-b border-line px-lg pt-sm pb-md">{bar}</View>
      <SectionList
        ref={list}
        keyboardShouldPersistTaps="handled"
        className="flex-1 bg-page"
        contentContainerClassName="pb-xxl"
        sections={sections}
        keyExtractor={(note) => note.id}
        extraData={matches}
        stickySectionHeadersEnabled
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
            onPress={() => router.push({ pathname: '/source/[id]', params: { id: section.source.id } })}
          />
        )}
        renderItem={({ item: note, index, section }) => (
          <NoteRow
            note={note}
            match={matches?.get(note.id)}
            divided={index > 0}
            onPress={() => router.push({ pathname: '/source/[id]', params: { id: section.source.id, note: note.id } })}
          />
        )}
      />
    </View>
  );
}

/** Tür, `Yazar, Başlık`, and on the right the Date as entered, or "tarihsiz". */
function SourceHeading({ source, onPress }: { source: Group['source']; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityHint={t('collection.openSource')}
      onPress={onPress}
      className="flex-row items-baseline gap-sm border-b border-line bg-page px-lg pt-md pb-1.5 active:opacity-70"
    >
      <Text variant="micro" color="accent">
        {t(`sourceTypes.${source.type}.label`)}
      </Text>
      <Text variant="label" className="min-w-0 flex-1" numberOfLines={1}>
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
