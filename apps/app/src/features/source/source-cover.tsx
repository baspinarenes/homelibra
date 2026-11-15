import type { SourceType } from '@homelibra/core/source';
import { cx } from '@homelibra/ui/theme';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { type CoverSize, coverSizes, TemplateCover } from '@/features/source/template-cover';
import { type Cover, useCoverImage } from '@/features/source/cover';
import { useTRPC } from '@/lib/trpc';

/**
 * A Source as lists and headings show it: its Cover, or its type's template
 * without one (#40, "Cover"). A Cover whose file the API no longer has was
 * forgotten there on the way; the template takes its place without a
 * warning, and the Source's queries load again without the Cover.
 */
export function SourceCover({
  type,
  cover,
  size = 'small',
}: {
  type: SourceType;
  cover: Cover | null;
  size?: CoverSize;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!cover || failed === cover.small) return <TemplateCover type={type} size={size} />;
  // The small file (240 on its long edge) is sharp enough for both boxes.
  return <CoverImage file={cover.small} style={coverSizes[size]} onFailed={() => setFailed(cover.small)} />;
}

/** One of a Cover's files, filling its frame uncropped in the file and cropped to the frame here. */
export function CoverImage({
  file,
  style,
  className,
  onFailed,
}: {
  file: string;
  style: { width: number; height: number };
  /** Where the frame stands (margins, alignment), as classes. */
  className?: string;
  onFailed?: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const source = useCoverImage(file);
  return (
    <View
      className={cx('overflow-hidden rounded-cover bg-line-soft', className)}
      style={style}
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
