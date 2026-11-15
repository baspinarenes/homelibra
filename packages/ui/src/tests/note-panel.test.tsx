import { describe, expect, it } from 'vitest';

import { NotePanel, type NotePanelLabels } from '../note-panel';
import { Text } from '../text';
import { all, byRole, classes, nameOf, render, text } from './render';

const noop = () => {};

const labels: NotePanelLabels = {
  panel: 'Not',
  close: 'Paneli kapat',
  previous: 'Önceki not',
  next: 'Sonraki not',
  place: (n, total) => `${total} notun ${n}.`,
  copy: 'Kopyala',
  edit: 'Düzenle',
  openSource: 'Kaynağı aç',
  siblings: 'Bu kaynaktan diğer notlar',
  notInView: 'bu dosyada değil',
};

const note = {
  locator: 's. 112–114',
  excerpt: "Selanik şubesi, 1908'e gelindiğinde fiilen merkezin yerini almıştı.",
  comment: "Bu iddia için dipnot 48'deki arşiv belgesine bak.",
  tags: ['Selanik', '1908'],
};

const source = { type: 'Kitap', title: "Selim Uğurlu, Ahmet Rıza'dan Talat Paşa'ya", date: '2014' };

const place = {
  n: 4,
  total: 5,
  previous: { id: 'n3', locator: 's. 45' },
  next: { id: 'n5', locator: 's. 201' },
};

const siblings = [
  {
    id: 'n1',
    locator: null,
    text: 'Genel değerlendirme: taşra şubelerini merkezden bağımsız ele alan nadir çalışmalardan.',
    inView: true,
  },
  {
    id: 'n3',
    locator: 's. 45',
    text: 'Şubelerin çoğu, merkezden talimat beklemeden kendi nizamnamelerini yazdı.',
    inView: true,
  },
  { id: 'n5', locator: 's. 201', text: "Enver Bey'in Resne'den dağa çıkışı.", inView: false },
];

function panel(props: Partial<Parameters<typeof NotePanel>[0]> = {}) {
  return render(
    <NotePanel
      note={note}
      source={source}
      place={place}
      siblings={siblings}
      labels={labels}
      onGo={noop}
      onCopy={noop}
      onEdit={noop}
      onOpenSource={noop}
      onClose={noop}
      {...props}
    />,
  );
}

describe('NotePanel', () => {
  it('is a region named for the Note, closed by its ✕', () => {
    const page = panel();
    expect(byRole(page, 'region').map(nameOf)).toEqual(['Not']);
    expect(byRole(page, 'button').map(nameOf)).toContain('Paneli kapat');
  });

  it('heads with the Source line: its type, author and title, and date', () => {
    expect(text(panel())).toMatch(/^KİTAP · Selim Uğurlu, Ahmet Rıza'dan Talat Paşa'ya · 2014/);
  });

  it('walks the Source: ‹ the Note before, n / m, the Note after ›', () => {
    const page = panel();
    const buttons = byRole(page, 'button').map(nameOf);
    expect(buttons.slice(0, 2)).toEqual(['Önceki not: s. 45', 'Sonraki not: s. 201']);
    expect(text(page)).toContain('‹ s. 45');
    expect(text(page)).toContain('4 / 5');
    expect(text(page)).toContain('s. 201 ›');
    expect(all(page).some((node) => node.attrs['aria-label'] === '5 notun 4.')).toBe(true);
  });

  it('greys out ‹ on the Source’s first Note', () => {
    const first = panel({ place: { ...place, n: 1, previous: null } });
    const before = byRole(first, 'button').find((b) => nameOf(b) === 'Önceki not')!;
    expect(before.attrs['aria-disabled']).toBe('true');
    const middle = byRole(panel(), 'button').find((b) => nameOf(b).startsWith('Önceki not'))!;
    expect(middle.attrs['aria-disabled']).toBeUndefined();
  });

  it('shows the Note in focus: Locator, the Excerpt large, the Comment, its Tags and what to do with it', () => {
    const page = panel();
    const excerpt = all(page).find((node) => text(node) === note.excerpt && classes(node).includes('type-excerpt-lg'));
    expect(excerpt).toBeDefined();
    expect(text(page)).toContain(`s. 112–114${note.excerpt}${note.comment}Selanik1908`);
    expect(byRole(page, 'button').map(nameOf)).toEqual(expect.arrayContaining(['Kopyala', 'Düzenle', 'Kaynağı aç']));
    expect(text(page)).toContain('Kopyala⌘C');
    expect(text(page)).toContain('DüzenleE');
  });

  it('lists the Source’s other Notes, those not in this view faded and named so', () => {
    const page = panel();
    expect(text(page)).toContain('BU KAYNAKTAN DİĞER NOTLAR');
    const rows = byRole(page, 'button').filter((button) => classes(button).includes('border-line-soft'));
    expect(rows.map(text)).toEqual([
      '—Genel değerlendirme: taşra şubelerini merkezden bağımsız ele alan nadir çalışmalardan.',
      's. 45Şubelerin çoğu, merkezden talimat beklemeden kendi nizamnamelerini yazdı.',
      "s. 201Enver Bey'in Resne'den dağa çıkışı. · bu dosyada değil",
    ]);
    const faded = (row: (typeof rows)[number]) => all(row).some((node) => classes(node).includes('text-muted'));
    expect(rows.map(faded)).toEqual([false, false, true]);
  });

  it('leaves out the Source line, the walk and the other Notes where the screen has none', () => {
    const page = panel({ source: undefined, place: undefined, siblings: undefined });
    expect(text(panel())).toContain('4 / 5');
    expect(text(page)).not.toContain('4 / 5');
    expect(text(page)).not.toContain('KİTAP');
    expect(text(page)).not.toContain('BU KAYNAKTAN DİĞER NOTLAR');
    expect(text(page)).toContain(note.excerpt);
  });

  it('shows what it is given in place of the Note’s detail (its editor)', () => {
    const page = panel({ children: <Text variant="body">Düzenleyici</Text> });
    expect(text(page)).toContain('Düzenleyici');
    expect(text(page)).not.toContain(note.excerpt);
    expect(byRole(page, 'button').map(nameOf)).not.toContain('Kopyala');
  });
});
