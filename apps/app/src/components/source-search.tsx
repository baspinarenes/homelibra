import { Button } from '@homelibra/ui/button';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { type Matches, SearchField } from '@/components/note-search';

/** "Bu kaynakta ara", beside "Düzenle · N etiketsiz" in the Source page's heading. */
export function SourceSearchButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return <Button label={t('noteSearch.inSource')} variant="small" onPress={onPress} />;
}

/**
 * The open "Bu kaynakta ara" box: the Source's Notes narrow to the ones
 * that match, "2 / 15 not" under it. Kapat puts it away and brings the
 * writing box back.
 */
export function SourceSearchBar({
  text,
  onChange,
  matches,
  failed,
  total,
  onClose,
}: {
  text: string;
  onChange: (text: string) => void;
  matches: Matches | null;
  failed: boolean;
  total: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.bar}>
      <SearchField
        value={text}
        onChange={onChange}
        placeholder={t('noteSearch.inSource')}
        autoFocus
        onClose={onClose}
      />
      {failed ? (
        <Text style={styles.failed}>{t('noteSearch.failed')}</Text>
      ) : (
        matches && <Text style={styles.count}>{t('noteSearch.matchCount', { shown: matches.size, count: total })}</Text>
      )}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    bar: { gap: space.sm },
    count: { ...typeScale.heading, letterSpacing: 0, color: c.muted },
    failed: { ...typeScale.caption, color: c.danger },
  });
