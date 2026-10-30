import { ImageManipulator, type ImageRef, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useState } from 'react';
import { type ImageURISource, Platform } from 'react-native';

import { apiUrl } from './api-url';
import { authClient } from './auth-client';

/** A Source's Cover: its two files' keys, as the API returns them. */
export type Cover = { large: string; small: string };

// The session cookie that native image requests carry, read from SecureStore
// at most once a minute rather than once per list row.
const COOKIE_FRESH_MS = 60 * 1000;
let cookie: { value: Promise<string>; at: number } | null = null;

function sessionCookie() {
  if (!cookie || Date.now() - cookie.at > COOKIE_FRESH_MS) {
    cookie = { value: authClient.getCookie(), at: Date.now() };
  }
  return cookie.value;
}

/**
 * Where an image of a Cover's file comes from: the API, under the session
 * like every other request (ADR-0011). The web sends its cookie itself;
 * native passes it as a header, so the image waits for it (null until then).
 */
export function useCoverImage(key: string | null): ImageURISource | null {
  const uri = key && `${apiUrl}/api/covers/${key}`;
  const [headers, setHeaders] = useState<{ cookie: string } | null>(null);
  useEffect(() => {
    if (!uri || Platform.OS === 'web') return;
    let current = true;
    void sessionCookie().then((value) => {
      if (current) setHeaders({ cookie: value });
    });
    return () => {
      current = false;
    };
  }, [uri]);
  if (!uri) return null;
  if (Platform.OS === 'web') return { uri };
  return headers && { uri, headers };
}

/** The most each file may weigh; the API refuses more (#40). */
const MAX_BYTES = { large: 400 * 1024, small: 40 * 1024 };

/** Long edges of the two files (ADR-0011); a smaller picture is not enlarged. */
const LONG_EDGE = { large: 1000, small: 240 };

/** JPEG quality, then lower ones for the rare picture that would still be too heavy. */
const QUALITIES = [0.7, 0.5, 0.3];

const decodedBytes = (base64: string) => Math.floor((base64.length * 3) / 4) - (base64.match(/=+$/)?.[0].length ?? 0);

async function jpeg(original: ImageRef, size: keyof typeof LONG_EDGE) {
  const scale = Math.min(1, LONG_EDGE[size] / Math.max(original.width, original.height));
  const context = ImageManipulator.manipulate(original);
  if (scale < 1) {
    context.resize(
      original.width >= original.height
        ? { width: Math.round(original.width * scale) }
        : { height: Math.round(original.height * scale) },
    );
  }
  const image = await context.renderAsync();
  for (const compress of QUALITIES) {
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
    // The web gives a data URL; native gives base64 as asked.
    const base64 = saved.base64 ?? (saved.uri.startsWith('data:') ? saved.uri.split(',')[1] : undefined);
    if (base64 && decodedBytes(base64) <= MAX_BYTES[size]) return base64;
  }
  throw new Error(`the ${size} cover file stays over ${MAX_BYTES[size]} bytes`);
}

/**
 * The two JPEGs the API takes for a picture the scholar chose: long edge
 * 1000 px at quality 0.7 and 240 px, uncropped (#40, ADR-0011), as base64.
 */
export async function coverFiles(uri: string) {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  return { large: await jpeg(original, 'large'), small: await jpeg(original, 'small') };
}
