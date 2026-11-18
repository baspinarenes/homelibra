import { describe, expect, it } from 'vitest';

import { NoteWriter, type NoteWriterLabels } from '../note-writer';
import { Text } from '../text';
import { all, byRole, classes, nameOf, render, text } from './render';

const noop = () => {};

const labels: NoteWriterLabels = {
  title: 'Yeni Not',
  focusHint: 'odak',
  saveHint: 'kaydet',
  source: 'Kaynak',
  locator: 'Konum',
  locatorPlaceholder: 's. 45 · vr. 12a · 12:34',
  excerpt: 'Alıntı',
  excerptPlaceholder: 'Yazarın sözleri, olduğu gibi…',
  comment: 'Yorum',
  commentPlaceholder: 'Senin düşüncen…',
  save: 'Kaydet',
  footnote: 'Kaydedince alanlar boşalır, Konum bir sonraki not için kalır; sütun hep açık.',
};

function writer(props: Partial<Parameters<typeof NoteWriter>[0]> = {}) {
  return render(
    <NoteWriter
      text={{ locator: 's. 201', excerpt: '', comment: '' }}
      onTextChange={noop}
      locatorNote="s. 201'den devam"
      tags={<Text variant="labelSm">+ etiket</Text>}
      canSave
      onSave={noop}
      labels={labels}
      {...props}
    />,
  );
}

const fields = (page: ReturnType<typeof render>) => all(page).filter((n) => n.tag === 'input' || n.tag === 'textarea');
const save = (page: ReturnType<typeof render>) => byRole(page, 'button').find((b) => nameOf(b) === 'Kaydet')!;

describe('NoteWriter', () => {
  it('heads with Yeni Not, and the keys that reach it: N to come back, ⌘↵ to save', () => {
    expect(text(writer())).toMatch(/^Yeni NotN odak · ⌘↵ kaydet/);
  });

  it('leaves the heading to a panel whose head already names the writing', () => {
    const page = writer({ heading: false });
    expect(byRole(page, 'heading')).toEqual([]);
    expect(text(page)).not.toContain('odak');
    expect(fields(page).map((field) => field.attrs['aria-label'])).toEqual(['Konum', 'Alıntı', 'Yorum']);
  });

  it('holds Konum with where the next Note goes on from, then Alıntı and Yorum, then the Tags', () => {
    const page = writer();
    expect(fields(page).map((field) => field.attrs['aria-label'])).toEqual(['Konum', 'Alıntı', 'Yorum']);
    expect(fields(page)[0]!.attrs.value).toBe('s. 201');
    expect(text(page)).toContain("s. 201'den devam");
    expect(text(page)).toContain('+ etiket');
  });

  it('sets the Excerpt in the quote face, its placeholder the author’s words', () => {
    const [, excerpt, comment] = fields(writer());
    expect(classes(excerpt!)).toContain('type-excerpt');
    expect(excerpt!.attrs.placeholder).toBe('Yazarın sözleri, olduğu gibi…');
    expect(classes(comment!)).not.toContain('type-excerpt');
  });

  it('has no Kaynak field on a Source page; the global Not al gives it one on top', () => {
    expect(text(writer())).not.toContain('KAYNAK');
    const page = writer({ source: <Text variant="sourceTitleSm">Uğurlu, Ahmet Rıza</Text> });
    expect(text(page)).toMatch(/kaydetKAYNAKUğurlu, Ahmet RızaKONUM/);
  });

  it('ends with Kaydet ⌘↵ on the accent, and the footnote under it', () => {
    const page = writer();
    expect(text(save(page))).toBe('Kaydet⌘↵');
    expect(classes(save(page))).toContain('bg-accent');
    expect(text(page)).toMatch(/Kaydet⌘↵Kaydedince alanlar boşalır/);
  });

  it('keeps Kaydet off with nothing to save, and spins it while saving', () => {
    expect(save(writer()).attrs['aria-disabled']).toBeUndefined();
    expect(save(writer({ canSave: false })).attrs['aria-disabled']).toBe('true');
    expect(save(writer({ saving: true })).attrs['aria-busy']).toBe('true');
  });

  it('says what went wrong over Kaydet', () => {
    expect(text(writer())).not.toContain('Kaydedilemedi.');
    expect(text(writer({ error: 'Kaydedilemedi.' }))).toContain('Kaydedilemedi.Kaydet⌘↵');
  });
});
