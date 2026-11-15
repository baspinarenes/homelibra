import { useEffect, useState } from 'react';

/** The value after the scholar stops typing for a moment, so a search does not run on every key. */
export function useSettled<T>(value: T, delay = 250) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}
