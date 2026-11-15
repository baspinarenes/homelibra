/**
 * Joins the classes that apply: `cx('px-6', block && 'self-stretch')`. No merging: two
 * classes for one property (`py-2`, `py-3`) fight on the web, so a component picks one.
 */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
