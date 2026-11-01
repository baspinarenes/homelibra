import { Text } from 'react-native';
import { describe, expect, it } from 'vitest';

import { Section, SectionHeading, SectionText } from '../section-heading';
import { Toast } from '../toast';
import { byRole, css, nameOf, type Node, render, text } from './render';

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
    ['default', '12px', undefined],
    ['text', '8px', undefined],
    ['rows', '0px', '6px'],
  ] as const)('spaces its parts by %s', (spacing, gap, underHeading) => {
    const page = render(
      <Section title="Hesap" spacing={spacing}>
        <SectionText>Sorular, destek ve KVKK başvuruları için:</SectionText>
      </Section>,
    );
    const section = drawn(page);
    const heading = section.children[0] as Node;
    expect(css(section, 'gap')).toBe(gap);
    expect(css(heading, 'marginBottom')).toBe(underHeading);
  });
});

describe('SectionText', () => {
  it('sets running text in the body face', () => {
    const page = render(<SectionText>Sorular, destek ve KVKK başvuruları için:</SectionText>);
    const paragraph = drawn(page);
    expect(text(paragraph)).toBe('Sorular, destek ve KVKK başvuruları için:');
    expect(css(paragraph, 'fontSize')).toBe('15px');
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
