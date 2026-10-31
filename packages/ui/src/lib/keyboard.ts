import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * How far above the screen's bottom edge the on-screen keyboard reaches; 0
 * while it is down. iOS reports the keyboard from the screen's edge; Android,
 * drawn edge to edge, from above the navigation bar.
 */
export function useKeyboardTop(): number {
  const { bottom } = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  useEffect(() => {
    // iOS tells before the keyboard moves, so the sheet moves with it.
    const ios = Platform.OS === 'ios';
    const shown = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (event) =>
      setHeight(event.endCoordinates.height),
    );
    const hidden = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  if (height === 0) return 0;
  return Platform.OS === 'android' ? height + bottom : height;
}
