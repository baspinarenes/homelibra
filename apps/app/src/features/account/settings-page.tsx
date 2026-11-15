import { Text } from '@homelibra/ui/text';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { Stack, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * A page of Ayarlar: Ayarlar itself and the Account's own pages (E-posta
 * adresi, Dışa aktar, Hesabı sil). On a phone, today's scrolling page under
 * the stack's header, its content laid out by `phone`. On a wide screen
 * (#113, #183) one 640 px column in the middle with no header bar: the
 * page's title over its content and, on the Account's pages (`back`), a
 * "‹ Ayarlar" above it. The ScrollView keeps its place in both tiers, so a
 * resize across them keeps what was typed.
 */
export function SettingsPage({
  title,
  back = false,
  phone,
  gap,
  keyboardShouldPersistTaps,
  children,
}: {
  title: string;
  /** An Account page under Ayarlar: "‹ Ayarlar" above its title on a wide screen. */
  back?: boolean;
  /** The content container's classes on a phone. */
  phone: string;
  /** The space between the content's parts in the wide column, as the phone's container sets it. */
  gap?: 'sm' | 'lg';
  keyboardShouldPersistTaps?: 'handled';
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const wide = useWideLayout().tier === 'wide';
  return (
    <>
      <Stack.Screen options={{ headerShown: !wide }} />
      <ScrollView
        className="flex-1 bg-page"
        contentContainerClassName={wide ? wideColumn[gap ?? 'none'] : phone}
        // The header bar kept the status bar's inset; without it the column does.
        style={wide ? { paddingTop: top } : undefined}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        {wide && (
          <View className={back ? 'gap-3.5 pb-1.5' : undefined}>
            {back && (
              <Pressable
                role="link"
                // Ayarlar itself, also from Dışa aktar opened in Hesabı sil.
                onPress={() => router.dismissTo('/settings')}
                className="self-start active:opacity-70"
              >
                <Text variant="link">{t('settings.back')}</Text>
              </Pressable>
            )}
            <Text variant="title">{title}</Text>
          </View>
        )}
        {children}
      </ScrollView>
    </>
  );
}

// 640 between 40 on each side, 24 above as the wide boards draw it.
const wideColumn = {
  none: 'w-full max-w-[720px] self-center px-10 pt-xl pb-xl',
  sm: 'w-full max-w-[720px] gap-sm self-center px-10 pt-xl pb-xl',
  lg: 'w-full max-w-[720px] gap-lg self-center px-10 pt-xl pb-xl',
} as const;
