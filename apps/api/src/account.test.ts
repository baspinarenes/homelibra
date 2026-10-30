import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

describe('first sign-in', () => {
  it('asks for the terms of use on the first sign-in only', async () => {
    const email = scholarEmail();
    const first = await t.signIn(email, { acceptTerms: false });
    expect(await first.account()).toMatchObject({ termsAcceptedAt: null, termsVersion: null });

    await (await first.call()).account.acceptTerms({ version: '2026-10-30' });

    const next = await t.signIn(email, { acceptTerms: false });
    expect(await next.account()).toMatchObject({ termsAcceptedAt: expect.any(Date), termsVersion: '2026-10-30' });
  });

  it('keeps the Library closed until the terms are accepted', async () => {
    const device = await t.signIn(scholarEmail(), { acceptTerms: false });

    await expect((await device.call()).sources.home()).rejects.toThrowError(
      expect.objectContaining<Partial<TRPCError>>({ code: 'FORBIDDEN', message: 'TERMS_NOT_ACCEPTED' }),
    );

    await (await device.call()).account.acceptTerms({ version: '2026-10-30' });
    expect(await (await device.call()).sources.home()).toEqual({ sourceCount: 0 });
  });

  it('keeps the moment and version of the first acceptance', async () => {
    const device = await t.signIn(scholarEmail(), { acceptTerms: false });
    await (await device.call()).account.acceptTerms({ version: '2026-10-30' });
    const { termsAcceptedAt } = await device.account();

    await (await device.call()).account.acceptTerms({ version: '2027-01-01' });

    expect(await device.account()).toMatchObject({ termsAcceptedAt, termsVersion: '2026-10-30' });
  });
});

describe('changing the email address', () => {
  it('moves the Account to the new address with a code sent there, and tells the old one', async () => {
    const oldEmail = scholarEmail('eski');
    const newEmail = scholarEmail('yeni');
    const device = await t.signIn(oldEmail);

    expect((await device.requestEmailChange(newEmail)).ok).toBe(true);
    const changed = await device.changeEmail(newEmail, t.mail.lastCodeFor(newEmail));

    expect(changed.ok).toBe(true);
    expect(await device.account()).toMatchObject({ email: newEmail });
    expect(t.mail.noticesSentTo(oldEmail)).toEqual([{ newEmail }]);
    const again = await t.signIn(newEmail, { invite: false });
    expect(again.accountId).toBe(device.accountId);
  });

  it('closes the old address: it no longer gets a sign-in code', async () => {
    const oldEmail = scholarEmail('eski');
    const newEmail = scholarEmail('yeni');
    const device = await t.signIn(oldEmail);

    await device.requestEmailChange(newEmail);
    await device.changeEmail(newEmail, t.mail.lastCodeFor(newEmail));

    expect((await t.requestCode(oldEmail)).status).toBe(403);
  });

  it('refuses an address another Account uses, without sending it a code', async () => {
    const taken = scholarEmail('dolu');
    await t.signIn(taken);
    const device = await t.signIn(scholarEmail());
    const codesBefore = t.mail.codesSentTo(taken).length;

    const response = await device.requestEmailChange(taken);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'EMAIL_TAKEN' });
    expect(t.mail.codesSentTo(taken)).toHaveLength(codesBefore);
  });

  it('tells no one without a session whether an address has an Account', async () => {
    const taken = scholarEmail('dolu');
    await t.signIn(taken);

    const response = await t.api.http.request('/api/auth/email-otp/request-email-change', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ newEmail: taken }),
    });

    expect(response.status).toBe(401);
  });

  it('keeps the address when the code is wrong', async () => {
    const oldEmail = scholarEmail('eski');
    const newEmail = scholarEmail('yeni');
    const device = await t.signIn(oldEmail);
    await device.requestEmailChange(newEmail);
    const wrong = t.mail.lastCodeFor(newEmail) === '000000' ? '111111' : '000000';

    const response = await device.changeEmail(newEmail, wrong);

    expect(response.ok).toBe(false);
    expect(await device.account()).toMatchObject({ email: oldEmail });
    expect(t.mail.noticesSentTo(oldEmail)).toEqual([]);
  });
});
