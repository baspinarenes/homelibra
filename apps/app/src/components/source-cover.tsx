import type { SourceType } from '@homelibra/core/source';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { TemplateCover } from '@/components/template-cover';
import { type Cover, useCoverImage } from '@/lib/cover';
import { useTRPC } from '@/lib/trpc';
import { radius, useTheme } from '@/theme';

/**
 * A Source as lists and headings show it: its Cover, or its type's template
 * without one (#40, "Cover"). A Cover whose file the API no longer has was
 * forgotten there on the way; the template takes its place without a
 * warning, and the Source's queries load again without the Cover.
 */
export function SourceCover({ type, cover }: { type: SourceType; cover: Cover | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!cover || failed === cover.small) return <TemplateCover type={type} />;
  return <CoverImage file={cover.small} style={styles.small} onFailed={() => setFailed(cover.small)} />;
}

/** One of a Cover's files, filling its frame uncropped in the file and cropped to the frame here. */
export function CoverImage({
  file,
  style,
  onFailed,
}: {
  file: string;
  style: { width: number; height: number };
  onFailed?: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const source = useCoverImage(file);
  return (
    <View
      style={[styles.frame, { backgroundColor: colors.lineSoft }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {source && (
        <Image
          source={source}
          style={style}
          resizeMode="cover"
          onError={() => {
            onFailed?.();
            void queryClient.invalidateQueries({ queryKey: trpc.sources.pathKey() });
            void queryClient.invalidateQueries({ queryKey: trpc.search.pathKey() });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // The list size of the template cover (design system, size s).
  small: { width: 40, height: 56 },
  frame: { borderRadius: radius.cover, overflow: 'hidden' },
});
