import { tagName, tagSuggestKey } from '@homelibra/core/tag';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { PrimaryButton } from '@/components/primary-button';
import { useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

export type TagRef = { id: string; name: string };

/** The ⋯ at the end of an Etiketler row: opens {@link TagActions} for that Tag. */
export function TagMenuButton({ name, onPress }: { name: string; onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('tagActions.menuFor', { name })}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.more, pressed && styles.pressed]}
    >
      <Text style={styles.moreText}>⋯</Text>
    </Pressable>
  );
}

type Step =
  { kind: 'menu' } | { kind: 'rename' } | { kind: 'pick' } | { kind: 'merge'; into: TagRef } | { kind: 'delete' };

/**
 * The ⋯ menu of a Tag in Etiketler (#3, #36): Yeniden adlandır, Birleştir
 * and Sil. A rename that only changes the spelling just happens; one onto
 * another Tag's name asks, then merges. A merge cannot be taken back; a
 * delete asks with its counts and offers Geri al. Mount it with the Tag's
 * id as key, so each Tag starts at the menu.
 */
export function TagActions({ tag, onClose }: { tag: TagRef | null; onClose: () => void }) {
  const [step, setStep] = useState<Step>({ kind: 'menu' });
  if (!tag) return null;
  switch (step.kind) {
    case 'menu':
      return <Menu tag={tag} onChoose={setStep} onClose={onClose} />;
    case 'rename':
      return <Rename tag={tag} onMerge={(into) => setStep({ kind: 'merge', into })} onClose={onClose} />;
    case 'pick':
      return <PickTarget tag={tag} onPick={(into) => setStep({ kind: 'merge', into })} onClose={onClose} />;
    case 'merge':
      return <ConfirmMerge tag={tag} into={step.into} onClose={onClose} />;
    case 'delete':
      return <ConfirmDelete tag={tag} onClose={onClose} />;
  }
}

/** A Tag's name shows everywhere a Note or Source shows: everything refreshes. */
function useRefreshAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tagActions.close')}
          style={styles.dismiss}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.header}>
            <Text style={styles.heading} numberOfLines={2}>
              {title}
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>{t('tagActions.close')}</Text>
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

function Menu({ tag, onChoose, onClose }: { tag: TagRef; onChoose: (step: Step) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const items: { label: string; step: Step; danger?: boolean }[] = [
    { label: t('tagActions.rename'), step: { kind: 'rename' } },
    { label: t('tagActions.merge'), step: { kind: 'pick' } },
    { label: t('tagActions.delete'), step: { kind: 'delete' }, danger: true },
  ];
  return (
    <Sheet title={tag.name} onClose={onClose}>
      {items.map((item, index) => (
        <Pressable
          key={item.step.kind}
          accessibilityRole="button"
          onPress={() => onChoose(item.step)}
          style={({ pressed }) => [styles.item, index > 0 && styles.divided, pressed && styles.pressed]}
        >
          <Text style={[styles.itemText, item.danger && styles.danger]}>{item.label}</Text>
        </Pressable>
      ))}
    </Sheet>
  );
}

function Rename({ tag, onMerge, onClose }: { tag: TagRef; onMerge: (into: TagRef) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const trpc = useTRPC();
  const refreshAll = useRefreshAll();
  const [value, setValue] = useState(tag.name);
  const rename = useMutation(
    trpc.tags.rename.mutationOptions({
      onSuccess: async (result) => {
        if (result.outcome === 'merge') return onMerge(result.into);
        onClose();
        await refreshAll();
      },
    }),
  );
  const name = tagName(value);
  const save = () => {
    if (!name || name === tag.name) return onClose();
    rename.mutate({ id: tag.id, name });
  };

  return (
    <Sheet title={t('tagActions.renameTitle')} onClose={onClose}>
      <TextInput
        accessibilityLabel={t('tagActions.newName')}
        autoFocus
        selectTextOnFocus
        value={value}
        onChangeText={setValue}
        onSubmitEditing={save}
        submitBehavior="submit"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        placeholder={t('tagActions.newName')}
        placeholderTextColor={colors.muted2}
        style={styles.input}
      />
      <Text style={styles.hint}>{t('tagActions.renameHint')}</Text>
      {rename.isError && <Text style={styles.error}>{t('tagActions.failed')}</Text>}
      <PrimaryButton label={t('tagActions.save')} onPress={save} busy={rename.isPending} disabled={!name} />
    </Sheet>
  );
}

function PickTarget({ tag, onPick, onClose }: { tag: TagRef; onPick: (into: TagRef) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const trpc = useTRPC();
  const tags = useQuery(trpc.tags.list.queryOptions({ sort: 'name' }));
  const [filter, setFilter] = useState('');
  // As loose as the Tag picker: "hilafet" finds "Hilâfet".
  const key = tagSuggestKey(tagName(filter));
  const shown = (tags.data ?? []).filter((other) => other.id !== tag.id && tagSuggestKey(other.name).includes(key));

  return (
    <Sheet title={t('tagActions.mergeTitle', { name: tag.name })} onClose={onClose}>
      <TextInput
        accessibilityLabel={t('tagActions.filter')}
        placeholder={t('tagActions.filter')}
        placeholderTextColor={colors.muted2}
        value={filter}
        onChangeText={setFilter}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {tags.isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.status} />
      ) : tags.isError ? (
        <Text style={[styles.lead, styles.status]}>{t('tags.loadFailed')}</Text>
      ) : (
        <FlatList
          style={styles.list}
          data={shown}
          keyExtractor={(other) => other.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={[styles.lead, styles.status]}>{t('tagActions.noMatches')}</Text>}
          renderItem={({ item: other, index }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => onPick({ id: other.id, name: other.name })}
              style={({ pressed }) => [styles.row, index > 0 && styles.divided, pressed && styles.pressed]}
            >
              <Text style={styles.itemText}>{other.name}</Text>
              <Text style={styles.counts}>
                {t('tags.counts', { notes: other.noteCount, sources: other.sourceCount })}
              </Text>
            </Pressable>
          )}
        />
      )}
    </Sheet>
  );
}

