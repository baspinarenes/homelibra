import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { useOffline } from '@/lib/network';
import { useOutbox } from '@/lib/outbox';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Asked on sign-out while Notes still wait in the phone's outbox (#58, spec
 * #40): signing out keeps them for this Account, but they are not sent
 * until it signs in here again. "Önce gönder" sends them and then signs
 * out; whatever cannot go (no connection, or Kaynağı silinmiş) is said, and
 * the choice stays. Tapping outside cancels.
 */
export function SignOutWarning({
  visible,
  onSignOut,
  onCancel,
}: {
  visible: boolean;
  onSignOut: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { state, drain } = useOutbox();
  const offline = useOffline();
  const [sending, setSending] = useState(false);
  const [notSent, setNotSent] = useState(false);

  const cancel = () => {
    setNotSent(false);
    onCancel();
  };
  const sendFirst = async () => {
    if (offline) return setNotSent(true);
    setSending(true);
    const left = await drain();
    setSending(false);
    if (left === 0) onSignOut();
    else setNotSent(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('outbox.cancel')}
          style={styles.dismiss}
          onPress={cancel}
        />
        <View accessibilityViewIsModal role="alertdialog" style={styles.dialog}>
          <Text style={styles.message}>{t('outbox.signOutWarning', { count: state.waiting })}</Text>
          {notSent && (
            <Text role="status" style={styles.notSent}>
              {[t('outbox.notSent', { count: state.waiting }), offline && t('outbox.needsConnection')]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
          <View style={styles.actions}>
            <SecondaryButton label={t('outbox.cancel')} onPress={cancel} disabled={sending} />
            <SecondaryButton label={t('outbox.signOutAnyway')} onPress={onSignOut} disabled={sending} />
            <PrimaryButton label={t('outbox.sendFirst')} onPress={() => void sendFirst()} busy={sending} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', padding: space.xl, backgroundColor: c.scrim },
    dismiss: { ...StyleSheet.absoluteFill },
    dialog: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      gap: space.lg,
      padding: space.xl,
      borderRadius: radius.card,
      backgroundColor: c.page,
    },
    message: { ...typeScale.body, color: c.fg },
    notSent: { ...typeScale.body, color: c.warn },
    actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: space.md },
  });
