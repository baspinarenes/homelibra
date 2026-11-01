import { memo, useEffect, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { type Colors, radius, type as typeScale } from './tokens';
import { useThemedStyles } from './use-theme';

// A wheel turns through numbers (a day, a month, a year); null is "—".
type Value = number | null;

export type WheelColumn = {
  /** The head above the wheel, and what a screen reader calls it. */
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  /** Turns no further and greys out (Gün before Ay is chosen). */
  disabled?: boolean;
  /** A fixed width; without one the wheel takes the room left. */
  width?: number;
  /** Where the options stand: centred (Gün, Yıl) or at the start (Ay). */
  align?: 'center' | 'start';
};

const rowHeight = 36;
// Five rows show: the chosen one on the band, two above and two below.
const around = 2;
// Rows drawn on either side of the centred one; the rest are empty space of the same height.
const drawn = 15;
// After the last scroll event: the wheel has stopped, on web where no momentum event comes.
const settleAfter = 120;

const clamp = (i: number, n: number) => Math.max(0, Math.min(n - 1, i));

/**
 * Wheels side by side under one band, as iOS's date picker draws them, the
 * same on Android and web: a turn snaps to a row and chooses it. The band
 * marks the chosen row; the rows fade away from it. A screen reader turns a
 * wheel one row at a time (increment, decrement).
 */
export function Wheels({ columns }: { columns: readonly WheelColumn[] }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wheels}>
      <View style={styles.heads}>
        {columns.map((column) => (
          <Text
            key={column.label}
            aria-hidden
            style={[styles.head, place(column), column.align === 'start' ? styles.headStart : styles.headCenter]}
          >
            {column.label.toLocaleUpperCase('tr')}
          </Text>
        ))}
      </View>
      <View style={styles.row}>
        <View style={styles.band} />
        {columns.map((column) => (
          <Wheel key={column.label} column={column} />
        ))}
      </View>
    </View>
  );
}

const place = ({ width }: WheelColumn) => (width === undefined ? { flex: 1, minWidth: 0 } : { width });

function Wheel({ column }: { column: WheelColumn }) {
  const { label, options, value, onChange, disabled = false, align = 'center' } = column;
  const styles = useThemedStyles(makeStyles);
  const scroll = useRef<ScrollViewInstance>(null);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  // The row the wheel last chose or was put on, so a value it reported itself does not move it again.
  const reported = useRef(index);
  const [centred, setCentred] = useState(index);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (index === reported.current) return;
    reported.current = index;
    setCentred(index);
    scroll.current?.scrollTo({ y: index * rowHeight, animated: true });
  }, [index]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const choose = (i: number) => {
    setCentred(i);
    if (i === reported.current) return;
    reported.current = i;
    onChange(options[i]!.value);
  };
  const settle = (y: number) => {
    clearTimeout(timer.current);
    const i = clamp(Math.round(y / rowHeight), options.length);
    // Native snaps by itself (snapToInterval); web has to be put on the row.
    if (Platform.OS === 'web' && y !== i * rowHeight) scroll.current?.scrollTo({ y: i * rowHeight, animated: true });
    choose(i);
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    setCentred(clamp(Math.round(y / rowHeight), options.length));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => settle(y), settleAfter);
  };
  const step = (by: 1 | -1) => {
    const i = clamp(reported.current + by, options.length);
    scroll.current?.scrollTo({ y: i * rowHeight, animated: true });
    choose(i);
  };

  const from = Math.max(0, centred - drawn);
  const to = Math.min(options.length, centred + drawn + 1);
  return (
    <View
      accessible
      role="slider"
      aria-label={label}
      aria-valuetext={options[index]?.label}
      aria-disabled={disabled || undefined}
      accessibilityActions={disabled ? [] : [{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) => step(nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={[styles.wheel, place(column)]}
    >
      <ScrollView
        ref={scroll}
        contentOffset={{ x: 0, y: index * rowHeight }}
        onLayout={() => scroll.current?.scrollTo({ y: reported.current * rowHeight, animated: false })}
        onScroll={onScroll}
        onMomentumScrollEnd={(event) => settle(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        snapToInterval={rowHeight}
        decelerationRate="fast"
        scrollEnabled={!disabled}
        // Inside the sheet's own ScrollView, Android otherwise gives the drag to the sheet.
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: around * rowHeight }}
      >
        <View style={{ height: from * rowHeight }} />
        {options.slice(from, to).map((option, i) => (
          <Row
            key={from + i}
            label={option.label}
            distance={Math.min(Math.abs(from + i - centred), around)}
            off={disabled}
            start={align === 'start'}
          />
        ))}
        <View style={{ height: (options.length - to) * rowHeight }} />
      </ScrollView>
    </View>
  );
}

const Row = memo(function Row({
  label,
  distance,
  off,
  start,
}: {
  label: string;
  distance: number;
  off: boolean;
  start: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const look = off
    ? distance === 0
      ? styles.offCentre
      : styles.off
    : [styles.centre, styles.near, styles.far][distance];
  return (
    <View style={[styles.option, start && styles.optionStart]}>
      <Text numberOfLines={1} style={[styles.text, look]}>
        {label}
      </Text>
    </View>
  );
});

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    wheels: { gap: 6 },
    heads: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
    head: { ...typeScale.fieldLabel, color: c.muted },
    headCenter: { textAlign: 'center' },
    headStart: { paddingLeft: 12 },
    row: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, height: (2 * around + 1) * rowHeight },
    band: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: around * rowHeight,
      height: rowHeight,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.control,
    },
    wheel: { height: (2 * around + 1) * rowHeight },
    option: { height: rowHeight, alignItems: 'center', justifyContent: 'center' },
    optionStart: { alignItems: 'flex-start', paddingLeft: 12 },
    text: { ...typeScale.wheel, color: c.muted2 },
    centre: { ...typeScale.wheelCentre, color: c.fg },
    near: { color: c.ink2 },
    far: { opacity: 0.55 },
    off: { color: c.faint },
    offCentre: { color: c.muted2 },
  });
