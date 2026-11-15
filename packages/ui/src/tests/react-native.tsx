// React Native as the tests see it: react-native-web, except that a Modal
// draws its content in place. react-native-web puts it in a portal on the
// document body, which a page rendered to HTML on the server does not have.
//
// The app's Metro hands these components to Uniwind, which turns `className`
// into styles. Here react-native-web would drop it, so it is kept as a
// `data-class` attribute: a test reads the classes a component chose.
import { type ComponentType, createElement, forwardRef, type ReactNode } from 'react';
import * as Web from 'react-native-web';

export * from 'react-native-web';

type WithClass = { className?: string; dataSet?: Record<string, string> };

function keepClass<P extends object>(Component: ComponentType<P>) {
  return forwardRef<unknown, P & WithClass>(({ className, dataSet, ...props }, ref) =>
    createElement(Component, {
      ...(props as P),
      ref,
      dataSet: className ? { ...dataSet, class: className } : dataSet,
    }),
  );
}

export const View = keepClass(Web.View);
export const Text = keepClass(Web.Text);
export const Pressable = keepClass(Web.Pressable);
export const TextInput = keepClass(Web.TextInput);
export const ScrollView = keepClass(Web.ScrollView);
export const Image = keepClass(Web.Image);

export function Modal({ visible = true, children }: { visible?: boolean; children?: ReactNode }) {
  return visible ? children : null;
}
