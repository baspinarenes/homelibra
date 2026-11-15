import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const e2e = testApi({ e2eCode: '424242' });

// pnpm e2e signs in with a fixed code (auth.ts); it must open nothing else.
describe('the fixed e2e code', () => {
  it('signs an invited homelibra.test address in', async () => {
    const email = `e2e-${Date.now()}@homelibra.test`;
    await e2e.invite(email);
    await e2e.requestCode(email);
    expect(e2e.mail.lastCodeFor(email)).toBe('424242');
    const response = await e2e.api.auth.api.signInEmailOTP({ body: { email, otp: '424242' }, asResponse: true });
    expect(response.ok).toBe(true);
  });

  it('never opens any other address', async () => {
    const email = scholarEmail();
    await e2e.invite(email);
    await e2e.requestCode(email);
    expect(e2e.mail.lastCodeFor(email)).not.toBe('424242');
  });

  it('still needs an invitation', async () => {
    const response = await e2e.requestCode(`stranger-${Date.now()}@homelibra.test`);
    expect(response.status).toBe(403);
  });
});
