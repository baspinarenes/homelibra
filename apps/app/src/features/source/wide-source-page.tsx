import type { AppRouter } from '@homelibra/api';
import { lastCaptured } from '@homelibra/core/note';
import type { ListedNote, NoteStatus } from '@homelibra/outbox';
import { Button } from '@homelibra/ui/button';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { type MenuItem, MoreMenu } from '@homelibra/ui/menu';
import { NoteDetail } from '@homelibra/ui/note-panel';
import { NoteRow } from '@homelibra/ui/note-row';
import { NoteWriter } from '@homelibra/ui/note-writer';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { useShortcuts } from '@homelibra/ui/wide-layout';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useIsFocused, useRouter } from 'expo-router';
import Search from 'lucide-react-native/icons/search';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, type PressableInstance, ScrollView, type TextInputInstance, View } from 'react-native';

import { copyNoteMarkdown, copySourceMarkdown } from '@/features/collection/collection-actions';
import { NoteEditInPlace } from '@/features/note/note-edit-in-place';
import { useNoteCapture } from '@/features/note/note-capture';
import { OutboxStatus, useShownStatus } from '@/features/note/outbox-status';
import { type Match, ShortWords, useSearchText, useSourceSearch } from '@/features/search/note-search';
import { citation } from '@/features/source/citation';
import { CoverEditor } from '@/features/source/cover-editor';
import { ReadingStatusButton } from '@/features/source/reading-status';
import { sourceAction } from '@/features/source/source-keys';
import { SourceSearchBar } from '@/features/source/source-search';
import { SourceTags } from '@/features/source/source-tags';
import { TagEditor } from '@/features/tag/tag-picker';
import { SharedUndoBar } from '@/components/undo-bar';

type Source = inferRouterOutputs<AppRouter>['sources']['get'];

// How long a Note just saved stays lit in the list, in ms, from when it is there.
const flashFor = 1600;
// Tries at placing a Note whose row is not laid out yet, and the wait between them in ms.
const scrollRetries = 5;
const scrollRetryAfter = 50;

/**
 * A Source's page on a wide screen (#177, ADR-0012): along the top its
 * heading with the künye on one line ("Künyenin tamamı ›" opens it in
 * place), the search, the Reading status, Düzenle and ⋯ (Markdown olarak
 * kopyala ⌘⇧C); under it the Notes in Locator order, in full rows; on the
 * right the 360 px writing column, always open. ⌘↵ saves the Note written
 * there: Alıntı and Yorum empty, the Locator stays as "… devam", the cursor
 * goes back to Alıntı and the new Note is lit for a moment where it landed.
 * A Note pressed in the list takes the column (Kopyala ⌘C, Düzenle E, and
 * the edit in place), "+ Yeni not" above it; Esc or N bring the writing back
 * as it was left. `write` opens with the cursor in Alıntı (Kaldığın yer),
 * `found` with that Note in the column and in view (a Note opened elsewhere).
 */
