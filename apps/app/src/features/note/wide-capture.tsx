import { lastCaptured } from '@homelibra/core/note';
import { Button } from '@homelibra/ui/button';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { Key, Panel } from '@homelibra/ui/panel';
import { NoteWriter } from '@homelibra/ui/note-writer';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { useShortcuts } from '@homelibra/ui/wide-layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, type TextInputInstance, View } from 'react-native';

import { captureAction } from '@/features/note/capture-keys';
import { useNoteCapture } from '@/features/note/note-capture';
import { type PickedSource, SourceChoice } from '@/features/source/source-picker';
import { SourceTypeIcon } from '@/features/source/source-type-icon';
import { TagEditor } from '@/features/tag/tag-picker';
import { useTRPC } from '@/lib/trpc';

/**
 * The Note being written in the wide frame's Not al panel (#178, Q52), held
 * by the frame, so a Note half written is still there when the panel opens
 * again. Its Kaynak starts as the Source noted last (Kaldığın yer's) each
 * time the panel opens with nothing written, and can be changed; its Konum
 * goes on from the Note captured last in that Source. Saving follows a
 * Source page's writing column (`useNoteCapture`): Alıntı, Yorum and the
 * Tags empty, Kaynak and Konum stay.
 */
export function useWideCapture() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  // The Source the Note goes to, and whether it is the one noted last, as it came.
  const [source, setSource] = useState<{ picked: PickedSource; last: boolean } | null>(null);
  // Whether the Source noted last has been asked for since the panel opened.
  const [looked, setLooked] = useState(false);
  const id = source?.picked.id ?? null;
  const notes = useQuery({ ...trpc.notes.list.queryOptions({ sourceId: id ?? '' }), enabled: id !== null });
  const capture = useNoteCapture({ sourceId: id ?? '', carriedLocator: '', onSaved: () => {} });
  // Konum goes on from the chosen Source's last Note once its Notes are in, once per Source.
  const [carriedFor, setCarriedFor] = useState<string | null>(null);
  if (id !== null && notes.data && carriedFor !== id) {
    setCarriedFor(id);
    capture.setLocator(lastCaptured(notes.data)?.locator ?? '');
  }

  return {
    ...capture,
    source,
    looked,
    canSave: id !== null && capture.hasText && !capture.busy,
    choose: (picked: PickedSource) => setSource({ picked, last: false }),
    /** Gets the writing ready as the panel opens: with nothing written, the Source noted last. */
    ready: async () => {
      if (capture.hasText) return;
      const last = await queryClient.fetchQuery(trpc.sources.lastNoted.queryOptions()).catch(() => undefined);
      if (last !== undefined) {
        setSource(last && { picked: last.source, last: true });
        // Konum goes on afresh from the Source's last Note.
        setCarriedFor(null);
      }
      setLooked(true);
    },
    save: async () => id !== null && (await capture.save()),
  };
}

export type WideCapture = ReturnType<typeof useWideCapture>;

/**
 * The frame's Not al panel beside any wide screen but a Source page (R6-
 * Final-N): Yeni Not, N her yerden and ✕ along its head; Kaynak, Konum
 * with where it goes on from, Alıntı, Yorum, the Tags and Kaydet ⌘↵ in a
 * 600 px column. It hears its own keys: ⌘↵ saves, N puts the cursor back
 * in Alıntı, Esc closes the Kaynak or Tag choice, then the panel. The
 * cursor goes to Alıntı on `focusAsk` and after each save.
 */
