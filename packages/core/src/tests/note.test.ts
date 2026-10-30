import { describe, expect, it } from 'vitest';

import { capturedAt, lastCaptured } from '../note';

const start = Date.parse('2026-10-30T09:00:00Z');

/** A UUIDv7 for a Note captured this many minutes into the reading. */
const idAt = (minute: number) => {
  const hex = (start + minute * 60_000).toString(16).padStart(12, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8)}-7000-8000-000000000000`;
};
const note = (minute: number, locator: string | null) => ({ id: idAt(minute), locator });

describe('lastCaptured', () => {
  it('finds the Note captured last, wherever it stands in Locator order', () => {
    // s. 113 was where the reading was; then the scholar went back to s. 87.
    const notes = [note(0, null), note(5, 's. 87'), note(30, 's. 87'), note(10, 's. 113'), note(20, 's. 140')];

    expect(lastCaptured(notes)?.note).toBe(notes[2]);
  });

  it('dates the Locator from the first Note of its unbroken run', () => {
    // In capture order: s. 12, s. 13, s. 13, s. 13. The run at s. 13 began at minute 4.
    const notes = [note(0, 's. 12'), note(4, 's. 13'), note(6, 's. 13'), note(9, 's. 13')];

    expect(lastCaptured(notes)?.locatorSince).toEqual(new Date(start + 4 * 60_000));
  });

  it('starts the run again when the scholar comes back to a Locator after another', () => {
    // In capture order: s. 12, s. 13, s. 12. The last run at s. 12 began at minute 8.
    const notes = [note(0, 's. 12'), note(8, 's. 12'), note(3, 's. 13')];

    expect(lastCaptured(notes)?.locatorSince).toEqual(new Date(start + 8 * 60_000));
  });

  it('is null for a Source with no Notes', () => {
    expect(lastCaptured([])).toBeNull();
  });
});

describe('capturedAt', () => {
  it('reads the moment a Note was captured from its UUIDv7 id', () => {
    // The test vector of RFC 9562, appendix A.6.
    expect(capturedAt('017f22e2-79b0-7cc3-98c4-dc0c0c07398f')).toEqual(new Date('2022-02-22T19:22:22.000Z'));
  });
});
