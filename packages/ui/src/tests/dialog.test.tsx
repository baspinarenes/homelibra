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

  it('offers a third answer between the two, held back while the main one runs', () => {
    const page = render(
      <Dialog
        visible
        message="2 not henüz gönderilmedi; çıkarsan bu telefonda bekler."
        cancelLabel="Vazgeç"
        alternative={{ label: 'Yine de çık', onPress: noop }}
        confirmLabel="Önce gönder"
        busy
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    const buttons = byRole(page, 'button');
    expect(buttons.map(nameOf)).toEqual(['Vazgeç', 'Yine de çık', 'Önce gönder']);
    expect(buttons.map((button) => button.attrs['aria-disabled'])).toEqual(['true', 'true', 'true']);
  });

  it('is not there until asked', () => {
    const draw = (visible: boolean) =>
      render(
        <Dialog
          visible={visible}
          message="…"
          cancelLabel="Vazgeç"
          confirmLabel="Sil"
          onConfirm={noop}
          onCancel={noop}
        />,
      );
    expect(byRole(draw(true), 'alertdialog')).toHaveLength(1);
    expect(byRole(draw(false), 'alertdialog')).toEqual([]);
  });
});
