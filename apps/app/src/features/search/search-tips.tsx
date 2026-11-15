import { AnchoredPopover } from '@homelibra/ui/popover';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import Info from 'lucide-react-native/icons/info';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type Row = { term: string; description: string };

/**
 * Ara's info icon, right beside its title, and the Arama ipuçları sheet it
 * opens (#132): where search looks (Nerede arar) and how a query is written
 * (Yazım: its two operators and the short-word rule, #144), each a term at
 * the left and what it means at the right. The
 * sheet only explains, so it has no action of its own.
 */
export function SearchTips() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <HeaderIconAction icon={Info} tone="muted" label={t('search.tips')} onPress={() => setOpen(true)} />
      <Sheet visible={open} title={t('search.tips')} closeLabel={t('search.close')} onClose={close}>
        <TipsTerms />
      </Sheet>
    </>
  );
}

/**
 * A wide Ara's ? at the right of its box (#174) and Arama ipuçları under it,
 * right-aligned to it, over the list rather than in a sheet: the same two
 * lists. The screen holds `open`, so its keys wait while the tips are in
 * front. A press outside or Esc closes them.
 */
export function SearchTipsPopover({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <AnchoredPopover
      open={open}
      onOpenChange={onOpenChange}
      role="dialog"
      label={t('search.tips')}
      gap={6}
      className="w-[380px] gap-md p-lg"
      trigger={({ ref, onPress }) => (
        <Pressable
          ref={ref}
          role="button"
          aria-label={t('search.tips')}
          aria-haspopup="dialog"
          aria-expanded={open}
          onPress={onPress}
          className={cx('h-11 w-9 items-center justify-center active:opacity-70', open && 'opacity-70')}
        >
          <Text variant="button" color="muted">
            ?
          </Text>
        </Pressable>
      )}
    >
      <Text variant="label" role="heading">
        {t('search.tips')}
      </Text>
      <TipsTerms />
    </AnchoredPopover>
  );
}

/** Nerede arar and Yazım. */
function TipsTerms() {
  const { t } = useTranslation();
  return (
    <View className="gap-4.5">
      <Terms label={t('search.tipsWhere')} rows={t('search.tipsWhereRows', { returnObjects: true })} />
      <Terms label={t('search.tipsSyntax')} rows={t('search.tipsSyntaxRows', { returnObjects: true })} mono />
    </View>
  );
}

/** A labelled list of terms, a `lineSoft` rule between rows; `mono` for what is typed in the box. */
function Terms({ label, rows, mono = false }: { label: string; rows: readonly Row[]; mono?: boolean }) {
  return (
    <View className="gap-1.5">
      <Text variant="fieldLabel" role="heading">
        {label}
      </Text>
      <View role="table">
        {rows.map((row, index) => (
          <View
            key={row.term}
            role="row"
            className={cx(
              'flex-row items-start gap-3 pb-2.5',
              index > 0 ? 'border-t border-line-soft pt-2.5' : 'pt-0.5',
            )}
          >
            <Text variant={mono ? 'operator' : 'bodySmStrong'} role="rowheader" className="w-24">
              {row.term}
            </Text>
            <Text variant="bodySm" color="ink2" role="cell" className="flex-1">
              {row.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
