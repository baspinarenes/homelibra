// src/app/_layout.tsx imports global.css (Tailwind through Uniwind) for its side
// effect. Expo declares *.css in expo-env.d.ts, but `expo start` writes that file
// and git ignores it, so a fresh checkout (CI) needs this one.
declare module '*.css';
