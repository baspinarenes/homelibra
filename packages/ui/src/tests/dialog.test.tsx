import { describe, expect, it } from 'vitest';

import { Dialog } from '../dialog';
import { byRole, nameOf, render, text } from './render';

const noop = () => {};

describe('Dialog', () => {
  it('asks, with the destructive answer last', () => {
    const page = render(
      <Dialog
        visible
        message="Tanin ve 14 notu silinecek."
        cancelLabel="Vazgeç"
        confirmLabel="Sil"
        destructive
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    const [dialog] = byRole(page, 'alertdialog');
    expect(text(dialog!)).toContain('Tanin ve 14 notu silinecek.');
    expect(byRole(dialog!, 'button').map(nameOf)).toEqual(['Vazgeç', 'Sil']);
  });

  it('is not there until asked', () => {
    const page = render(
      <Dialog visible={false} message="…" cancelLabel="Vazgeç" confirmLabel="Sil" onConfirm={noop} onCancel={noop} />,
    );
    expect(byRole(page, 'alertdialog')).toEqual([]);
  });
});
