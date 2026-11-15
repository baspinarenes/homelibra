import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import Info from 'lucide-react-native/icons/info';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

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
        <View className="gap-4.5">
          <Terms label={t('search.tipsWhere')} rows={t('search.tipsWhereRows', { returnObjects: true })} />
          <Terms label={t('search.tipsSyntax')} rows={t('search.tipsSyntaxRows', { returnObjects: true })} mono />
        </View>
      </Sheet>
    </>
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
