import { describe, expect, it } from 'vitest';
import { COMMODITIES, CONTAINER_DIMS, CONTAINER_SIZES, LOCATIONS, ORG_ACCESS, SHIP_PRESETS, gridCapacity, hasAccess } from '@orgtools/sc-data';

describe('sc-data', () => {
  it('container footprints match their SCU volume', () => {
    for (const s of CONTAINER_SIZES) {
      const [w, l, h] = CONTAINER_DIMS[s];
      expect(w * l * h).toBe(s);
    }
  });
  it('presets have the known SCU totals', () => {
    const total = (m: string) => SHIP_PRESETS.find((p) => p.model === m)!.grids.reduce((a, g) => a + gridCapacity(g), 0);
    expect(total('Drake Cutlass Black')).toBe(46);
    expect(total('Crusader C2 Hercules')).toBe(696);
    expect(total('MISC Hull C')).toBe(4608);
    expect(total('Drake Caterpillar')).toBe(576);
    expect(SHIP_PRESETS.every((p) => p.approximate)).toBe(true);
  });
  it('gridCapacity counts mask cells', () => {
    expect(gridCapacity({ name: 'g', w: 2, l: 2, h: 1, mask: '1010' })).toBe(2);
    expect(gridCapacity({ name: 'g', w: 2, l: 2, h: 2 })).toBe(8);
  });
  it('commodity and location lists are clean', () => {
    expect(new Set(COMMODITIES).size).toBe(COMMODITIES.length);
    expect([...COMMODITIES]).toEqual([...COMMODITIES].sort((a, b) => a.localeCompare(b)));
    expect(new Set(LOCATIONS.map((l) => l.name)).size).toBe(LOCATIONS.length);
  });
  it('org access ladder', () => {
    expect(ORG_ACCESS).toEqual(['guest', 'member', 'officer', 'admin', 'owner']);
    expect(hasAccess('admin', 'officer')).toBe(true);
    expect(hasAccess('member', 'officer')).toBe(false);
    expect(hasAccess(undefined, 'guest')).toBe(false);
  });
});
