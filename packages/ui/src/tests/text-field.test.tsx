import { describe, expect, it } from 'vitest';

import { TextField } from '../text-field';
import { all, css, render, text } from './render';

const inputs = (page: ReturnType<typeof render>) => all(page).filter((n) => n.tag === 'input' || n.tag === 'textarea');

describe('TextField', () => {
  it('labels the field in Turkish upper case, a required one with a star', () => {
    const page = render(<TextField label="Ek bilgi" required value="" onChangeText={() => {}} />);
    expect(text(page)).toContain('EK BİLGİ *');
    expect(inputs(page)[0]!.attrs['aria-label']).toBe('Ek bilgi');
  });

  it('can leave its label unshown when the sheet title says it, still named by it', () => {
    const page = render(<TextField label="Yeni ad" labelHidden value="matbuat" onChangeText={() => {}} />);
    expect(text(page)).toBe('');
    expect(inputs(page)[0]!.attrs['aria-label']).toBe('Yeni ad');
  });

  it('sets an Excerpt in the quote face', () => {
    const draw = (excerpt: boolean) =>
      inputs(render(<TextField label="Alıntı" value="" excerpt={excerpt} multiline onChangeText={() => {}} />))[0]!;
    expect(css(draw(true), 'fontFamily')).toContain('CharisSIL');
    expect(css(draw(false), 'fontFamily')).not.toContain('CharisSIL');
  });

  it('keeps 14 inside its edge and has its 3px focus ring before it is focused', () => {
    // On Android an outline that appears on focus drops the input's padding.
    const [input] = inputs(render(<TextField label="Dosyanın adı" value="" onChangeText={() => {}} />));
    expect(css(input!, 'paddingInline')).toBe('14px');
    expect(css(input!, 'outlineWidth')).toBe('3px');
    expect(css(input!, 'outlineColor')).toBe('transparent');
  });

  it('shows what is wrong below an invalid field', () => {
    const page = render(<TextField label="ISBN" value="975-08-0035" error="Bu bir ISBN’e benzemiyor." />);
    expect(inputs(page)[0]!.attrs['aria-invalid']).toBe('true');
    expect(text(page)).toContain('Bu bir ISBN’e benzemiyor.');
  });

  it('has no hint while the field is fine', () => {
    const page = render(<TextField label="ISBN" value="9789750800354" />);
    expect(inputs(page)[0]!.attrs['aria-invalid']).toBeUndefined();
    expect(text(page)).toBe('ISBN');
  });

  it('writes many lines when asked', () => {
    const page = render(<TextField label="Ek bilgi" multiline value="" />);
    expect(inputs(page)[0]!.tag).toBe('textarea');
  });

  it('takes a six-digit sign-in code as a one-time code from the number pad', () => {
    const page = render(<TextField label="Giriş kodu" code value="48" onChangeText={() => {}} />);
    const attrs = inputs(page)[0]!.attrs;
    expect(attrs.inputMode).toBe('numeric');
    expect(attrs.autoComplete).toBe('one-time-code');
    expect(attrs.maxLength).toBe('6');
  });
});
