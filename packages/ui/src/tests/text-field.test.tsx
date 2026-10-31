import { describe, expect, it } from 'vitest';

import { TextField } from '../text-field';
import { all, render, text } from './render';

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
});
