import { describe, expect, it } from 'vitest';

import { SettingsRow, SettingsRows } from '../settings-row';
import { all, byRole, classes, type Node, render, text } from './render';

const noop = () => {};

describe('SettingsRow', () => {
  it('is a button that reads its label, then its value', () => {
    const page = render(<SettingsRow label="E-posta adresi" value="tarihci@ornek.edu.tr" onPress={noop} />);
    const [row] = byRole(page, 'button');
    expect(text(row!)).toBe('E-posta adresitarihci@ornek.edu.tr');
  });

  it('ends in a chevron', () => {
    const [row] = byRole(render(<SettingsRow label="Kütüphaneni dışa aktar" onPress={noop} />), 'button');
    expect((row!.children.at(-1) as Node).tag).toBe('svg');
  });
});

describe('SettingsRows', () => {
  it('rules a thin line between each two rows, none above the first', () => {
    const page = render(
      <SettingsRows>
        <SettingsRow label="Aydınlatma metni" onPress={noop} />
        <SettingsRow label="Kullanım koşulları" onPress={noop} />
      </SettingsRows>,
    );
    const [first, second] = byRole(page, 'button').map((row) => parentOf(page, row));
    expect(classes(second!)).toContain('border-t');
    expect(classes(first!)).not.toContain('border-t');
  });
});

function parentOf(page: Node, node: Node): Node | undefined {
  return [page, ...all(page)].find((candidate) => candidate.children.includes(node));
}
