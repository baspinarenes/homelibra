import { HeaderTextAction } from '@homelibra/ui/screen-header';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { NewCollectionFields, useNewCollection } from '@/features/collection/new-collection';

/**
 * Yeni dosya (#128): the name, the Tags and the source-notes switch, and
 * how many Notes the Collection would gather before it is saved. Nothing is
 * made until Kaydet, so going back leaves no trace; once saved, the new
 * Collection's page takes this screen's place. A wide Dizin opens the same
 * form in its panel instead (#181).
 */
export default function NewCollectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const form = useNewCollection({
    onSaved: (id) => router.replace({ pathname: '/collection/[id]', params: { id } }),
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('collection.newTitle'),
          headerRight: () => (
            <HeaderTextAction label={t('collection.save')} onPress={form.save} disabled={!form.ready} />
          ),
        }}
      />
      <ScrollView contentContainerClassName="gap-5 px-lg pt-sm pb-xxl" keyboardShouldPersistTaps="handled">
        <NewCollectionFields form={form} />
      </ScrollView>
    </>
  );
}
