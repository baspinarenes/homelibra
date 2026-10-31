import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Sheet } from '@homelibra/ui/sheet';
import { type Colors, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import Info from 'lucide-react-native/icons/info';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

type Row = { term: string; description: string };

/**
 * Ara's info icon, right beside its title, and the Arama ipuçları sheet it
 * opens (#132): where search looks (Nerede arar) and its two operators
 * (Yazım), each a term at the left and what it means at the right. The
 * sheet only explains, so it has no action of its own.
 */
export function SearchTips() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <HeaderIconAction icon={Info} tone="muted" label={t('search.tips')} onPress={() => setOpen(true)} />
      <Sheet visible={open} title={t('search.tips')} closeLabel={t('search.close')} onClose={close}>
        <View style={styles.sheet}>
          <Terms label={t('search.tipsWhere')} rows={t('search.tipsWhereRows', { returnObjects: true })} />
          <Terms label={t('search.tipsSyntax')} rows={t('search.tipsSyntaxRows', { returnObjects: true })} mono />
        </View>
      </Sheet>
    </>
  );
}

/** A labelled list of terms, a `lineSoft` rule between rows; `mono` for what is typed in the box. */
function Terms({ label, rows, mono = false }: { label: string; rows: readonly Row[]; mono?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text role="heading" style={styles.label}>
        {label.toLocaleUpperCase('tr')}
      </Text>
      <View role="table">
        {rows.map((row, index) => (
          <View key={row.term} role="row" style={[styles.row, index > 0 && styles.ruled]}>
            <Text role="rowheader" style={mono ? styles.code : styles.term}>
              {row.term}
            </Text>
            <Text role="cell" style={styles.description}>
              {row.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    sheet: { gap: 18 },
    field: { gap: 6 },
    label: { ...typeScale.fieldLabel, color: c.muted },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 2, paddingBottom: 10 },
    ruled: { borderTopWidth: 1, borderTopColor: c.lineSoft, paddingTop: 10 },
    term: { ...typeScale.body, ...typeScale.strong, fontSize: 14, lineHeight: 20, color: c.fg, width: 96 },
    code: { ...typeScale.locator, fontSize: 13, lineHeight: 20, color: c.ink3, width: 96 },
    description: { ...typeScale.body, fontSize: 14, lineHeight: 20, color: c.ink2, flex: 1 },
  });
