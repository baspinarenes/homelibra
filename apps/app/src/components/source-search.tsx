import { Text } from '@homelibra/ui/text';
import { space } from '@homelibra/ui/theme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { type Matches, SearchField, ShortWords } from '@/components/note-search';

/**
 * What a search in the Source has to say beyond its count: that it failed,
 * or, while some match, the words too short for a prefix match (#144; with
 * none, the page names them under its empty line).
 */
export function SourceSearchNotice({
  matches,
  shortWords,
  failed,
}: {
  matches: Matches | null;
  shortWords: readonly string[];
  failed: boolean;
}) {
  const { t } = useTranslation();
  if (failed) {
    return (
      <Text variant="caption" color="danger">
        {t('noteSearch.failed')}
      </Text>
    );
  }
  return matches && matches.size > 0 ? <ShortWords words={shortWords} /> : null;
}

/**
 * "Bu kaynakta ara" open in place of the Notes' heading, for those who keep
 * it there in Görünüm: the box on a rule, its notice and "2 / 15 not" under
 * it. The × puts it away and brings "Not al" back.
 */
export function SourceSearchBar({
  text,
  onChange,
  matches,
  shortWords,
  failed,
  count,
  onClose,
}: {
  text: string;
  onChange: (text: string) => void;
  matches: Matches | null;
  shortWords: readonly string[];
  failed: boolean;
  /** "2 / 15 not", once there is a result to count. */
  count: string | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.bar}>
      <SearchField
        look="line"
        value={text}
        onChange={onChange}
        placeholder={t('noteSearch.inSource')}
        autoFocus
        onClose={onClose}
      />
      <SourceSearchNotice matches={matches} shortWords={shortWords} failed={failed} />
      {count !== undefined && <Text variant="collectionCount">{count}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { gap: space.sm },
});
