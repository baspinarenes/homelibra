// React Native as the tests see it: react-native-web, except that a Modal
// draws its content in place. react-native-web puts it in a portal on the
// document body, which a page rendered to HTML on the server does not have.
import type { ReactNode } from 'react';

export * from 'react-native-web';

export function Modal({ visible = true, children }: { visible?: boolean; children?: ReactNode }) {
  return visible ? children : null;
}
