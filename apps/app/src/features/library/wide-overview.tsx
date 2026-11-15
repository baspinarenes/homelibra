import { Sections } from '@homelibra/ui/section-heading';
import { sideColumnBeside } from '@homelibra/ui/wide-layout';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type LastNoted, LastNotedSection } from '@/features/library/last-noted';
import { LibrarySummary } from '@/features/library/library-summary';
import { LostNotesNotice } from '@/features/library/lost-notes-notice';
import { ReadingList } from '@/features/library/reading-list';
import { RecentNotes } from '@/features/library/recent-notes';
import { RecentTags } from '@/features/library/recent-tags';

/**
 * Genel Bakış on a wide screen (#182, Q41): a main column of about 640, the
 * yellow strip of what waits on the scholar, Kaldığın yer and Son notlar,
 * and beside it a 300 px side column, Okunuyor, Son kullanılan etiketler
 * and Kütüphanen, the sections in the phone's order. Below about 1300 px
 * the side column goes under the main one (Q46). Only for a Library with
 * Notes: the empty states stay centred, with no side column (Q45).
 */
export function WideOverview({ lastNoted }: { lastNoted: LastNoted }) {
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const beside = sideColumnBeside(width);
  return (
    <ScrollView
      className="flex-1 bg-page"
      contentContainerClassName={beside ? 'flex-row items-start gap-12 px-10 pb-xxl' : 'px-10 pb-xxl'}
      // The header bar is gone: the page keeps the status bar's inset; the first heading's own 22 makes the 28 drawn.
      contentContainerStyle={{ paddingTop: top + 6 }}
    >
      <View className={beside ? 'min-w-0 max-w-[640px] flex-1 gap-1.5' : 'w-full max-w-[640px] gap-1.5'}>
        <LostNotesNotice />
        <Sections wide>
          <LastNotedSection lastNoted={lastNoted} wide />
          <RecentNotes />
        </Sections>
      </View>
      <View className={beside ? 'w-[300px]' : 'w-full max-w-[640px]'}>
        <Sections wide>
          <ReadingList wide />
          <RecentTags wide />
          <LibrarySummary wide />
        </Sections>
      </View>
    </ScrollView>
  );
}
