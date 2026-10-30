import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { Segment } from '@/components/segment';
import { TagList } from '@/components/tag-list';
import { type Colors, space, useThemedStyles } from '@/theme';

type CollectionsView = 'collections' | 'tags';

/**
 * Dosyalar | Etiketler. Etiketler lives here, not in its own tab, because a
 * Tag's page is already a temporary Collection. The view is a search param, so
 * a link can open Etiketler directly.
 */
export default function CollectionsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ view?: string }>();
  const view: CollectionsView = params.view === 'tags' ? 'tags' : 'collections';
  const views: { value: CollectionsView; label: string }[] = [
    { value: 'collections', label: t('collections.collections') },
    { value: 'tags', label: t('collections.tags') },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.bar}>
        <Segment
          label={t('collections.viewLabel')}
          options={views}
          value={view}
          onChange={(next) => router.setParams({ view: next === 'tags' ? 'tags' : undefined })}
        />
      </View>
      {/* Collections arrive in #51. */}
      {view === 'tags' ? <TagList /> : <PlaceholderScreen />}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    // Lines up with the header title.
    bar: { paddingHorizontal: space.lg, paddingTop: space.sm },
  });
