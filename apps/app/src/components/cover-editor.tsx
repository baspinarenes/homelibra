import type { SourceType } from '@homelibra/core/source';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverImage, SourceCover } from '@/components/source-cover';
import { type Cover, coverFiles } from '@/lib/cover';
import { useImageDrop } from '@/lib/image-drop';
import { useOffline } from '@/lib/network';
import { trpcClient, useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * The Cover in the Source page's heading (#40, "Cover"). Tapping it opens a
 * sheet to add one (camera or gallery on the phone, a file on the web),
 * change it or remove it; on the web a picture can also be dropped on it.
 * Changing and removing ask nothing and offer Geri al. Covers go online
 * only, never through the outbox.
 */
export function CoverEditor({ sourceId, type, cover }: { sourceId: string; type: SourceType; cover: Cover | null }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const offline = useOffline();
  const [open, setOpen] = useState(false);

  // The Source shows its new Cover (or its template) wherever it is listed.
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.sources.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.search.pathKey() }),
    ]);

  // The files are made on the device, then sent; replacing a Cover offers Geri al, adding one does not.
  const upload = useMutation({
    mutationFn: async (uri: string) => trpcClient.covers.set.mutate({ sourceId, ...(await coverFiles(uri)) }),
    onSuccess: async ({ undoToken }) => {
      await refresh();
      offerServerUndo(t('cover.replaced'), undoToken);
    },
    onError: () => offerUndo({ message: t('cover.failed') }),
    // A dropped file's URL (web) is no longer needed.
    onSettled: (_, __, uri) => {
      if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
    },
  });

  const remove = useMutation(
    trpc.covers.remove.mutationOptions({
      onSuccess: async ({ undoToken }) => {
        await refresh();
        offerServerUndo(t('cover.removed'), undoToken);
      },
      onError: () => offerUndo({ message: t('cover.removeFailed') }),
    }),
  );

  const busy = upload.isPending || remove.isPending;

  const take = (uri: string) => {
    setOpen(false);
    if (offline) offerUndo({ message: t('cover.needsConnection') });
    else upload.mutate(uri);
  };

  const pick = async (from: 'camera' | 'library') => {
    if (from === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setOpen(false);
        offerUndo({ message: t('cover.cameraDenied') });
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: false, quality: 1 };
    const result =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? undefined : result.assets[0];
    if (asset) take(asset.uri);
  };

  const drop = useImageDrop(take);

  return (
    <>
      <Pressable
        ref={drop.ref}
        accessibilityRole="button"
        accessibilityLabel={cover ? t('cover.change') : t('cover.add')}
        disabled={busy}
        onPress={() => (offline ? offerUndo({ message: t('cover.needsConnection') }) : setOpen(true))}
        style={({ pressed }) => [pressed && styles.pressed, drop.over && styles.dropping]}
      >
        <SourceCover type={type} cover={cover} />
        {busy && (
          <View style={styles.busy}>
            <ActivityIndicator color={styles.spinner.color} />
          </View>
        )}
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('cover.close')}
            style={styles.dismiss}
            onPress={() => setOpen(false)}
          />
          <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
            <View style={styles.header}>
              <Text style={styles.heading}>{t('cover.title')}</Text>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={styles.close}>{t('cover.close')}</Text>
              </Pressable>
            </View>
            <SheetBody
              cover={cover}
              onPick={(from) => void pick(from)}
              onDrop={take}
              onRemove={() => {
                setOpen(false);
                remove.mutate({ sourceId });
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function SheetBody({
  cover,
  onPick,
  onDrop,
  onRemove,
}: {
  cover: Cover | null;
  onPick: (from: 'camera' | 'library') => void;
  onDrop: (uri: string) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const drop = useImageDrop(onDrop);
  const web = Platform.OS === 'web';
  return (
    <View style={styles.body}>
      {web && (
        <View ref={drop.ref} style={[styles.dropZone, drop.over && styles.dropping]}>
          {cover && <CoverImage file={cover.large} style={styles.preview} />}
          <Text style={styles.hint}>{t('cover.dropHint')}</Text>
        </View>
      )}
      {!web && cover && <CoverImage file={cover.large} style={styles.preview} />}
      <View>
        {!web && <Action label={t('cover.camera')} onPress={() => onPick('camera')} />}
        <Action label={web ? t('cover.file') : t('cover.library')} onPress={() => onPick('library')} />
        {cover && <Action label={t('cover.remove')} onPress={onRemove} destructive />}
      </View>
    </View>
  );
}

function Action({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Text style={[styles.actionLabel, destructive && styles.destructive]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    pressed: { opacity: 0.7 },
    dropping: { outlineWidth: 2, outlineStyle: 'dashed', outlineColor: c.accent, outlineOffset: 3 },
    busy: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: c.scrim },
    spinner: { color: c.accent },
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
      paddingHorizontal: space.lg,
      paddingTop: space.lg,
      paddingBottom: space.sm,
    },
    heading: { ...typeScale.sourceTitle, color: c.fg },
    close: { ...typeScale.button, color: c.accent },
    body: { gap: space.md, paddingHorizontal: space.lg, paddingTop: space.sm },
    // 2:3, as the file is shown everywhere.
    preview: { width: 120, height: 180 },
    dropZone: {
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.line,
      borderRadius: radius.card,
    },
    hint: { ...typeScale.caption, color: c.muted },
    action: { paddingVertical: space.md, borderTopWidth: 1, borderTopColor: c.lineSoft },
    actionLabel: { ...typeScale.body, color: c.fg },
    destructive: { color: c.danger },
  });