function ConfirmMerge({ tag, into, onClose }: { tag: TagRef; into: TagRef; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const refreshAll = useRefreshAll();
  const merge = useMutation(
    trpc.tags.merge.mutationOptions({
      onSuccess: async (kept) => {
        onClose();
        // No Geri al for a merge (#3): only a word on how it went.
        offerUndo({ message: t('tagActions.merged', { name: kept.name }) });
        await refreshAll();
      },
    }),
  );
  return (
    <ConfirmDialog
      visible
      message={
        <>
          <Trans
            i18nKey="tagActions.confirmMerge"
            values={{ name: tag.name, into: into.name }}
            components={{ tag: <Text style={styles.strong} /> }}
          />
          {merge.isError && <Text style={styles.error}>{`\n${t('tagActions.failed')}`}</Text>}
        </>
      }
      confirmLabel={t('tagActions.confirmMergeAction')}
      cancelLabel={t('tagActions.cancel')}
      busy={merge.isPending}
      onConfirm={() => merge.mutate({ id: tag.id, intoId: into.id })}
      onCancel={onClose}
    />
  );
}

function ConfirmDelete({ tag, onClose }: { tag: TagRef; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const refreshAll = useRefreshAll();
  const impact = useQuery(trpc.tags.deleteImpact.queryOptions({ id: tag.id }, { gcTime: 0 }));
  const remove = useMutation(
    trpc.tags.delete.mutationOptions({
      onSuccess: async ({ undoToken }) => {
        onClose();
        offerServerUndo(t('tagActions.deleted', { name: tag.name }), undoToken);
        await refreshAll();
      },
    }),
  );

  const counts: string[] = [];
  if (impact.data?.notes) counts.push(t('tagActions.fromNotes', { count: impact.data.notes }));
  if (impact.data?.sources) counts.push(t('tagActions.fromSources', { count: impact.data.sources }));
  // Inside the dialog's Text: words only, no spinner.
  const message = impact.isPending ? (
    t('tagActions.counting')
  ) : impact.isError ? (
    t('tagActions.failed')
  ) : counts.length ? (
    <Trans
      i18nKey="tagActions.confirmDelete"
      values={{ name: tag.name, from: joinTr(counts, t('tagActions.and')) }}
      components={{ tag: <Text style={styles.strong} /> }}
    />
  ) : (
    <Trans
      i18nKey="tagActions.confirmDeleteUnused"
      values={{ name: tag.name }}
      components={{ tag: <Text style={styles.strong} /> }}
    />
  );

  return (
    <ConfirmDialog
      visible
      message={
        <>
          {message}
          {remove.isError && <Text style={styles.error}>{`\n${t('tagActions.failed')}`}</Text>}
        </>
      }
      confirmLabel={t('tagActions.confirmDeleteAction')}
      cancelLabel={t('tagActions.cancel')}
      busy={remove.isPending || !impact.isSuccess}
      onConfirm={() => remove.mutate({ id: tag.id })}
      onCancel={onClose}
    />
  );
}

/** "212 nottan, 3 kaynaktan ve 2 dosyadan". */
function joinTr(parts: string[], and: string) {
  if (parts.length < 2) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} ${and} ${parts[parts.length - 1]}`;
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    more: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    moreText: { ...typeScale.button, fontSize: 18, color: c.muted },
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim },
    dismiss: { ...StyleSheet.absoluteFill },
    sheet: {
      width: '100%',
      maxWidth: 560,
      maxHeight: '80%',
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
    body: { flexShrink: 1, gap: space.md, paddingHorizontal: space.lg, paddingTop: space.sm },
    item: { minHeight: 44, justifyContent: 'center', paddingVertical: space.sm },
    itemText: { ...typeScale.body, flexShrink: 1, color: c.fg },
    danger: { color: c.danger },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    pressed: { opacity: 0.7 },
    input: {
      ...typeScale.body,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    hint: { ...typeScale.caption, color: c.muted },
    error: { ...typeScale.body, color: c.danger },
    list: { flexGrow: 0 },
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: space.md,
      paddingVertical: space.md,
    },
    counts: { ...typeScale.locator, fontSize: 11.5, color: c.muted },
    status: { paddingVertical: space.xl },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    strong: { fontFamily: typeScale.button.fontFamily },
  });
