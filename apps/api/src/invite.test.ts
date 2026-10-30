import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { runInviteCommand } from './invite';
import { scholarEmail, testApi } from './test/harness';

const t = testApi();
const invite = (...args: string[]) => runInviteCommand(t.db, args);
/** The addresses `list` prints, one per line before the date. */
const listed = async () => (await invite('list')).split('\n').map((line) => line.split(/\s+/)[0]);

describe("the Operator's invite command", () => {
  it('add lets the address receive a sign-in code', async () => {
    const email = scholarEmail();

    expect(await invite('add', email)).toBe(`Invited ${email}.`);

    expect((await t.requestCode(email)).status).toBe(200);
  });

  it('matches an address typed in capitals, reading I as i and not as Turkish ı', async () => {
    const tag = randomUUID().slice(0, 8);

    await invite('add', `KADI-${tag}@EXAMPLE.ORG`);

    expect((await t.requestCode(`kadi-${tag}@example.org`)).status).toBe(200);
  });

  it('remove takes the address off the list, and it gets no code', async () => {
    const email = scholarEmail();
    await invite('add', email);

    expect(await invite('remove', email)).toBe(`Removed ${email}.`);

    expect((await t.requestCode(email)).status).toBe(403);
  });

  it('remove says so when the address already has an Account, which stays open', async () => {
    const email = scholarEmail();
    await t.signIn(email);

    expect(await invite('remove', email)).toBe(`Removed ${email}. Its Account stays open.`);

    expect((await t.requestCode(email)).status).toBe(200);
  });

  it('list shows the invited addresses, one per line', async () => {
    const kadi = scholarEmail('kadi');
    const naib = scholarEmail('naib');
    await invite('add', kadi);
    await invite('add', naib);
    await invite('remove', naib);

    const addresses = await listed();

    expect(addresses).toContain(kadi);
    expect(addresses).not.toContain(naib);
  });

  it('refuses something that is not an email address', async () => {
    await expect(invite('add', 'kadi.example.org')).rejects.toThrowError(/not an email address/);

    expect(await listed()).not.toContain('kadi.example.org');
  });
});