export function CapturePanel({
  capture,
  focusAsk,
  onClose,
}: {
  capture: WideCapture;
  focusAsk: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [choosing, setChoosing] = useState<'source' | 'tags' | null>(null);
  // With no Source to start from (no Note yet), the choice stands open.
  const choosingSource = choosing === 'source' || (capture.looked && capture.source === null);

  const excerpt = useRef<TextInputInstance>(null);
  const [focusAsked, setFocusAsked] = useState(focusAsk);
  useEffect(() => setFocusAsked(focusAsk), [focusAsk]);
  useEffect(() => {
    if (focusAsked === 0 || choosingSource) return;
    excerpt.current?.focus();
    setFocusAsked(0);
  }, [focusAsked, choosingSource]);
  const toExcerpt = () => setFocusAsked((asked) => asked + 1);

  const save = async () => {
    if (await capture.save()) toExcerpt();
  };

  useShortcuts({ panelOpen: true }, (command) => {
    const state = { writing: true, pageWrites: false, choosing: choosing !== null, canSave: capture.canSave };
    switch (captureAction(command, state)) {
      case 'save':
        void save();
        return true;
      case 'focus':
        setChoosing(null);
        toExcerpt();
        return true;
      case 'closeChoice':
        setChoosing(null);
        return true;
      case 'close':
        onClose();
        return true;
      default:
        return false;
    }
  });

  const picked = capture.source?.picked;
  const source = (
    <>
      <Pressable
        role="button"
        aria-label={picked ? `${t('wideCapture.source')}: ${picked.title}` : t('wideCapture.chooseSource')}
        aria-expanded={choosingSource}
        onPress={() => setChoosing(choosing === 'source' ? null : 'source')}
        className="min-h-11.5 flex-row items-center gap-sm rounded-control border border-line bg-surface px-3.5 py-2.5 active:opacity-70"
      >
        {picked && <SourceTypeIcon type={picked.type} color={colors.ink2} />}
        <Text variant={picked ? 'sourceTitleSm' : 'label'} className="flex-1" numberOfLines={2}>
          {picked?.title ?? t('wideCapture.chooseSource')}
        </Text>
        <Text variant="caption">
          {`${picked ? t(capture.source?.last ? 'wideCapture.lastNoted' : 'wideCapture.change') : ''} ${choosingSource ? '▴' : '▾'}`}
        </Text>
      </Pressable>
      {choosingSource && (
        <SourceChoice
          currentId={picked?.id ?? ''}
          onPick={(next) => {
            capture.choose(next);
            setChoosing(null);
            toExcerpt();
          }}
        />
      )}
    </>
  );

  const tags =
    choosing === 'tags' ? (
      <View className="gap-sm">
        <TagEditor chosen={capture.tags} onChange={capture.setTags} />
        <Button label={t('wideNoteEdit.tagsDone')} variant="small" onPress={() => setChoosing(null)} />
      </View>
    ) : (
      <ChipRow>
        {capture.tags.map((name) => (
          <Chip key={name} label={name} onPress={() => setChoosing('tags')} />
        ))}
        <Chip label={t('tags.add')} tone="add" onPress={() => setChoosing('tags')} />
      </ChipRow>
    );

  return (
    <Panel
      label={t('wideCapture.panel')}
      closeLabel={t('widePanel.close')}
      onClose={onClose}
      head={
        <Text variant="sourceTitleSm" role="heading">
          {t('capture.title')}
        </Text>
      }
      actions={
        <View className="flex-row items-center gap-1 pr-1">
          <Key keys="N" />
          <Text variant="caption">{` ${t('wideCapture.anywhere')}`}</Text>
        </View>
      }
    >
      <View className="max-w-[600px]">
        <NoteWriter
          heading={false}
          text={{ locator: capture.locator, excerpt: capture.excerpt, comment: capture.comment }}
          onTextChange={(text) => {
            capture.setLocator(text.locator);
            capture.setExcerpt(text.excerpt);
            capture.setComment(text.comment);
          }}
          locatorNote={capture.carriedOn ?? t('capture.wholeSource')}
          source={source}
          tags={tags}
          error={capture.failed ? t('capture.saveFailed') : undefined}
          canSave={capture.canSave}
          saving={capture.busy}
          onSave={() => void save()}
          excerptRef={excerpt}
          labels={{
            title: t('capture.title'),
            focusHint: t('wideSource.focusHint'),
            saveHint: t('wideSource.saveHint'),
            source: t('wideCapture.source'),
            locator: t('capture.locator'),
            locatorPlaceholder: t('capture.locatorPlaceholder'),
            excerpt: t('capture.excerpt'),
            excerptPlaceholder: t('capture.excerptPlaceholder'),
            comment: t('capture.comment'),
            commentPlaceholder: t('capture.commentPlaceholder'),
            save: t('capture.save'),
            footnote: t('wideCapture.footnote'),
          }}
        />
      </View>
    </Panel>
  );
}
