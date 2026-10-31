import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/** An element of the rendered page: what a screen reader or a tap would find. */
export type Node = { tag: string; attrs: Record<string, string>; children: (Node | string)[] };

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, left: 0, right: 0, bottom: 20 } };

/** Draws `element` as the app's web build does (react-native-web), on a phone with a 20px gesture bar. */
export function render(element: ReactElement): Node {
  return parse(renderToStaticMarkup(<SafeAreaProvider initialMetrics={metrics}>{element}</SafeAreaProvider>));
}

/** Every element with this ARIA role, in document order. */
export function byRole(node: Node, role: string): Node[] {
  return all(node).filter((n) => n.attrs.role === role);
}

/** The text a node shows, its descendants' text run together. */
export function text(node: Node | string): string {
  return typeof node === 'string' ? node : node.children.map(text).join('');
}

/** The name a screen reader reads: aria-label if set, its text otherwise. */
export function nameOf(node: Node): string {
  return node.attrs['aria-label'] ?? text(node);
}

/** Every element below `node`, in document order. */
export function all(node: Node): Node[] {
  return node.children.flatMap((child) => (typeof child === 'string' ? [] : [child, ...all(child)]));
}

const voids = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'wbr']);
const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#x27': "'", '#39': "'", nbsp: ' ' };
const decode = (s: string) => s.replace(/&(#?\w+);/g, (m, e: string) => entities[e] ?? m);

/** React's static markup is well formed, so a small tag reader is enough. */
function parse(html: string): Node {
  const root: Node = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const token = /<\/([\w-]+)>|<([\w-]+)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  for (const [, close, open, attrText = '', selfClose, chars] of html.matchAll(token)) {
    const top = stack[stack.length - 1]!;
    if (chars !== undefined) top.children.push(decode(chars));
    else if (close !== undefined) stack.pop();
    else if (open !== undefined) {
      const attrs: Record<string, string> = {};
      for (const [, name, value = ''] of attrText.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) attrs[name!] = decode(value);
      const node: Node = { tag: open, attrs, children: [] };
      top.children.push(node);
      if (!selfClose && !voids.has(open)) stack.push(node);
    }
  }
  return root;
}
