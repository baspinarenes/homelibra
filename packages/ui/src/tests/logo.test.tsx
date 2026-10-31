import { describe, expect, it } from 'vitest';

import { Button } from '../button';
import { AppLogo, GoogleLogo } from '../logo';
import { all, byRole, nameOf, render } from './render';

const svgs = (page: ReturnType<typeof render>) => all(page).filter((n) => n.tag === 'svg');

describe('AppLogo', () => {
  it('is an image screen readers call the Homelibra logo, at the size asked', () => {
    const page = render(<AppLogo size={64} label="Homelibra logosu" />);
    const [image] = byRole(page, 'img');
    expect(nameOf(image!)).toBe('Homelibra logosu');
    expect(svgs(page)[0]!.attrs.width).toBe('64');
  });
});

describe('GoogleLogo', () => {
  it('sits before a button label in its own four colours, unread by screen readers', () => {
    const page = render(
      <Button label="Google ile devam et" variant="secondary" icon={GoogleLogo} onPress={() => {}} />,
    );
    const [button] = byRole(page, 'button');
    expect(nameOf(button!)).toBe('Google ile devam et');
    const [logo] = svgs(page);
    expect(logo!.attrs['aria-hidden']).toBe('true');
    const fills = all(logo!).map((n) => n.attrs.fill);
    expect(new Set(fills)).toEqual(new Set(['#EA4335', '#4285F4', '#FBBC05', '#34A853']));
  });
});