export function WideSourcePage({
  source,
  notes,
  statuses,
  write,
  found,
}: {
  source: Source;
  notes: ListedNote[];
  statuses: ReadonlyMap<string, NoteStatus>;
  write: boolean;
  found: string | undefined;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const inFront = useIsFocused();
  // The Note the column shows; null while it is the writing.
  const [shown, setShown] = useState<string | null>(() =>
    found && notes.some((note) => note.id === found) ? found : null,
  );
  const [editing, setEditing] = useState(false);
  const [choosingTags, setChoosingTags] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const search = useSearchText();
  const searched = useSourceSearch(source.id, searching ? search.query : '');
  const listed = useMemo(
    () => (searched.matches ? notes.filter((note) => searched.matches?.has(note.id)) : notes),
    [notes, searched.matches],
  );
  const shownNote = shown === null ? null : (notes.find((note) => note.id === shown) ?? null);
  // Deleted, or moved to another Source: the column goes back to the writing.
  if (shown !== null && !shownNote) {
    setShown(null);
    setEditing(false);
  }

  const list = useRef<FlatList<ListedNote>>(null);
  const rows = useRef(new Map<string, PressableInstance>());
  // The Note the list brings to the middle once its row is laid out.
  const pin = useRef<string | null>(shown);
  const retries = useRef(0);
  const scrollToPin = () => {
    const index = pin.current ? listed.findIndex((note) => note.id === pin.current) : -1;
    if (index >= 0) list.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
  };
  const reveal = (id: string) => {
    pin.current = id;
    retries.current = 0;
    scrollToPin();
    // A row already laid out is placed at once: nothing is left to hold, nor to pull the list back to later.
    if (rows.current.has(id)) pin.current = null;
  };

  // The cursor goes to Alıntı once the writing is in the column.
  const excerpt = useRef<TextInputInstance>(null);
  const [focusAsked, setFocusAsked] = useState(write);
  useEffect(() => {
    if (!focusAsked || shown !== null) return;
    excerpt.current?.focus();
    setFocusAsked(false);
  }, [focusAsked, shown]);
  const toWriting = () => {
    setShown(null);
    setEditing(false);
    setFocusAsked(true);
  };

  // The Note just saved, lit from when the list has it.
  const [flash, setFlash] = useState<string | null>(null);
  const flashListed = flash !== null && listed.some((note) => note.id === flash);
  useEffect(() => {
    if (!flashListed) return;
    const timer = setTimeout(() => setFlash(null), flashFor);
    return () => clearTimeout(timer);
  }, [flashListed]);

  const last = useMemo(() => lastCaptured(notes), [notes]);
  const capture = useNoteCapture({
    sourceId: source.id,
    carriedLocator: last?.locator ?? '',
    onSaved: (id) => {
      setFlash(id);
      reveal(id);
    },
  });
  const canSave = capture.hasText && !capture.busy;
  const save = async () => {
    if (await capture.save()) setFocusAsked(true);
  };

  const copied = { done: t('collectionActions.copied', { count: 1 }), failed: t('collectionActions.copyFailed') };
  const copyAll = () =>
    copySourceMarkdown(source, listed, {
      done: t('collectionActions.copied', { count: listed.length }),
      failed: t('collectionActions.copyFailed'),
    });
  const closeSearch = () => {
    setSearching(false);
    search.setText('');
  };
  const step = (by: 1 | -1) => {
    const at = listed.findIndex((note) => note.id === shown);
    const to = listed[at < 0 ? 0 : Math.min(listed.length - 1, Math.max(0, at + by))];
    if (!to) return;
    setShown(to.id);
    reveal(to.id);
    // The focus goes with the choice, so the keys go on from the row they chose.
    requestAnimationFrame(() => rows.current.get(to.id)?.focus());
  };

  // While a Note is edited in the column, the edit hears the keys.
  useShortcuts({ panelOpen: shown !== null, active: inFront && !menuOpen && !editing }, (command) => {
    // The Tag choice is the writing's: out of sight while a Note is shown.
    const state = {
      showing: shownNote !== null,
      choosingTags: choosingTags && !shownNote,
      searching,
      canSave,
      notes: listed.length,
    };
    switch (sourceAction(command, state)) {
      case 'save':
        void save();
        return true;
      case 'write':
        toWriting();
        return true;
      case 'edit':
        setEditing(true);
        return true;
      case 'copyNote':
        if (shownNote) copyNoteMarkdown(source, shownNote, copied);
        return true;
      case 'copyAll':
        copyAll();
        return true;
      case 'previous':
        step(-1);
        return true;
      case 'next':
        step(1);
        return true;
      case 'searchHere':
        setSearching(true);
        return true;
      case 'closeTags':
        setChoosingTags(false);
        return true;
      case 'closeSearch':
        closeSearch();
        return true;
      default:
        return false;
    }
  });

  const newNote = (
    <Pressable role="button" onPress={toWriting} hitSlop={6} className="active:opacity-70">
      <Text variant="link">{t('wideSource.newNote')}</Text>
    </Pressable>
  );

  const tags = choosingTags ? (
    <View className="gap-sm">
      <TagEditor chosen={capture.tags} onChange={capture.setTags} />
      <Button label={t('wideNoteEdit.tagsDone')} variant="small" onPress={() => setChoosingTags(false)} />
    </View>
  ) : (
    <ChipRow>
      {capture.tags.map((name) => (
        <Chip key={name} label={name} onPress={() => setChoosingTags(true)} />
      ))}
      <Chip label={t('tags.add')} tone="add" onPress={() => setChoosingTags(true)} />
    </ChipRow>
  );

  const column = shownNote ? (
    editing ? (
      <NoteEditInPlace
        id={shownNote.id}
        aside={newNote}
        onEnd={(end) => {
          setEditing(false);
          // Gone from this Source: the column has nothing to show but the writing.
          if (end && ('deleted' in end || end.saved.sourceId !== source.id)) toWriting();
        }}
      />
    ) : (
      <>
        <View className="flex-row justify-end px-gutter pt-5">{newNote}</View>
        <NoteDetail
          note={{
            locator: shownNote.locator,
            excerpt: shownNote.excerpt,
            comment: shownNote.comment,
            tags: shownNote.tags.map((tag) => tag.name),
          }}
          labels={{ copy: t('widePanel.copy'), edit: t('widePanel.edit'), openSource: t('widePanel.openSource') }}
          onCopy={() => copyNoteMarkdown(source, shownNote, copied)}
          onEdit={() => setEditing(true)}
        />
      </>
    )
  ) : (
    <NoteWriter
      text={{ locator: capture.locator, excerpt: capture.excerpt, comment: capture.comment }}
      onTextChange={(text) => {
        capture.setLocator(text.locator);
        capture.setExcerpt(text.excerpt);
        capture.setComment(text.comment);
      }}
      locatorNote={capture.carriedOn ?? t('capture.wholeSource')}
      tags={tags}
      error={capture.failed ? t('capture.saveFailed') : undefined}
      canSave={canSave}
      saving={capture.busy}
      onSave={() => void save()}
      excerptRef={excerpt}
      labels={{
        title: t('capture.title'),
        focusHint: t('wideSource.focusHint'),
        saveHint: t('wideSource.saveHint'),
        source: t('deletion.source'),
        locator: t('capture.locator'),
        locatorPlaceholder: t('capture.locatorPlaceholder'),
        excerpt: t('capture.excerpt'),
        excerptPlaceholder: t('capture.excerptPlaceholder'),
        comment: t('capture.comment'),
        commentPlaceholder: t('capture.commentPlaceholder'),
        save: t('capture.save'),
        footnote: t('wideSource.footnote'),
      }}
    />
  );

  const menuItems: MenuItem[] = [
    { label: t('collectionActions.copy'), keys: '⌘⇧C', onPress: copyAll, disabled: listed.length === 0 },
  ];
  const searchCount =
    searched.matches && !searched.failed
      ? t('noteSearch.matchCount', { shown: searched.matches.size, count: notes.length })
      : undefined;

  return (
    <View className="flex-1 flex-row bg-page">
      <Stack.Screen options={{ title: source.title, headerShown: false }} />
      <View className="min-w-0 flex-1">
        <SourceHead
          source={source}
          actions={
            <>
              <OutboxStatus />
              {!searching && (
                <HeaderIconAction icon={Search} label={t('noteSearch.inSource')} onPress={() => setSearching(true)} />
              )}
              <ReadingStatusButton sourceId={source.id} status={source.readingStatus} />
              <Button
                label={t('sourcePage.edit')}
                variant="small"
                onPress={() => router.push({ pathname: '/source/[id]/edit', params: { id: source.id } })}
              />
              <MoreMenu label={t('widePanel.more')} items={menuItems} open={menuOpen} onOpenChange={setMenuOpen} />
            </>
          }
        />
        <FlatList
          ref={list}
          className="flex-1"
          contentContainerClassName="max-w-[680px] px-3.5 pb-xxl"
          data={listed}
          extraData={[statuses, searched.matches, shown, flash]}
          keyExtractor={(note) => note.id}
          keyboardShouldPersistTaps="handled"
          onLayout={scrollToPin}
          onContentSizeChange={scrollToPin}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            list.current?.scrollToOffset({ offset: averageItemLength * index, animated: false });
            if (retries.current++ < scrollRetries) setTimeout(scrollToPin, scrollRetryAfter);
          }}
          onScrollBeginDrag={() => {
            pin.current = null;
          }}
          ListHeaderComponent={
            <View className="px-3.5 py-2.5">
              {searching ? (
                <SourceSearchBar
                  text={search.text}
                  onChange={search.setText}
                  matches={searched.matches}
                  shortWords={searched.shortWords}
                  failed={searched.failed}
                  count={searchCount}
                  onClose={closeSearch}
                />
              ) : (
                <Text variant="micro">{t('wideSource.notes', { count: notes.length })}</Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View className="gap-sm px-3.5 py-xl">
              <Text variant="body">{t(searched.matches ? 'noteSearch.sourceEmpty' : 'wideSource.empty')}</Text>
              {searched.matches && <ShortWords words={searched.shortWords} />}
            </View>
          }
          renderItem={({ item: note, index }) => (
            <SourceNoteRow
              note={note}
              divided={index > 0}
              match={searched.matches?.get(note.id)}
              status={statuses.get(note.id)}
              selected={note.id === shown}
              flash={note.id === flash}
              target={(row) => {
                if (row) rows.current.set(note.id, row);
                else rows.current.delete(note.id);
              }}
              onPress={() => {
                setShown(note.id);
                setEditing(false);
              }}
              // A Note just come in is placed by estimate until its row is measured: place it again then.
              onLayout={() => {
                if (pin.current !== note.id) return;
                setTimeout(() => {
                  scrollToPin();
                  pin.current = null;
                }, 0);
              }}
            />
          )}
        />
        {/* "Not kaydedildi · Geri al" and "Kopyalandı" float above this zero-height edge. */}
        <View pointerEvents="box-none" className="absolute right-0 bottom-0 left-0">
          <SharedUndoBar />
        </View>
      </View>
      <View
        role="region"
        aria-label={shownNote ? t('wideSource.note') : t('wideSource.writing')}
        className="w-[360px] border-l border-line bg-surface"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {column}
        </ScrollView>
      </View>
    </View>
  );
}

/**
 * The Source's heading: its Kapak, Tür, Başlık and the künye on one line,
 * "Künyenin tamamı ›" after it when there is more, which opens the whole
 * künye in place; its Tags; the page's actions at the right.
 */
function SourceHead({ source, actions }: { source: Source; actions: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { line, rows, more } = citation(source);
  const label = (key: (typeof rows)[number]['key']) => {
    switch (key) {
      case 'author':
        return t('sourceForm.author');
      case 'date':
        return t(`sourceTypes.${source.type}.dateLabel`);
      case 'bibliographicNote':
        return t('sourceForm.bibliographicNote');
      default:
        return t(`sourceFields.${key}`);
    }
  };
  const toggle = more && (
    <Pressable role="button" aria-expanded={open} onPress={() => setOpen(!open)} className="active:opacity-70">
      <Text variant="link">{open ? t('wideSource.shortCitation') : t('wideSource.fullCitation')}</Text>
    </Pressable>
  );
  return (
    <View className="gap-sm border-b border-line px-7 pt-5 pb-lg">
      <View className="flex-row items-start gap-lg">
        <CoverEditor sourceId={source.id} type={source.type} cover={source.cover} />
        <View className="min-w-0 flex-1 gap-xs">
          <Text variant="micro" color="accent">
            {t(`sourceTypes.${source.type}.label`)}
          </Text>
          <Text variant="sourceTitle" role="heading">
            {source.title}
          </Text>
          {open ? (
            <View className="gap-1 pt-1">
              {rows.map((row) => (
                <View key={row.key} className="flex-row gap-2.5">
                  <Text variant="caption" className="w-24 shrink-0">
                    {label(row.key)}
                  </Text>
                  <Text variant="bodySm" className="min-w-0 flex-1">
                    {row.value}
                  </Text>
                </View>
              ))}
              <View className="flex-row pt-1">{toggle}</View>
            </View>
          ) : (
            <View className="flex-row items-baseline gap-1.5">
              {line.length > 0 && (
                <Text variant="caption" numberOfLines={1} className="min-w-0 shrink">
                  {line.join(' · ')}
                </Text>
              )}
              {toggle}
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-1.5">{actions}</View>
      </View>
      <SourceTags sourceId={source.id} names={source.tags.map((tag) => tag.name)} />
    </View>
  );
}

/** One Note in the list: its row in full, its Tags under its texts, and where the phone's outbox has it. */
function SourceNoteRow({
  note,
  divided,
  match,
  status,
  selected,
  flash,
  target,
  onPress,
  onLayout,
}: {
  note: ListedNote;
  divided: boolean;
  match: Match | undefined;
  status: NoteStatus | undefined;
  selected: boolean;
  flash: boolean;
  target: (row: PressableInstance | null) => void;
  onPress: () => void;
  onLayout: () => void;
}) {
  const { t } = useTranslation();
  const shownStatus = useShownStatus(status);
  const names = note.tags.map((tag) => tag.name).join(', ');
  return (
    <View onLayout={onLayout}>
      <NoteRow
        ref={target}
        density="full"
        locator={note.locator}
        excerpt={note.excerpt}
        comment={note.comment}
        marks={match && { excerpt: match.excerpt, comment: match.comment }}
        why={names ? { text: names, via: 'note' } : undefined}
        meta={shownStatus && t(`outbox.${shownStatus}`)}
        selected={selected}
        flash={flash}
        divided={divided}
        hint={t('widePanel.openNote')}
        labels={{ withComment: t('widePanel.withComment') }}
        onPress={onPress}
      />
    </View>
  );
}
