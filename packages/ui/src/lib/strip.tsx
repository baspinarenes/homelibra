import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './use-theme';

/**
 * A yellow strip at the top of a screen for what waits on the scholar
 * (2 notun kaynağı silinmiş): one link, all of
 * it pressable, a chevron at the right. `detail` is a second line, cut with
 * "…" where it does not fit. Strips stand 8 apart.
 */
export function Strip({ title, detail, onPress }: { title: string; detail?: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      role="link"
      onPress={onPress}
      className="min-h-12 flex-row items-center gap-2.5 rounded-control bg-warn-soft py-2.5 pr-2.5 pl-3.5 active:opacity-70"
    >
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="bodyStrong" color="warn">
          {title}
        </Text>
        {detail !== undefined && (
          <Text variant="caption" color="ink2" numberOfLines={1}>
            {detail}
          </Text>
        )}
      </View>
      <ChevronRight color={colors.warn} size={18} strokeWidth={1.6} />
    </Pressable>
  );
}
