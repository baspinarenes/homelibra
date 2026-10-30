import { describe, expect, it } from 'vitest';

import { greet } from '../index';

describe('greet', () => {
  it('greets by name', () => {
    expect(greet('Enes')).toBe('Merhaba, Enes');
  });

  it('ignores a blank name', () => {
    expect(greet('  ')).toBe('Merhaba');
  });
});
