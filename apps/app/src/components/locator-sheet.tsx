import { locatorErase, locatorPad, pressLocatorKey } from '@homelibra/core/note';
import type { SourceType } from '@homelibra/core/source';
import { Sheet } from '@homelibra/ui/sheet';
import { TextField } from '@homelibra/ui/text-field';
import { type Colors, radius, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import Delete from 'lucide-react-native/icons/delete';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * The writing box's Locator editor, a sheet over the Source page. Sources cited by page,
 * folio or time get a pad of the keys their Locators are written with; the
 * rest, and anything the pad cannot write, take free text. Either way the
 * Locator is stored as the text it shows, and Konum yok | Tamam stand at the foot.
 */
export function LocatorSheet({
  visible,
  sourceType,
  locator: initial,
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
  const { colors } = useTheme();
  const pad = locatorPad(sourceType);
  const [locator, setLocator] = useState(initial);
  // Until the first key, the carried Locator is only shown: a digit starts a
  // new one, while erasing, a range or a folio side carries it on.
  const [fresh, setFresh] = useState(true);
  const [freeText, setFreeText] = useState(!pad);
  // Each opening starts from the Locator in use, on the pad if the Source has one.
  const [open, setOpen] = useState(visible);
  if (open !== visible) {
    setOpen(visible);
    if (visible) {
      setLocator(initial);
      setFresh(true);
      setFreeText(!pad);
    }
  }

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
    <Sheet
      visible={visible}
      title={t('capture.locator')}
      closeLabel={t('capture.locatorClose')}
      onClose={onClose}
      onHidden={onHidden}
      secondary={{ label: t('capture.noLocator'), onPress: () => onDone('') }}
      primary={{ label: t('capture.locatorDone'), onPress: () => onDone(locator) }}
    >
      {typed ? (
        <TextField
          label={t('capture.locator')}
          labelHidden
          autoFocus
          selectTextOnFocus
          value={locator}
          onChangeText={(text) => {
            setLocator(text);
            setFresh(false);
          }}
          onSubmitEditing={() => onDone(locator)}
          placeholder={t('capture.locatorPlaceholder')}
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
    </Sheet>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    display: {
      ...typeScale.locator,
      fontSize: 26,
      lineHeight: 34,
      color: c.fg,
      textAlign: 'center',
      paddingVertical: 6,
    },
    displayEmpty: { ...typeScale.label, fontSize: 17, lineHeight: 34, color: c.muted },
    displayFresh: { color: c.muted2 },
    input: { ...typeScale.locator, fontSize: 18, lineHeight: 24 },
    pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    key: {
      // Three to a row: a third of the width less the two gaps.
      width: '31.5%',
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.control,
      backgroundColor: c.surface,
    },
    keyPressed: { backgroundColor: c.lineSoft },
    keyLabel: { ...typeScale.locator, fontSize: 21, lineHeight: 26, color: c.fg },
    keyboard: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 8 },
    keyboardLabel: { ...typeScale.link, color: c.accent },
  });
