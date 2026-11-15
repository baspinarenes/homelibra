import { Text } from 'react-native';
import { describe, expect, it } from 'vitest';

import { Section, SectionHeading, Sections, SectionText } from '../section-heading';
import { SettingsRow, SettingsRows } from '../settings-row';
import { Toast } from '../toast';
import { all, byRole, classes, nameOf, type Node, render, text } from './render';

const noop = () => {};

describe('SectionHeading', () => {
  it('is a heading in Turkish upper case', () => {
    const [heading] = byRole(render(<SectionHeading title="Kaldığın yer" />), 'heading');
    expect(text(heading!)).toBe('KALDIĞIN YER');
  });

  it('carries a count at the right', () => {
    expect(text(render(<SectionHeading title="Kaldığın yer" count="2 sa önce" />))).toBe('KALDIĞIN YER2 sa önce');
  });

  it('or a link', () => {
    const page = render(<SectionHeading title="Düzenlenecekler" link={{ label: '3 kaynak ›', onPress: noop }} />);
    expect(byRole(page, 'link').map(nameOf)).toEqual(['3 kaynak ›']);
  });

  it('or an action, its word on screen and its full name for screen readers', () => {
    const page = render(
      <SectionHeading
        title="Notlar"
        action={{ label: 'Ara', accessibilityLabel: 'Bu kaynakta ara', icon: () => null, onPress: noop }}
      />,
    );
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Bu kaynakta ara']);
    expect(text(page)).toBe('NOTLARAra');
  });
});

describe('Section', () => {
  it('opens with its heading', () => {
    const page = render(
      <Section title="Okunuyor">
        <Text>Tanin</Text>
      </Section>,
    );
    expect(text(byRole(page, 'heading')[0]!)).toBe('OKUNUYOR');
    expect(text(page)).toBe('OKUNUYORTanin');
  });

  // The Ayarlar boards: 12 between a section's parts, 8 between running text, 6 under a heading over rows.
  it.each([
    ['default', 'gap-3', false],
    ['text', 'gap-2', false],
    ['rows', 'gap-0', true],
  ] as const)('spaces its parts by %s', (spacing, gap, underHeading) => {
    const page = render(
      <Section title="Hesap" spacing={spacing}>
        <SectionText>Sorular, destek ve KVKK başvuruları için:</SectionText>
      </Section>,
    );
    const section = drawn(page);
    const heading = section.children[0] as Node;
    expect(classes(section)).toContain(gap);
    expect(classes(heading).includes('mb-1.5')).toBe(underHeading);
  });
});

// Ayarlar on a wide screen (#183): one column, each section titled in serif over a rule, a rule under each row.
describe('Sections, wide', () => {
  const page = () =>
    render(
      <Sections wide>
        <Section title="Hesap" spacing="rows">
          <SettingsRows>
            <SettingsRow label="Kütüphaneni dışa aktar" onPress={noop} />
            <SettingsRow label="Hesabı sil" tone="danger" onPress={noop} />
          </SettingsRows>
        </Section>
        <Section title="İletişim" spacing="text">
          <SectionText>Sorular, destek ve KVKK başvuruları için:</SectionText>
        </Section>
      </Sections>,
    );

  it('titles each section in serif as it is written, a line rule under the title', () => {
    const headings = byRole(page(), 'heading');
    expect(headings.map(text)).toEqual(['Hesap', 'İletişim']);
    expect(headings.map((heading) => classes(heading).includes('type-summary'))).toEqual([true, true]);
    const ruled = all(page()).filter((node) => classes(node).includes('border-line'));
    expect(ruled.map(text)).toEqual(['Hesap', 'İletişim']);
  });

  it('rules under every row, the last one too, and draws no rule between the sections', () => {
    const rows = all(page()).filter((node) => classes(node).includes('border-line-soft'));
    expect(rows.map(text)).toEqual(['Kütüphaneni dışa aktar', 'Hesabı sil']);
    expect(rows.every((row) => classes(row).includes('border-b'))).toBe(true);
  });
});

describe('SectionText', () => {
  it('sets running text in the body face', () => {
    const page = render(<SectionText>Sorular, destek ve KVKK başvuruları için:</SectionText>);
    const paragraph = drawn(page);
    expect(text(paragraph)).toBe('Sorular, destek ve KVKK başvuruları için:');
    expect(classes(paragraph)).toContain('type-body');
  });
});

/** The element itself, inside the safe-area frame `render` draws around it. */
const drawn = (page: Node) => (page.children[0] as Node).children[0] as Node;

describe('Toast', () => {
  it('tells what happened and offers to take it back', () => {
    const page = render(<Toast message="“Tanin” silindi" action={{ label: 'Geri al', onPress: noop }} />);
    const [status] = byRole(page, 'status');
    expect(text(status!)).toContain('“Tanin” silindi');
    expect(byRole(status!, 'button').map(nameOf)).toEqual(['Geri al']);
  });

  it('can only tell', () => {
    const page = render(<Toast message="Kopyalandı" />);
    expect(byRole(page, 'button')).toEqual([]);
  });
});
