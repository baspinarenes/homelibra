import { locatorErase, locatorPad, pressLocatorKey } from '@homelibra/core/note';
import type { SourceType } from '@homelibra/core/source';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { type as typeScale, useTheme } from '@homelibra/ui/theme';
import Delete from 'lucide-react-native/icons/delete';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';

/**
 * The writing sheet's Locator editor, a sheet over it. Sources cited by page,
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
          style={typeScale.locatorInput}
        />
      ) : (
        <Text
          variant={locator ? 'locatorKey' : 'keyHint'}
          color={fresh && locator !== '' ? 'muted2' : undefined}
          accessibilityLabel={`${t('capture.locator')}: ${locator || t('capture.noLocator')}`}
          className="py-1.5 text-center"
          numberOfLines={1}
        >
          {locator || t('capture.wholeSource')}
        </Text>
      )}
      {pad && !freeText && (
        <View className="flex-row flex-wrap gap-2">
          {[...pad.keys, locatorErase].map((key) => (
            // Three to a row: a third of the width less the two gaps.
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === locatorErase ? t('capture.locatorErase') : key}
              onPress={() => press(key)}
              className="h-13 w-[31.5%] items-center justify-center rounded-control border border-line bg-surface active:bg-line-soft"
            >
              {key === locatorErase ? (
                <Delete color={colors.ink2} size={20} strokeWidth={1.6} />
              ) : (
                <Text variant="key">{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
      {pad && !freeText && Platform.OS !== 'web' && (
        <Pressable accessibilityRole="button" onPress={() => setFreeText(true)} className="self-center px-2 py-1">
          <Text variant="link">{t('capture.locatorKeyboard')}</Text>
        </Pressable>
      )}
    </Sheet>
  );
}
