import { locatorErase, locatorPad, pressLocatorKey } from '@homelibra/core/note';
import type { SourceType } from '@homelibra/core/source';
import Delete from 'lucide-react-native/icons/delete';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

/**
 * The writing box's Locator editor, a sheet over the Source page. Sources cited by page,
 * folio or time get a pad of the keys their Locators are written with; the
 * rest, and anything the pad cannot write, take free text. Either way the
 * Locator is stored as the text it shows.
 */
export function LocatorSheet({
  visible,
  sourceType,
  locator,
  onDone,
  onClose,
  onHidden,
}: {
  visible: boolean;
  sourceType: SourceType;
  locator: string;
  onDone: (locator: string) => void;
  onClose: () => void;
  /** Once the sheet has gone (web and iOS): the place to give focus back. */
  onHidden?: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onDismiss={onHidden}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('capture.locatorClose')}
          style={styles.dismiss}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.header}>
            <Text style={styles.heading}>{t('capture.locator')}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>{t('capture.locatorClose')}</Text>
            </Pressable>
          </View>
          {/* Mounted afresh each time, so it starts from the Locator in use. */}
          {visible && <LocatorEditor sourceType={sourceType} initial={locator} onDone={onDone} />}
        </View>
      </View>
    </Modal>
  );
}

function LocatorEditor({
  sourceType,
  initial,
  onDone,
}: {
  sourceType: SourceType;
  initial: string;
  onDone: (locator: string) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const pad = locatorPad(sourceType);
  const [locator, setLocator] = useState(initial);
  // Until the first key, the carried Locator is only shown: a digit starts a
  // new one, while erasing, a range or a folio side carries it on.
  const [fresh, setFresh] = useState(true);
  const [freeText, setFreeText] = useState(!pad);

  const press = (key: string) => {
    if (!pad) return;
    const startsNew = fresh && /^\d$/.test(key);
    setLocator(pressLocatorKey(pad, startsNew ? '' : locator, key));
    setFresh(false);
  };

  // The phone's keyboard stays down while the pad is up; on the web the
  // field takes the keyboard too, beside the pad.
  const typed = freeText || Platform.OS === 'web';

  return (
    <View style={styles.body}>
      {typed ? (
        <TextInput
          accessibilityLabel={t('capture.locator')}
          autoFocus
          selectTextOnFocus
          value={locator}
          onChangeText={(text) => {
            setLocator(text);
            setFresh(false);
          }}
          onSubmitEditing={() => onDone(locator)}
          placeholder={t('capture.locatorPlaceholder')}
          placeholderTextColor={colors.muted2}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          style={styles.input}
        />
      ) : (
        <Text
          accessibilityLabel={`${t('capture.locator')}: ${locator || t('capture.noLocator')}`}
          style={[styles.display, !locator && styles.displayEmpty, fresh && locator !== '' && styles.displayFresh]}
          numberOfLines={1}
        >
          {locator || t('capture.wholeSource')}
        </Text>
      )}
      {pad && !freeText && (
        <View style={styles.pad}>
          {[...pad.keys, locatorErase].map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === locatorErase ? t('capture.locatorErase') : key}
              onPress={() => press(key)}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            >
              {key === locatorErase ? (
                <Delete color={colors.ink2} size={20} strokeWidth={1.6} />
              ) : (
                <Text style={styles.keyLabel}>{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
      {pad && !freeText && Platform.OS !== 'web' && (
        <Pressable accessibilityRole="button" onPress={() => setFreeText(true)} style={styles.keyboard}>
          <Text style={styles.keyboardLabel}>{t('capture.locatorKeyboard')}</Text>
        </Pressable>
      )}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <SecondaryButton label={t('capture.noLocator')} onPress={() => onDone('')} />
        </View>
        <View style={styles.footerButtonWide}>
          <PrimaryButton label={t('capture.locatorDone')} onPress={() => onDone(locator)} />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
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
    display: { ...typeScale.locator, fontSize: 26, lineHeight: 34, color: c.fg, paddingVertical: space.xs },
    displayEmpty: { ...typeScale.label, fontSize: 17, lineHeight: 34, color: c.muted },
    displayFresh: { color: c.muted2 },
    input: {
      ...typeScale.locator,
      fontSize: 18,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 10,
      outlineWidth: 0,
    },
    pad: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    key: {
      // Three to a row: a third of the width less the two gaps.
      width: '31.5%',
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.button,
      backgroundColor: c.surface,
    },
    keyPressed: { backgroundColor: c.lineSoft },
    keyLabel: { ...typeScale.locator, fontSize: 21, lineHeight: 26, color: c.fg },
    keyboard: { alignSelf: 'center', paddingVertical: space.xs, paddingHorizontal: space.sm },
    keyboardLabel: { ...typeScale.label, color: c.accent },
    footer: { flexDirection: 'row', gap: space.sm, paddingTop: space.xs },
    footerButton: { flex: 1 },
    footerButtonWide: { flex: 2 },
  });
