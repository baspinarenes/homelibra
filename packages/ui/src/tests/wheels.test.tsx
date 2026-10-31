import { describe, expect, it } from 'vitest';

import { Wheels } from '../wheels';
import { byRole, nameOf, render, text } from './render';

const noop = () => {};
const days = [{ value: null, label: '—' }, ...[1, 2, 3].map((d) => ({ value: d, label: `${d}` }))];
const months = [
  { value: null, label: '—' },
  { value: 1, label: 'Muharrem (M)' },
  { value: 2, label: 'Safer (S)' },
];
const years = [1309, 1310, 1311].map((y) => ({ value: y, label: `${y}` }));

describe('Wheels', () => {
  it('heads each wheel and tells a screen reader where it stands', () => {
    const page = render(
      <Wheels
        columns={[
          { label: 'Gün', options: days, value: 2, onChange: noop, width: 56 },
          { label: 'Ay', options: months, value: 2, onChange: noop, align: 'start' },
          { label: 'Yıl', options: years, value: 1310, onChange: noop, width: 84 },
        ]}
      />,
    );
    const wheels = byRole(page, 'slider');
    expect(wheels.map(nameOf)).toEqual(['Gün', 'Ay', 'Yıl']);
    expect(wheels.map((w) => w.attrs['aria-valuetext'])).toEqual(['2', 'Safer (S)', '1310']);
    expect(text(page)).toContain('GÜN');
  });

  it('shows a shut wheel standing on —', () => {
    const page = render(
      <Wheels
        columns={[
          { label: 'Gün', options: days, value: null, onChange: noop, disabled: true },
          { label: 'Ay', options: months, value: null, onChange: noop },
        ]}
      />,
    );
    const [day, month] = byRole(page, 'slider');
    expect(day!.attrs['aria-disabled']).toBe('true');
    expect(day!.attrs['aria-valuetext']).toBe('—');
    expect(month!.attrs['aria-disabled']).toBeUndefined();
  });
});
