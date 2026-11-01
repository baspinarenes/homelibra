// PROTOTYPE, throw away: which tab-root title? Four variants on every tab's
// own header, switched from a floating bar (dev builds only). On the web the
// pick is also ?variant= in the URL. Not for main.
import { ScreenHeader } from '@homelibra/ui/screen-header';
import { type Colors, fonts, useThemedStyles } from '@homelibra/ui/theme';
import { type ReactNode, useEffect, useSyncExternalStore } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const variants = [
  { key: '0', name: 'Şimdiki' },
  { key: 'A', name: 'Küçük serif' },
  { key: 'B', name: 'Mono başlık' },
  { key: 'C', name: 'Başlıksız' },
] as const;
type Key = (typeof variants)[number]['key'];

const fromUrl = () => {
  if (Platform.OS !== 'web') return null;
  const value = new URLSearchParams(globalThis.location?.search).get('variant');
  return variants.some((v) => v.key === value) ? (value as Key) : null;
};

let current: Key = fromUrl() ?? 'A';
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function cycle(step: 1 | -1) {
  const index = variants.findIndex((v) => v.key === current);
  current = variants[(index + step + variants.length) % variants.length]!.key;
  if (Platform.OS === 'web') {
    const url = new URL(globalThis.location.href);
    url.searchParams.set('variant', current);
    globalThis.history.replaceState(null, '', url);
  }
  for (const listener of listeners) listener();
}
const useVariant = () => useSyncExternalStore(subscribe, () => current);

export function PrototypeRootHeader({
  title,
  titleAccessory,
  right,
}: {
  title: string;
  titleAccessory?: ReactNode;
  right?: ReactNode;
}) {
  const variant = useVariant();
  const styles = useThemedStyles(makeStyles);
  const { top } = useSafeAreaInsets();
  if (variant === '0')
    return <ScreenHeader variant="root" title={title} titleAccessory={titleAccessory} right={right} />;

  const actions = right && <View style={styles.actions}>{right}</View>;
  if (variant === 'C')
    return (
      <View style={[styles.root, { paddingTop: top + 6 }, !right && !titleAccessory && styles.bare]}>
        <Text role="heading" style={styles.hidden}>
          {title}
        </Text>
        <View style={styles.head}>{titleAccessory}</View>
        {actions}
      </View>
    );

  return (
    <View style={[styles.root, { paddingTop: top + 14 }, variant === 'B' && styles.ruled]}>
      <View style={styles.head}>
        <Text role="heading" style={variant === 'A' ? styles.serif : styles.mono} numberOfLines={1}>
          {variant === 'B' ? title.toLocaleUpperCase('tr') : title}
        </Text>
        {titleAccessory}
      </View>
      {actions}
    </View>
  );
}

export function PrototypeSwitcher() {
  const variant = useVariant();
  const styles = useThemedStyles(makeStyles);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable]')) return;
      if (event.key === 'ArrowLeft') cycle(-1);
      if (event.key === 'ArrowRight') cycle(1);
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, []);
  if (!__DEV__) return null;
  const name = variants.find((v) => v.key === variant)!.name;
  return (
    <View pointerEvents="box-none" style={styles.switcherEdge}>
      <View style={styles.switcher}>
        <Pressable onPress={() => cycle(-1)} hitSlop={10}>
          <Text style={styles.switcherText}>‹</Text>
        </Pressable>
        <Text style={styles.switcherText}>
          {variant} ({name})
        </Text>
        <Pressable onPress={() => cycle(1)} hitSlop={10}>
          <Text style={styles.switcherText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // One height with or without icons, so the title never moves between tabs.
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 10,
      paddingLeft: 22,
      paddingRight: 12,
      backgroundColor: c.page,
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 1, minWidth: 0, minHeight: 44 },
    actions: { flexDirection: 'row', alignItems: 'center' },
    serif: { fontFamily: fonts.serif, fontSize: 25, lineHeight: 32, color: c.fg, flexShrink: 1 },
    mono: { fontFamily: fonts.mono, fontSize: 15, lineHeight: 20, letterSpacing: 2.2, color: c.fg, flexShrink: 1 },
    ruled: { borderBottomWidth: 1, borderBottomColor: c.line, marginBottom: 4 },
    bare: { paddingBottom: 0 },
    hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
    switcherEdge: { position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center' },
    switcher: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: '#111',
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    switcherText: { color: '#fff', fontFamily: fonts.mono, fontSize: 14 },
  });
