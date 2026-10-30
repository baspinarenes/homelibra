import { describe, expect, it } from 'vitest';

import { capturedAt, locatorGroups } from '../note';

const note = (id: string, locator: string | null) => ({ id, locator });

describe('locatorGroups', () => {
  it('runs of Notes at the same Locator share one heading, in flow order', () => {
    const flow = [note('1', 's. 12'), note('2', 's. 12'), note('3', 's. 13'), note('4', null), note('5', null)];

    expect(locatorGroups(flow)).toEqual([
      { locator: 's. 12', notes: [flow[0], flow[1]] },
      { locator: 's. 13', notes: [flow[2]] },
      { locator: null, notes: [flow[3], flow[4]] },
    ]);
  });

  it('starts a new heading when the scholar goes back to an earlier Locator', () => {
    const flow = [note('1', 's. 12'), note('2', 's. 13'), note('3', 's. 12')];

    expect(locatorGroups(flow).map((group) => group.locator)).toEqual(['s. 12', 's. 13', 's. 12']);
  });

  it('has no headings for an empty flow', () => {
    expect(locatorGroups([])).toEqual([]);
  });
});

describe('capturedAt', () => {
  it('reads the moment a Note was captured from its UUIDv7 id', () => {
    // The test vector of RFC 9562, appendix A.6.
    expect(capturedAt('017f22e2-79b0-7cc3-98c4-dc0c0c07398f')).toEqual(new Date('2022-02-22T19:22:22.000Z'));
  });
});
