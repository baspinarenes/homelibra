import { describe, expect, it } from 'vitest';

import { NoteRow } from '../note-row';
import { all, byRole, classes, render, text } from './render';

const noop = () => {};

const labels = { withComment: '+ yorum' };

const note = {
  locator: 's. 112–114',
  excerpt: "Selanik şubesi, 1908'e gelindiğinde fiilen merkezin yerini almıştı.",
  comment: "Bu iddia için dipnot 48'deki arşiv belgesine bak.",
};

function row(props: Partial<Parameters<typeof NoteRow>[0]> = {}) {
  return render(<NoteRow density="full" {...note} labels={labels} onPress={noop} {...props} />);
}

describe('NoteRow', () => {
  it('in full shows the Locator, the Excerpt whole and ↳ the Comment, then why the Note is here', () => {
    const page = row({ why: { text: 'Selanik, 1908', via: 'note' } });
    const [button] = byRole(page, 'button');
    expect(text(button!)).toBe(`s. 112–114${note.excerpt}↳ ${note.comment}Selanik, 1908`);
  });

  it('in full sets the Excerpt in the quote face, on as many lines as it takes', () => {
    const excerpt = all(row()).find((node) => text(node) === note.excerpt && classes(node).includes('type-excerpt'));
    expect(excerpt).toBeDefined();
    expect(excerpt!.attrs.class).not.toMatch(/r-whiteSpace-/);
  });

  it('names the Source that brought a Note in another colour than its own Tags', () => {
    const own = all(row({ why: { text: 'Selanik', via: 'note' } })).find((node) => text(node) === 'Selanik');
    const source = all(row({ why: { text: 'kaynak: Selanik', via: 'source' } })).find(
      (node) => text(node) === 'kaynak: Selanik',
    );
    expect(classes(own!)).toContain('text-chip-ink');
    expect(classes(source!)).toContain('text-warn');
  });

  it('writes — for a Note with no Locator', () => {
    expect(text(row({ locator: null }))).toMatch(/^—/);
  });

  it('in compact gives the Note one line: its Excerpt, and + yorum for the Comment it also has', () => {
    const full = row({ why: { text: 'Selanik', via: 'note' } });
    expect(text(full)).toContain(note.comment);
    expect(text(full)).toContain('Selanik');

    const compact = row({ density: 'compact', why: { text: 'Selanik', via: 'note' } });
    expect(text(compact)).toBe(`s. 112–114${note.excerpt}+ yorum`);
    const line = all(compact).find((node) => text(node) === note.excerpt);
    // react-native-web keeps one line with white-space: nowrap, an atomic class named after it.
    expect(line!.attrs.class).toMatch(/r-whiteSpace-/);
  });

  it('in compact shows the Comment on its line when the Note has no Excerpt', () => {
    const compact = row({ density: 'compact', excerpt: null });
    expect(text(compact)).toBe(`s. 112–114${note.comment}`);
    const line = all(compact).find((node) => text(node) === note.comment);
    expect(classes(line!)).toContain('type-comment-sm');
  });

  it('marks the words a search matched', () => {
    const page = row({
      marks: {
        excerpt: [
          { text: 'Selanik', hit: true },
          { text: " şubesi, 1908'e gelindiğinde fiilen merkezin yerini almıştı.", hit: false },
        ],
      },
    });
    const marked = all(page).filter((node) => classes(node).includes('bg-mark'));
    expect(marked.map(text)).toEqual(['Selanik']);
  });

  it('in compact marks + yorum when the search matched words of the Comment, out of sight on that line', () => {
    const plain = row({ density: 'compact' });
    const inComment = row({
      density: 'compact',
      marks: {
        excerpt: [{ text: note.excerpt, hit: false }],
        comment: [
          { text: "Bu iddia için dipnot 48'deki ", hit: false },
          { text: 'arşiv', hit: true },
          { text: ' belgesine bak.', hit: false },
        ],
      },
    });
    const withComment = (page: ReturnType<typeof row>) => all(page).find((node) => text(node) === '+ yorum')!;
    expect(classes(withComment(plain))).not.toContain('bg-mark');
    expect(classes(withComment(inComment))).toContain('bg-mark');
  });

  it('ignores marks that no longer spell the text (the Note changed since the search)', () => {
    const page = row({ marks: { excerpt: [{ text: 'Eski', hit: true }] } });
    expect(all(page).filter((node) => classes(node).includes('bg-mark'))).toEqual([]);
    expect(text(page)).toContain(note.excerpt);
  });

  it('tells screen readers which row the panel shows, and frames it in the accent', () => {
    const plain = byRole(row(), 'button')[0]!;
    const shown = byRole(row({ selected: true }), 'button')[0]!;
    expect(plain.attrs['aria-current']).toBeUndefined();
    expect(classes(plain)).toContain('border-transparent');
    expect(shown.attrs['aria-current']).toBe('true');
    expect(classes(shown)).toContain('border-accent');
    expect(classes(shown)).toContain('bg-accent-soft');
    expect(classes(shown)).not.toContain('border-transparent');
  });
});
