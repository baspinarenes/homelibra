import { TRPCError } from '@trpc/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();
const DAY_MS = 24 * 60 * 60 * 1000;

afterEach(() => {
  vi.useRealTimers();
});

describe('sign-in by email code', () => {
  it('emails a six-digit code that opens the empty Library', async () => {
    const email = scholarEmail();
    await t.requestCode(email);
    expect(t.mail.lastCodeFor(email)).toMatch(/^\d{6}$/);

    const device = await t.signIn(email);
    expect(await (await device.call()).sources.home()).toEqual({ sourceCount: 0 });
  });

  it('refuses a wrong code', async () => {
    const email = scholarEmail();
    await t.requestCode(email);
    const wrong = t.mail.lastCodeFor(email) === '000000' ? '111111' : '000000';

    const response = await t.api.auth.api.signInEmailOTP({ body: { email, otp: wrong }, asResponse: true });
    expect(response.ok).toBe(false);
  });

  it('keeps Library procedures closed without a session', async () => {
    const caller = await t.anonymous();
    await expect(caller.sources.home()).rejects.toThrowError(
      expect.objectContaining<Partial<TRPCError>>({ code: 'UNAUTHORIZED' }),
    );
  });
});

describe('sessions', () => {
  it('signing out closes only that device', async () => {
    const email = scholarEmail();
    const phone = await t.signIn(email);
    const desk = await t.signIn(email);

    await phone.signOut();

    await expect((await phone.call()).sources.home()).rejects.toThrowError(
      expect.objectContaining<Partial<TRPCError>>({ code: 'UNAUTHORIZED' }),
    );
    expect(await (await desk.call()).sources.home()).toEqual({ sourceCount: 0 });
  });

  it('stays open until sign-out, even after months unused', async () => {
    const device = await t.signIn(scholarEmail());

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 300 * DAY_MS);

    expect(await (await device.call()).sources.home()).toEqual({ sourceCount: 0 });
  });

  it('keeps the web session in an httpOnly cookie', async () => {
    const device = await t.signIn(scholarEmail());
    const sessionCookie = device.setCookie.find((c) => c.includes('session_token='));
    expect(sessionCookie).toMatch(/HttpOnly/i);
  });
});
