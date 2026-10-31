import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { normalizeIsbn } from '@homelibra/core/source';
import { Sheet } from '@homelibra/ui/sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Checkbox } from '@/components/checkbox';
import { CoverImage } from '@/components/source-cover';
import type { Cover } from '@/lib/cover';
import { trpcClient, useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

export type IsbnSuggestion = NonNullable<inferRouterOutputs<AppRouter>['lookups']['isbn']>;

/** Open Library's cover the scholar accepted in the form; the Source gets a copy of it on save. */
export type SuggestedCover = { isbn: string; cover: Cover };

/**
 * ISBN ile öner (#40, #65): under the Book form's ISBN field. Open Library's
 * fields, and its cover when it has one ("Kapak: Open Library"), are shown
 * on a suggestion sheet first; nothing reaches the form until the scholar
 * accepts them there.
 */
export function IsbnLookup({
  isbn,
  onAccept,
}: {
  /** The ISBN field as typed. */
  isbn: string;
  onAccept: (suggestion: IsbnSuggestion, cover: SuggestedCover | null) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const lookup = useMutation({
    mutationFn: (isbn13: string) => queryClient.fetchQuery(trpc.lookups.isbn.queryOptions({ isbn: isbn13 })),
    onMutate: () => setAccepted(false),
    onSuccess: (suggestion) => setOpen(suggestion !== null),
  });
  const isbn13 = normalizeIsbn(isbn);
  // What was said about another ISBN no longer holds.
  const current = lookup.variables === isbn13;
  const suggestion = current ? lookup.data : undefined;

  const status = !current
    ? null
    : lookup.isError
      ? t('isbn.failed')
      : lookup.isSuccess && suggestion === null
        ? t('isbn.notFound')
        : accepted
          ? t('isbn.accepted')
          : null;

  return (
    <View style={styles.lookup}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (!isbn13) return;
          // Asked again for the same ISBN, the sheet comes back without a second request.
          if (current && suggestion) setOpen(true);
          else lookup.mutate(isbn13);
        }}
        disabled={!isbn13 || lookup.isPending}
        hitSlop={6}
      >
        <Text style={[styles.action, !isbn13 && styles.inactive]}>
          {lookup.isPending ? t('isbn.asking') : t('isbn.suggest')}
        </Text>
      </Pressable>
      {status && <Text style={styles.status}>{status}</Text>}
      {suggestion && (
        <SuggestionSheet
          visible={open}
          suggestion={suggestion}
          onClose={() => setOpen(false)}
          onAccept={(withCover) => {
            setOpen(false);
            setAccepted(true);
            onAccept(
              suggestion,
              withCover && suggestion.cover ? { isbn: suggestion.isbn, cover: suggestion.cover } : null,
            );
          }}
        />
      )}
    </View>
  );
}

/** The suggestion sheet: what Open Library gives, each field labelled as the form labels it. */
function SuggestionSheet({
  visible,
  suggestion,
  onClose,
  onAccept,
}: {
  visible: boolean;
  suggestion: IsbnSuggestion;
  onClose: () => void;
  onAccept: (withCover: boolean) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const [withCover, setWithCover] = useState(true);
  const { title, author, date, fields, cover } = suggestion;
  const rows = [
    { key: 'title', label: t('sourceForm.title'), value: title },
    { key: 'author', label: t('sourceForm.author'), value: author },
    { key: 'publisher', label: t('sourceFields.publisher'), value: fields.publisher },
    { key: 'year', label: t('isbn.year'), value: date && formatDate(date) },
  ];

  return (
    <Sheet
      visible={visible}
      title={t('isbn.title')}
      closeLabel={t('isbn.close')}
      onClose={onClose}
      primary={{ label: t('isbn.accept'), onPress: () => onAccept(withCover) }}
    >
      <Text style={styles.lead}>{t('isbn.lead', { isbn: suggestion.isbn })}</Text>
      <View style={styles.offer}>
        {cover && (
          <View style={styles.coverColumn}>
            <CoverImage file={cover.large} style={styles.preview} />
            <Text style={styles.credit}>{t('isbn.coverCredit')}</Text>
          </View>
        )}
        <View style={styles.fields}>
          {rows.map(({ key, label, value }) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{label.toLocaleUpperCase('tr')}</Text>
              <Text style={[styles.value, key === 'title' && styles.titleValue, !value && styles.empty]}>
                {value ?? t('isbn.none')}
              </Text>
            </View>
          ))}
        </View>
      </View>
      {cover && <Checkbox label={t('isbn.useCover')} checked={withCover} onChange={setWithCover} />}
    </Sheet>
  );
}

/** In the form after accepting: the cover the Source will get on save, until the scholar drops it. */
export function AcceptedCover({ suggested, onDrop }: { suggested: SuggestedCover; onDrop: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.accepted}>
      <CoverImage file={suggested.cover.small} style={styles.thumb} />
      <Text style={styles.acceptedText}>{t('isbn.coverOnSave')}</Text>
      <Pressable accessibilityRole="button" onPress={onDrop} hitSlop={8}>
        <Text style={styles.action}>{t('isbn.dropCover')}</Text>
      </Pressable>
    </View>
  );
}

/**
 * After the Source is saved: gives it a copy of the Open Library cover the
 * scholar accepted. A cover that cannot be copied leaves the Source saved
 * without it, and says so.
 */
export function useGiveSuggestedCover() {
  const { t } = useTranslation();
  return async (sourceId: string, suggested: SuggestedCover | null | undefined) => {
    if (!suggested) return;
    try {
      const { undoToken } = await trpcClient.covers.setFromOpenLibrary.mutate({ sourceId, isbn: suggested.isbn });
      offerServerUndo(t('cover.replaced'), undoToken);
    } catch {
      offerUndo({ message: t('isbn.coverFailed') });
    }
  };
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    lookup: { gap: 4, marginTop: -space.sm, alignItems: 'flex-start' },
    action: { ...typeScale.button, color: c.accent },
    status: { ...typeScale.caption, color: c.muted },
    inactive: { opacity: 0.45 },
    lead: { ...typeScale.caption, color: c.muted },
    offer: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-start' },
    coverColumn: { gap: 6, alignItems: 'center' },
    // 2:3, as a Cover is shown everywhere.
    preview: { width: 96, height: 144 },
    credit: { ...typeScale.caption, color: c.muted },
    fields: { flex: 1, gap: space.md },
    row: { gap: 2 },
    label: { ...typeScale.micro, color: c.muted },
    value: { ...typeScale.body, color: c.fg },
    titleValue: { ...typeScale.sourceTitleSm },
    empty: { color: c.muted },
    accepted: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    thumb: { width: 40, height: 56 },
    acceptedText: { ...typeScale.caption, color: c.muted, flexShrink: 1 },
  });
