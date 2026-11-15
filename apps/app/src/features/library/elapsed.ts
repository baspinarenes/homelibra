import type { TFunction } from 'i18next';

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

/** "12 dk önce", "dün": how long ago something happened; past a week, the day it happened. */
export function elapsed(t: TFunction, iso: string, now = Date.now()): string {
  const then = new Date(iso);
  const ago = now - then.getTime();
  if (ago < minute) return t('elapsed.now');
  if (ago < hour) return t('elapsed.minutes', { count: Math.floor(ago / minute) });
  if (ago < day) return t('elapsed.hours', { count: Math.floor(ago / hour) });
  if (ago < 2 * day) return t('elapsed.yesterday');
  if (ago < 7 * day) return t('elapsed.days', { count: Math.floor(ago / day) });
  return then.toLocaleDateString('tr', { day: 'numeric', month: 'short', year: 'numeric' });
}
