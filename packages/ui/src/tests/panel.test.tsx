import { Text } from '../text';
import { describe, expect, it } from 'vitest';

import { KeyHints, Panel, PanelLayout } from '../panel';
import { all, byRole, classes, nameOf, render, text } from './render';

const noop = () => {};

const list = <Text variant="body">Liste</Text>;

/** The column the list stands in: the element right around it. */
const listColumn = (page: ReturnType<typeof render>) =>
  all(page).find((node) =>
    node.children.some((child) => typeof child !== 'string' && child.children.includes('Liste')),
  )!;

const panel = (
  <Panel label="Not" closeLabel="Paneli kapat" onClose={noop} head={<Text variant="body">Kitap · Uğurlu</Text>}>
    <Text variant="body">Ayrıntı</Text>
  </Panel>
);

describe('PanelLayout', () => {
  it('with no panel centres the list in a reading column of 760 px', () => {
    const page = render(<PanelLayout>{list}</PanelLayout>);
    expect(byRole(page, 'region')).toEqual([]);
    expect(classes(listColumn(page))).toContain('max-w-[760px]');
  });

  it('with a panel stands the list in a 440 px column beside it, the panel taking the rest', () => {
    const page = render(<PanelLayout panel={panel}>{list}</PanelLayout>);
    expect(classes(listColumn(page))).toContain('w-[440px]');
    expect(classes(listColumn(page))).not.toContain('max-w-[760px]');
    expect(byRole(page, 'region').map(nameOf)).toEqual(['Not']);
    expect(text(page)).toBe('ListeKitap · UğurluAyrıntı');
  });

  it('beside the icon rail gives the list 420 px', () => {
    const page = render(
      <PanelLayout panel={panel} narrow>
        {list}
      </PanelLayout>,
    );
    expect(classes(listColumn(page))).toContain('w-[420px]');
  });
});

describe('Panel', () => {
  it('has its head and a ✕ that closes it above what it shows', () => {
    const page = render(panel);
    const [region] = byRole(page, 'region');
    expect(byRole(region!, 'button').map(nameOf)).toEqual(['Paneli kapat']);
    expect(classes(region!)).toContain('bg-surface');
  });

  it('puts the head’s own actions before the ✕', () => {
    const page = render(
      <Panel
        label="Not"
        closeLabel="Paneli kapat"
        onClose={noop}
        head={<Text variant="body">Kitap</Text>}
        actions={<Text variant="body">4 / 5</Text>}
      >
        <Text variant="body">Ayrıntı</Text>
      </Panel>,
    );
    expect(text(page)).toBe('Kitap4 / 5Ayrıntı');
  });

  it('keeps a form’s foot under what scrolls, on a rule (#181)', () => {
    const page = render(
      <Panel
        label="Yeni dosya"
        closeLabel="Paneli kapat"
        onClose={noop}
        head={<Text variant="body">Yeni dosya</Text>}
        foot={<Text variant="body">Kaydet</Text>}
      >
        <Text variant="body">Ad</Text>
      </Panel>,
    );
    expect(text(page)).toBe('Yeni dosyaAdKaydet');
    const foot = all(page).find((node) =>
      node.children.some((child) => typeof child !== 'string' && child.children.includes('Kaydet')),
    )!;
    expect(classes(foot)).toContain('border-t');
  });
});

describe('KeyHints', () => {
  it('shows each key beside what it does', () => {
    const page = render(
      <KeyHints
        hints={[
          { keys: '↑↓', label: 'not' },
          { keys: 'Esc', label: 'paneli kapat' },
        ]}
      />,
    );
    expect(text(page)).toBe('↑↓ not' + 'Esc paneli kapat');
  });
});
