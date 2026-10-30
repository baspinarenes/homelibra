import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Lets a picture be dragged onto a view from the desktop, on the web only:
 * pass `ref` to the view; `over` is true while a picture hovers over it.
 * `onImage` gets a URL for the dropped file, valid until the page goes.
 */
export function useImageDrop(onImage: (uri: string) => void) {
  // react-native-web renders a View as a DOM element and hands it out as its ref.
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [over, setOver] = useState(false);
  const latest = useRef(onImage);
  useEffect(() => {
    latest.current = onImage;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || !node) return;
    const carriesImage = (event: DragEvent) =>
      Array.from(event.dataTransfer?.items ?? []).some(
        (item) => item.kind === 'file' && item.type.startsWith('image/'),
      );
    const onDragOver = (event: DragEvent) => {
      if (!carriesImage(event)) return;
      event.preventDefault();
      setOver(true);
    };
    const onDragLeave = () => setOver(false);
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      setOver(false);
      const file = Array.from(event.dataTransfer?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file) latest.current(URL.createObjectURL(file));
    };
    node.addEventListener('dragover', onDragOver);
    node.addEventListener('dragleave', onDragLeave);
    node.addEventListener('drop', onDrop);
    return () => {
      node.removeEventListener('dragover', onDragOver);
      node.removeEventListener('dragleave', onDragLeave);
      node.removeEventListener('drop', onDrop);
    };
  }, [node]);

  const ref = useCallback((view: object | null) => setNode(view as HTMLElement | null), []);
  return { ref, over };
}
