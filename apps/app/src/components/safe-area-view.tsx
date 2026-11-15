import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

/**
 * react-native-safe-area-context's SafeAreaView, taking `className`. Uniwind
 * wraps React Native's own components by itself; a library's needs withUniwind,
 * or its classes typecheck and draw nothing.
 */
export const SafeAreaView = withUniwind(NativeSafeAreaView);
