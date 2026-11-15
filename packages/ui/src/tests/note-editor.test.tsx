import { describe, expect, it } from 'vitest';

import { NoteEditor, type NoteEditorLabels, noteEditAction } from '../note-editor';
import { Text } from '../text';
import { all, byRole, classes, nameOf, render, text } from './render';

const editing = { choosing: false, asking: false, canSave: true };

describe('noteEditAction', () => {
  it('saves on ⌘↵, and lets the key go while there is nothing to save', () => {
    expect(noteEditAction('submit', editing)).toBe('save');
    expect(noteEditAction('submit', { ...editing, asking: true })).toBe('save');
    expect(noteEditAction('submit', { ...editing, canSave: false })).toBeNull();
  });

  it('asks before Esc throws changes away, and Esc again goes back to the edit', () => {
    expect(noteEditAction('askDiscard', editing)).toBe('ask');
    expect(noteEditAction('askDiscard', { ...editing, asking: true })).toBe('keepEditing');
  });

  it('closes the edit on Esc when nothing changed', () => {
    expect(noteEditAction('closePanel', editing)).toBe('close');
    expect(noteEditAction('back', editing)).toBe('close');
  });

  it('closes an open choice (Kaynak, Etiketler) first, changes or not', () => {
    const choosing = { ...editing, choosing: true };
    expect(noteEditAction('askDiscard', choosing)).toBe('closeChoice');
    expect(noteEditAction('closePanel', choosing)).toBe('closeChoice');
  });

  it("leaves the list's keys alone: rows, copying, searching, editing again", () => {
    for (const command of ['previous', 'next', 'copyNote', 'copyAll', 'edit', 'searchHere', 'open'] as const) {
      expect(noteEditAction(command, editing)).toBeNull();
    }
  });

  it('keeps N, so Not al never puts an edit away unasked', () => {
    expect(noteEditAction('capture', editing)).toBe('stay');
  });
});

const noop = () => {};

const labels: NoteEditorLabels = {
  title: 'Notu düzenle',
  source: 'Kaynak',
  locator: 'Konum',
  locatorPlaceholder: 's. 45 · vr. 12a · 12:34',
  excerpt: 'Alıntı',
  comment: 'Yorum',
  cancel: 'Vazgeç',
  save: 'Kaydet',
  ask: 'Değişiklikler atılsın mı?',
  discard: 'At',
  keepEditing: 'Düzenlemeye dön',
  deleteNote: 'Notu sil',
};

const note = {
  locator: 's. 112–114',
  excerpt: "Selanik şubesi, 1908'e gelindiğinde fiilen merkezin yerini almıştı.",
  comment: "Bu iddia için dipnot 48'deki arşiv belgesine bak.",
};

function editor(props: Partial<Parameters<typeof NoteEditor>[0]> = {}) {
  return render(
    <NoteEditor
      text={note}
      onTextChange={noop}
      source={<Text variant="sourceTitleSm">Uğurlu, Ahmet Rıza&apos;dan Talat Paşa&apos;ya</Text>}
      tags={<Text variant="labelSm">Selanik · 1908</Text>}
      asking={false}
      canSave
      onSave={noop}
      onCancel={noop}
      onDiscard={noop}
      onKeepEditing={noop}
      onDelete={noop}
      labels={labels}
      {...props}
    />,
  );
}

const fields = (page: ReturnType<typeof render>) => all(page).filter((n) => n.tag === 'input' || n.tag === 'textarea');
const buttons = (page: ReturnType<typeof render>) => byRole(page, 'button').map(nameOf);

describe('NoteEditor', () => {
  it('heads with Notu düzenle, and what the screen puts beside it', () => {
    const page = editor({ aside: <Text variant="link">+ Yeni not</Text> });
    expect(text(page)).toMatch(/^Notu düzenle\+ Yeni not/);
  });

  it('holds the Kaynak field, then Konum, Alıntı and Yorum as they are, then the Tags', () => {
    const page = editor();
    expect(text(page)).toContain("KAYNAKUğurlu, Ahmet Rıza'dan Talat Paşa'ya");
    expect(fields(page).map((field) => field.attrs['aria-label'])).toEqual(['Konum', 'Alıntı', 'Yorum']);
    expect(fields(page)[0]!.attrs.value).toBe('s. 112–114');
    expect(text(fields(page)[1]!)).toBe(note.excerpt);
    expect(text(page)).toContain('Selanik · 1908');
  });

  it('sets the Excerpt in the quote face', () => {
    const [locator, excerpt, comment] = fields(editor());
    expect(classes(excerpt!)).toContain('type-excerpt');
    expect(classes(locator!)).not.toContain('type-excerpt');
    expect(classes(comment!)).not.toContain('type-excerpt');
  });

  it('ends with Vazgeç Esc and Kaydet ⌘↵, then Notu sil in danger', () => {
    const page = editor();
    expect(buttons(page)).toEqual(['Vazgeç', 'Kaydet', 'Notu sil']);
    expect(text(page)).toContain('VazgeçEscKaydet⌘↵');
    const remove = byRole(page, 'button').find((b) => nameOf(b) === 'Notu sil')!;
    expect(all(remove).some((n) => classes(n).includes('text-danger'))).toBe(true);
  });

  it('keeps Kaydet off with nothing to save, and spins it while saving', () => {
    const save = (props: Partial<Parameters<typeof NoteEditor>[0]>) =>
      byRole(editor(props), 'button').find((b) => nameOf(b) === 'Kaydet')!;
    expect(save({}).attrs['aria-disabled']).toBeUndefined();
    expect(save({ canSave: false }).attrs['aria-disabled']).toBe('true');
    expect(save({ saving: true }).attrs['aria-busy']).toBe('true');
  });

  it('asks in place of its buttons before changes are thrown away', () => {
    const page = editor({ asking: true });
    expect(text(page)).toContain('Değişiklikler atılsın mı?');
    expect(buttons(page)).toEqual(['Düzenlemeye dön', 'At', 'Notu sil']);
  });

  it('says what went wrong over its buttons, and why the Note waits at its top', () => {
    expect(text(editor())).not.toContain('Kaydedilemedi.');
    const page = editor({ lead: 'Sunucu bu notu kabul etmedi.', error: 'Kaydedilemedi.' });
    expect(text(page)).toMatch(/^Notu düzenleSunucu bu notu kabul etmedi\./);
    expect(text(page)).toContain('Kaydedilemedi.VazgeçEsc');
  });
});
