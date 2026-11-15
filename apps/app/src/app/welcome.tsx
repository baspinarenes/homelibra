import { Button } from '@homelibra/ui/button';
import { BookIllustration } from '@homelibra/ui/illustration';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { useMutation } from '@tanstack/react-query';
import BookOpen from 'lucide-react-native/icons/book-open';
import Download from 'lucide-react-native/icons/download';
import Quote from 'lucide-react-native/icons/quote';
import Tag from 'lucide-react-native/icons/tag';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { SafeAreaView } from '@/components/safe-area-view';
import { authClient } from '@/lib/auth-client';
import { legalVersion } from '@/features/privacy/legal';
import { useTRPC } from '@/lib/trpc';

// Uniwind reads className only on React Native's own components.

const features = [
  { icon: BookOpen, key: 'welcome.features.sources' },
  { icon: Quote, key: 'welcome.features.notes' },
  { icon: Tag, key: 'welcome.features.tags' },
  { icon: Download, key: 'welcome.features.export' },
] as const;

/**
 * Hoş geldin: Homelibra in a few lines, shown once per Account, before the
 * Library opens. The terms were accepted at sign-in, by the "okudum" box above
 * Giriş's buttons; Başla records that acceptance with the version of the texts
 * (account.acceptTerms), and the Library opens. There is no consent box:
 * nothing here rests on consent (docs/research/kvkk-obligations.md). On a
 * wide screen it is one 440 px column in the middle of the window (#184).
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const wide = useWideLayout().tier === 'wide';
  const trpc = useTRPC();
  const { refetch } = authClient.useSession();
  // Once the session says the terms are accepted, the root layout opens the tabs.
  const accept = useMutation(trpc.account.acceptTerms.mutationOptions({ onSuccess: () => refetch() }));

  return (
    <SafeAreaView className="flex-1 bg-page">
      <ScrollView
        contentContainerClassName={
          wide
            ? 'w-full max-w-[440px] grow justify-center self-center px-gutter py-xl'
            : 'w-full max-w-[520px] grow self-center px-gutter pt-10 pb-xl'
        }
      >
        {/* The drawing's left page starts 8px inside it; pull it back to the gutter. */}
        <View className="-ml-sm">
          <BookIllustration />
        </View>
        <View className="mt-7 gap-sm">
          <Text variant="display">{t('welcome.title')}</Text>
          <Text variant="body">{t('welcome.lead')}</Text>
        </View>
        <View className="mt-7 gap-3.5">
          {features.map(({ icon: Icon, key }) => (
            <View key={key} className="flex-row items-start gap-3.5">
              <View className="mt-0.25">
                <Icon color={colors.accent} size={20} strokeWidth={1.6} />
              </View>
              <Text variant="body" color="ink3" className="flex-1">
                {t(key)}
              </Text>
            </View>
          ))}
        </View>
        {/* Pinned to the foot of a tall phone, right after the features on a short one or in the wide column. */}
        <View className={wide ? 'gap-md pt-xl' : 'mt-auto gap-md pt-xl'}>
          <Button
            label={t('welcome.start')}
            block
            busy={accept.isPending}
            onPress={() => accept.mutate({ version: legalVersion })}
          />
          {accept.isError ? (
            <Text variant="label" color="warn">
              {t('welcome.failed')}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
