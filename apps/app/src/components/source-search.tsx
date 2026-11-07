import { Button } from '@homelibra/ui/button';
import { Text } from '@homelibra/ui/text';
import { space } from '@homelibra/ui/theme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { type Matches, SearchField, ShortWords } from '@/components/note-search';

/** "Bu kaynakta ara", beside "Düzenle · N etiketsiz" in the Source page's heading. */
export function SourceSearchButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return <Button label={t('noteSearch.inSource')} variant="small" onPress={onPress} />;
}

/**
 * The open "Bu kaynakta ara" box: the Source's Notes narrow to the ones
 * that match, "2 / 15 not" under it, and over that, while some match, the
 * words too short for a prefix match (#144; with none, the page names them
 * under its empty line). The X puts it away and brings the writing box back.
 */
export function SourceSearchBar({
  text,
  onChange,
  matches,
  shortWords,
  failed,
  total,
  onClose,
}: {
  text: string;
  onChange: (text: string) => void;
  matches: Matches | null;
  shortWords: readonly string[];
  failed: boolean;
  total: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
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
        <Text variant="caption" color="danger">
          {t('noteSearch.failed')}
        </Text>
      ) : (
        matches && (
          <>
            {matches.size > 0 && <ShortWords words={shortWords} />}
            <Text variant="collectionCount">{t('noteSearch.matchCount', { shown: matches.size, count: total })}</Text>
          </>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { gap: space.sm },
});
