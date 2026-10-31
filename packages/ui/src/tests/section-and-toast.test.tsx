import { Text } from 'react-native';
import { describe, expect, it } from 'vitest';

import { Section, SectionHeading } from '../section-heading';
import { Toast } from '../toast';
import { byRole, nameOf, render, text } from './render';

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
});

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
