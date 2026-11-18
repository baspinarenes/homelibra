import { describe, expect, it } from 'vitest';

import { openPanels } from '@/components/open-panels';

describe('openPanels', () => {
  it('starts with no panel open', () => {
    expect(openPanels().isOpen()).toBe(false);
  });

  it('is open while a screen reports its panel open, and closed once it lets go', () => {
    const panels = openPanels();
    const release = panels.open();
    expect(panels.isOpen()).toBe(true);
    release();
    expect(panels.isOpen()).toBe(false);
  });

  it('stays open until every report has let go', () => {
    const panels = openPanels();
    const first = panels.open();
    const second = panels.open();
    first();
    expect(panels.isOpen()).toBe(true);
    second();
    expect(panels.isOpen()).toBe(false);
  });

  it('counts a report let go twice once', () => {
    const panels = openPanels();
    const first = panels.open();
    const second = panels.open();
    first();
    first();
    expect(panels.isOpen()).toBe(true);
    second();
    expect(panels.isOpen()).toBe(false);
  });

  it('tells its listeners when it opens and closes, not on every report', () => {
    const panels = openPanels();
    const heard: boolean[] = [];
    const stop = panels.subscribe(() => heard.push(panels.isOpen()));
    const first = panels.open();
    const second = panels.open();
    first();
    second();
    expect(heard).toEqual([true, false]);
    stop();
    panels.open();
    expect(heard).toEqual([true, false]);
  });
});
