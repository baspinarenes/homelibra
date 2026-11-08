import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { normalizeIsbn } from '@homelibra/core/source';
import { Checkbox } from '@homelibra/ui/checkbox';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { space, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import ScanBarcode from 'lucide-react-native/icons/scan-barcode';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { IdentifierCard } from '@/components/identifier-card';
import { CoverImage } from '@/components/source-cover';
import type { Cover } from '@/lib/cover';
import { trpcClient, useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';

export type IsbnSuggestion = NonNullable<inferRouterOutputs<AppRouter>['lookups']['isbn']>;

/** Open Library's cover the scholar accepted in the form; the Source gets a copy of it on save. */
export type SuggestedCover = { isbn: string; cover: Cover };

/**
 * The Book form's ISBN card with ISBN ile öner (#40, #65, #120). Open
 * Library's fields, and its cover when it has one ("Kapak: Open Library"),
 * are shown on a suggestion sheet first; nothing reaches the form until the
 * scholar accepts them there. The accepted cover stays at the card's foot
 * until the Source is saved or the scholar drops it.
 */
export function IsbnCard({
  isbn,
  onChangeIsbn,
  onAccept,
  suggestedCover,
  onDropCover,
}: {
  /** The ISBN field as typed. */
  isbn: string;
  onChangeIsbn: (isbn: string) => void;
  onAccept: (suggestion: IsbnSuggestion, cover: SuggestedCover | null) => void;
  suggestedCover: SuggestedCover | null | undefined;
  onDropCover: () => void;
}) {
  const { t } = useTranslation();
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

  const failed = current && lookup.isError;
  // Before anything is typed, the card says what asking brings.
  const hint = !current
    ? isbn.trim() === ''
      ? t('isbn.hint')
      : null
    : lookup.isPending
      ? t('isbn.asking')
      : lookup.isError
        ? t('isbn.failed')
        : lookup.isSuccess && suggestion === null
          ? t('isbn.notFound')
          : accepted
            ? t('isbn.accepted')
            : null;

  return (
    <>
      <IdentifierCard
        label={t('sourceFields.isbn')}
        value={isbn}
        onChangeText={onChangeIsbn}
        placeholder={t('isbn.placeholder')}
        action={{
          label: failed ? t('sourceForm.identifierRetry') : t('isbn.suggest'),
          icon: ScanBarcode,
          onPress: () => {
            if (!isbn13) return;
            // Asked again for the same ISBN, the sheet comes back without a second request.
            if (current && suggestion) setOpen(true);
            else lookup.mutate(isbn13);
          },
          disabled: !isbn13,
          busy: lookup.isPending,
        }}
        hint={hint}
        alert={failed}
      >
        {suggestedCover && <AcceptedCover suggested={suggestedCover} onDrop={onDropCover} />}
      </IdentifierCard>
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
    </>
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
      <Text variant="caption">{t('isbn.lead', { isbn: suggestion.isbn })}</Text>
      <View style={styles.offer}>
        {cover && (
          <View style={styles.coverColumn}>
            <CoverImage file={cover.large} style={styles.preview} />
            <Text variant="caption">{t('isbn.coverCredit')}</Text>
          </View>
        )}
        <View style={styles.fields}>
          {rows.map(({ key, label, value }) => (
            <View key={key} style={styles.row}>
              <Text variant="micro">{label}</Text>
              <Text variant={key === 'title' ? 'sourceTitleSm' : 'body'} color={value ? 'fg' : 'muted'}>
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

/** At the ISBN card's foot after accepting: the cover the Source will get on save, until the scholar drops it. */
function AcceptedCover({ suggested, onDrop }: { suggested: SuggestedCover; onDrop: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <>
      <CoverImage file={suggested.cover.small} style={styles.thumb} />
      <Text variant="caption" color="accentFg" style={styles.acceptedText}>
        {t('isbn.coverOnSave')}
      </Text>
      <Pressable accessibilityRole="button" onPress={onDrop} hitSlop={8}>
        <Text variant="link" color="accentFg" style={styles.dropCover}>
          {t('isbn.dropCover')}
        </Text>
      </Pressable>
    </>
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

const makeStyles = () =>
  StyleSheet.create({
    offer: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-start' },
    coverColumn: { gap: 6, alignItems: 'center' },
    // 2:3, as a Cover is shown everywhere.
    preview: { width: 96, height: 144 },
    fields: { flex: 1, gap: space.md },
    row: { gap: 2 },
    thumb: { width: 40, height: 56 },
    // On the ISBN card's accent ground.
    acceptedText: { flex: 1 },
    dropCover: { textDecorationLine: 'underline' },
  });
