import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import Info from 'lucide-react-native/icons/info';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, type PressableInstance, useWindowDimensions, View } from 'react-native';

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
  const { width } = useWindowDimensions();
  const button = useRef<PressableInstance>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const show = () => {
    const at = button.current;
    if (!at) return onOpenChange(true);
    at.measureInWindow((x, y, w, h) => {
      setAnchor({ top: y + h + 6, right: Math.max(0, width - x - w) });
      onOpenChange(true);
    });
  };
  const close = () => onOpenChange(false);
  return (
    <>
      <Pressable
        ref={button}
        role="button"
        aria-label={t('search.tips')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onPress={open ? close : show}
        className={cx('h-11 w-9 items-center justify-center active:opacity-70', open && 'opacity-70')}
      >
        <Text variant="button" color="muted">
          ?
        </Text>
      </Pressable>
      <Modal visible={open} transparent onRequestClose={close}>
        <Pressable aria-hidden focusable={false} onPress={close} className="absolute inset-0" />
        <View
          role="dialog"
          aria-label={t('search.tips')}
          className="absolute w-[380px] gap-md rounded-control border border-line bg-surface p-lg shadow-lift"
          // Where the ? was measured to stand: known only once it is pressed.
          style={anchor ?? { top: 0, right: 0 }}
        >
          <Text variant="label" role="heading">
            {t('search.tips')}
          </Text>
          <TipsTerms />
        </View>
      </Modal>
    </>
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
