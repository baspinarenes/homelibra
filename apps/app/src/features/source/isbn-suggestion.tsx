import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { normalizeIsbn } from '@homelibra/core/source';
import { Button } from '@homelibra/ui/button';
import { Checkbox } from '@homelibra/ui/checkbox';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import ScanBarcode from 'lucide-react-native/icons/scan-barcode';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { IdentifierCard, IdentifierField } from '@/features/source/identifier-card';
import { CoverImage } from '@/features/source/source-cover';
import type { Cover } from '@/features/source/cover';
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
  const ask = useIsbnLookup(isbn);
  const { suggestion } = ask;

  return (
    <>
      <IdentifierCard
        label={t('sourceFields.isbn')}
        value={isbn}
        onChangeText={onChangeIsbn}
        placeholder={t('isbn.placeholder')}
        action={ask.action}
        hint={ask.hint}
        alert={ask.failed}
      >
        {suggestedCover && <AcceptedCover suggested={suggestedCover} onDrop={onDropCover} />}
      </IdentifierCard>
      {suggestion && (
        <SuggestionSheet
          visible={ask.open}
          suggestion={suggestion}
          onClose={() => ask.setOpen(false)}
          onAccept={(withCover) => {
            ask.accepted();
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

/**
 * The ISBN in a wide screen's Source form panel (#180, Q50): the field with
 * ISBN ile öner beside it, and what Open Library gives opened right under
 * it, in place of the phone's sheet: its cover, Başlık, Yazar, Yayınevi and
 * year, and Forma aktar, which fills the fields and takes the cover too.
 * The panel shows that cover in its Kapak column until the Source is saved.
 */
export function IsbnField({
  isbn,
  onChangeIsbn,
  onAccept,
}: {
  isbn: string;
  onChangeIsbn: (isbn: string) => void;
  onAccept: (suggestion: IsbnSuggestion, cover: SuggestedCover | null) => void;
}) {
  const { t } = useTranslation();
  const ask = useIsbnLookup(isbn);
  const { suggestion } = ask;
  return (
    <View className="gap-sm">
      <IdentifierField
        label={t('sourceFields.isbn')}
        value={isbn}
        onChangeText={onChangeIsbn}
        placeholder={t('isbn.placeholder')}
        action={ask.action}
        hint={ask.hint}
        alert={ask.failed}
      />
      {suggestion && ask.open && (
        <SuggestionCard
          suggestion={suggestion}
          onAccept={() => {
            ask.accepted();
            onAccept(suggestion, suggestion.cover ? { isbn: suggestion.isbn, cover: suggestion.cover } : null);
          }}
        />
      )}
    </View>
  );
}

/**
 * ISBN ile öner for the ISBN as typed: the button, what came of asking, and
 * Open Library's suggestion, open until the scholar accepts it (`accepted`)
 * or closes it. Nothing reaches the form before that. Asked again for the
 * same ISBN, the suggestion comes back without a second request.
 */
function useIsbnLookup(isbn: string) {
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

  return {
    suggestion,
    open,
    setOpen,
    accepted: () => {
      setOpen(false);
      setAccepted(true);
    },
    failed,
    hint,
    action: {
      label: failed ? t('sourceForm.identifierRetry') : t('isbn.suggest'),
      icon: ScanBarcode,
      onPress: () => {
        if (!isbn13) return;
        if (current && suggestion) setOpen(true);
        else lookup.mutate(isbn13);
      },
      disabled: !isbn13,
      busy: lookup.isPending,
    },
  };
}

// 2:3, as a Cover is shown everywhere.
const preview = { width: 96, height: 144 } as const;
const thumb = { width: 40, height: 56 } as const;

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
      <View className="flex-row items-start gap-lg">
        {cover && (
          <View className="items-center gap-1.5">
            <CoverImage file={cover.large} style={preview} />
            <Text variant="caption">{t('isbn.coverCredit')}</Text>
          </View>
        )}
        <View className="flex-1 gap-md">
          {rows.map(({ key, label, value }) => (
            <View key={key} className="gap-0.5">
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

const cardCover = { width: 44, height: 66 } as const;

/** The suggestion under the panel's ISBN field: Open Library's cover and fields, and Forma aktar. */
function SuggestionCard({ suggestion, onAccept }: { suggestion: IsbnSuggestion; onAccept: () => void }) {
  const { t } = useTranslation();
  const { title, author, date, fields, cover } = suggestion;
  const meta = [author, fields.publisher, date && formatDate(date)].filter(Boolean).join(' · ');
  return (
    <View
      role="group"
      aria-label={t('isbn.title')}
      className="flex-row items-center gap-md rounded-control border border-line bg-page px-md py-2.5"
    >
      {cover && <CoverImage file={cover.small} style={cardCover} />}
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="micro">{t('sourcePanel.isbnFrom')}</Text>
        <Text variant="sourceTitleSm" color={title ? 'fg' : 'muted'}>
          {title ?? t('isbn.none')}
        </Text>
        {meta !== '' && <Text variant="caption">{meta}</Text>}
        <Text variant="captionSm">{t('sourcePanel.isbnCheck')}</Text>
      </View>
      <Button label={t('isbn.accept')} onPress={onAccept} />
    </View>
  );
}

/** At the ISBN card's foot after accepting: the cover the Source will get on save, until the scholar drops it. */
function AcceptedCover({ suggested, onDrop }: { suggested: SuggestedCover; onDrop: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <CoverImage file={suggested.cover.small} style={thumb} />
      {/* On the ISBN card's accent ground. */}
      <Text variant="caption" color="accentFg" className="flex-1">
        {t('isbn.coverOnSave')}
      </Text>
      <Pressable accessibilityRole="button" onPress={onDrop} hitSlop={8}>
        <Text variant="link" color="accentFg" className="underline">
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
