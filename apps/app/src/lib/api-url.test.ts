import { afterEach, describe, expect, it, vi } from 'vitest';

const platform = { OS: 'web' };
vi.mock('react-native', () => ({ Platform: platform }));

// apiUrl is read once at import, so each case imports it fresh.
async function apiUrlFor(os: 'web' | 'android', dev: boolean, envUrl?: string) {
  vi.resetModules();
  platform.OS = os;
  vi.stubGlobal('__DEV__', dev);
  vi.stubGlobal('window', { location: { origin: 'http://localhost:8081' } });
  if (envUrl) vi.stubEnv('EXPO_PUBLIC_API_URL', envUrl);
  else delete process.env.EXPO_PUBLIC_API_URL;
  return (await import('./api-url')).apiUrl;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('apiUrl', () => {
  // Metro serves the web app in development and answers /api/* with its
  // index.html, so the session read as a string and the root layout crashed
  // on `session.user.termsAcceptedAt`.
  it('is the local API, not Metro, for the web app in development', async () => {
    expect(await apiUrlFor('web', true)).toBe('http://localhost:3000');
  });

  it("is the page's own origin for the released web app", async () => {
    expect(await apiUrlFor('web', false)).toBe('http://localhost:8081');
  });

  it('is the reversed localhost on a phone in development', async () => {
    expect(await apiUrlFor('android', true)).toBe('http://localhost:3000');
  });

  it('is homelibra.com in a release build', async () => {
    expect(await apiUrlFor('android', false)).toBe('https://homelibra.com');
  });

  it('is EXPO_PUBLIC_API_URL when it is set', async () => {
    expect(await apiUrlFor('web', true, 'http://192.168.1.5:3000')).toBe('http://192.168.1.5:3000');
  });
});
