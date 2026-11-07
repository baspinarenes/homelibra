import type { SourceType } from '@homelibra/core/source';
import { Sheet, SheetAction } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { type Colors, radius, space, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import Camera from 'lucide-react-native/icons/camera';
import ImageIcon from 'lucide-react-native/icons/image';
import Trash from 'lucide-react-native/icons/trash';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { CoverImage, SourceCover } from '@/components/source-cover';
import { type Cover, coverFiles } from '@/lib/cover';
import { useImageDrop } from '@/lib/image-drop';
import { useOffline } from '@/lib/network';
import { trpcClient, useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';

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
      <Sheet visible={open} title={t('cover.title')} closeLabel={t('cover.close')} onClose={() => setOpen(false)}>
        <SheetBody
          cover={cover}
          onPick={(from) => void pick(from)}
          onDrop={take}
          onRemove={() => {
            setOpen(false);
            remove.mutate({ sourceId });
          }}
        />
      </Sheet>
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
    <>
      {web && (
        <View ref={drop.ref} style={[styles.dropZone, drop.over && styles.dropping]}>
          {cover && <CoverImage file={cover.large} style={styles.preview} />}
          <Text variant="caption">{t('cover.dropHint')}</Text>
        </View>
      )}
      {!web && cover && <CoverImage file={cover.large} style={styles.previewAlone} />}
      <View>
        {!web && <SheetAction icon={Camera} label={t('cover.camera')} onPress={() => onPick('camera')} />}
        <SheetAction
          icon={ImageIcon}
          label={web ? t('cover.file') : t('cover.library')}
          onPress={() => onPick('library')}
        />
        {cover && <SheetAction icon={Trash} label={t('cover.remove')} onPress={onRemove} destructive />}
      </View>
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    pressed: { opacity: 0.7 },
    dropping: { outlineWidth: 2, outlineStyle: 'dashed', outlineColor: c.accent, outlineOffset: 3 },
    busy: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: c.scrim },
    spinner: { color: c.accent },
    // 2:3, as the file is shown everywhere.
    preview: { width: 120, height: 180 },
    previewAlone: { width: 120, height: 180, alignSelf: 'center', marginBottom: 4 },
    dropZone: {
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.line,
      borderRadius: radius.control,
    },
  });
