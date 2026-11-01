import { describe, expect, it } from 'vitest';

import { Strip } from '../strip';
import { byRole, render, text } from './render';

const noop = () => {};

describe('Strip', () => {
  it('is one link that names what waits', () => {
    const page = render(<Strip title="2 notun kaynağı silinmiş" onPress={noop} />);
    const links = byRole(page, 'link');
    expect(links).toHaveLength(1);
    expect(text(links[0]!)).toBe('2 notun kaynağı silinmiş');
  });

  it('can say more under its title, inside the same link', () => {
    const page = render(
      <Strip
        title="Düzenlenecekler · 3 kaynak"
        detail="Tanin · DH.MKT 1234/56 · Osmanlı Kentlerinde Esnaf"
        onPress={noop}
      />,
    );
    const links = byRole(page, 'link');
    expect(links).toHaveLength(1);
    expect(text(links[0]!)).toBe('Düzenlenecekler · 3 kaynakTanin · DH.MKT 1234/56 · Osmanlı Kentlerinde Esnaf');
  });
});
