import { describe, expect, it } from 'vitest';

import { unsavedWork } from '@/components/unsaved-work';

/** A piece of work that remembers what it was asked, and throws its changes away on `discard`. */
function work() {
  let asked: (() => void) | null = null;
  return {
    ask: (then: () => void) => {
      asked = then;
    },
    asked: () => asked !== null,
    discard: () => asked?.(),
  };
}

describe('unsavedWork', () => {
  it('leaves at once with nothing unsaved', () => {
    const left: string[] = [];
    unsavedWork().leave(() => left.push('sidebar'));
    expect(left).toEqual(['sidebar']);
  });

  it('asks the work first, and leaves only once its changes are thrown away', () => {
    const works = unsavedWork();
    const edit = work();
    works.hold(edit.ask);
    const left: string[] = [];
    works.leave(() => left.push('another row'));
    expect(edit.asked()).toBe(true);
    expect(left).toEqual([]);
    edit.discard();
    expect(left).toEqual(['another row']);
  });

  it('leaves at once again once the work is saved or put away', () => {
    const works = unsavedWork();
    const edit = work();
    const release = works.hold(edit.ask);
    release();
    const left: string[] = [];
    works.leave(() => left.push('✕'));
    expect(edit.asked()).toBe(false);
    expect(left).toEqual(['✕']);
  });

  it('asks the work held last, the one in front', () => {
    const works = unsavedWork();
    const under = work();
    const front = work();
    works.hold(under.ask);
    const release = works.hold(front.ask);
    works.leave(() => {});
    expect(front.asked()).toBe(true);
    expect(under.asked()).toBe(false);
    release();
    works.leave(() => {});
    expect(under.asked()).toBe(true);
  });

  it('lets go of a hold let go twice once', () => {
    const works = unsavedWork();
    const first = work();
    const release = works.hold(first.ask);
    works.hold(work().ask);
    release();
    release();
    expect(works.held()).toBe(true);
  });
});
