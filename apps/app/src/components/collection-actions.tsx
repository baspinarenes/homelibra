import { collectionToMarkdown, type MarkdownCollection } from '@homelibra/core/markdown';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * "Markdown olarak kopyala" (#12): the Notes the screen shows, in its order,
 * in the one format, no options and no preview. The text is made here from
 * what is on screen and goes to the clipboard within the tap (#7: the web
 * allows it only then), then "Kopyalandı · n not". The server only counts
 * the copy, on the side, unawaited.
 */
export function CopyMarkdownButton({ view }: { view: MarkdownCollection }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const copied = useMutation(trpc.collections.copied.mutationOptions());
  const count = view.groups.reduce((sum, group) => sum + group.notes.length, 0);

  const copy = () => {
    Clipboard.setStringAsync(collectionToMarkdown(view)).then(
      () => {
        offerUndo({ message: t('collectionActions.copied', { count }) });
        copied.mutate();
      },
      () => offerUndo({ message: t('collectionActions.copyFailed') }),
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={copy}
      disabled={count === 0}
      hitSlop={8}
      style={({ pressed }) => [styles.copy, pressed && styles.pressed, count === 0 && styles.inactive]}
    >
      <Text style={styles.copyLabel}>{t('collectionActions.copy')}</Text>
    </Pressable>
  );
}

/**
 * The ⋯ in a Collection's top bar and its menu: "Dosyayı sil", without
 * asking, with Geri al (#36). Notes and Tags stay; Geri al also brings back
 * a Tag only this Collection kept. The scholar goes back to Dosyalar, where
 * the Geri al bar shows.
 */
export function CollectionMenu({ collection }: { collection: { id: string; name: string } }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const remove = useMutation(
    trpc.collections.delete.mutationOptions({
      onSuccess: ({ undoToken }) => {
        setOpen(false);
        if (router.canGoBack()) router.back();
        else router.replace('/collections');
        offerServerUndo(t('collectionActions.deleted', { name: collection.name }), undoToken);
        // Not the view itself: it is closing, and asked again it is not found.
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.collections.list.queryKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.tags.pathKey() }),
        ]);
      },
      onError: () => {
        setOpen(false);
        offerUndo({ message: t('collectionActions.deleteFailed') });
      },
    }),
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('collectionActions.menu')}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.more, pressed && styles.pressed]}
      >
        <Text style={styles.moreText}>⋯</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('collectionActions.close')}
            style={styles.dismiss}
            onPress={() => setOpen(false)}
          />
          <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
            <View style={styles.header}>
              <Text style={styles.heading} numberOfLines={2}>
                {collection.name}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={styles.close}>{t('collectionActions.close')}</Text>
              </Pressable>
            </View>
            <View style={styles.body}>
              <Pressable
                accessibilityRole="button"
                onPress={() => remove.mutate({ id: collection.id })}
                disabled={remove.isPending}
                style={({ pressed }) => [styles.item, (pressed || remove.isPending) && styles.pressed]}
              >
                <Text style={[styles.itemText, styles.danger]}>{t('collectionActions.delete')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    copy: { minHeight: 32, justifyContent: 'center' },
    copyLabel: { ...typeScale.button, fontSize: 15, color: c.accent },
    inactive: { opacity: 0.45 },
    pressed: { opacity: 0.7 },
    more: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    moreText: { ...typeScale.button, fontSize: 18, color: c.muted },
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim },
    dismiss: { ...StyleSheet.absoluteFill },
    sheet: {
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      backgroundColor: c.page,
      borderTopLeftRadius: radius.hero,
      borderTopRightRadius: radius.hero,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.md,
      paddingHorizontal: space.lg,
      paddingTop: space.lg,
      paddingBottom: space.sm,
    },
    heading: { ...typeScale.sourceTitle, flexShrink: 1, color: c.fg },
    close: { ...typeScale.button, color: c.accent },
    body: { paddingHorizontal: space.lg, paddingTop: space.sm },
    item: { minHeight: 44, justifyContent: 'center', paddingVertical: space.sm },
    itemText: { ...typeScale.body, color: c.fg },
    danger: { color: c.danger },
  });
