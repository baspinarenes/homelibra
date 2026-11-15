import type { SourceType } from '@homelibra/core/source';
import Archive from 'lucide-react-native/icons/archive';
import Book from 'lucide-react-native/icons/book';
import CirclePlay from 'lucide-react-native/icons/circle-play';
import FileText from 'lucide-react-native/icons/file-text';
import Globe from 'lucide-react-native/icons/globe';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Newspaper from 'lucide-react-native/icons/newspaper';
import Scroll from 'lucide-react-native/icons/scroll';
import Shapes from 'lucide-react-native/icons/shapes';
import type { ColorValue } from 'react-native';

// The nine Source type icons from the visual identity (#68). They appear in the
// Source form's type picker; lists show the TemplateCover instead.
const icons: Record<SourceType, typeof Book> = {
  book: Book,
  article: FileText,
  thesis: GraduationCap,
  archive: Archive,
  manuscript: Scroll,
  periodical: Newspaper,
  recording: CirclePlay,
  webPage: Globe,
  other: Shapes,
};

export function SourceTypeIcon({ type, color }: { type: SourceType; color: ColorValue }) {
  const Icon = icons[type];
  return <Icon color={color} size={16} strokeWidth={1.6} />;
}
