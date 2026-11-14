import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS module
import { convertGrid, maxBox, nameGrids, renderModule, toPresets } from '../scripts/ship-grids-lib.mjs';

const grid = (w: number, l: number, h: number, max: number, external = false) => ({ width: w * 1.25, length: l * 1.25, height: h * 1.25, max_scu_box: max, external, scu: w * l * h });

describe('ship grid generator', () => {
  it('converts metres to SCU cells', () => {
    expect(convertGrid(grid(4, 5, 2, 2))).toEqual({ w: 4, l: 5, h: 2, max: 2, external: false });
    expect(convertGrid({ width: 0, length: 5, height: 2 })).toBeNull();
  });

  it('only trusts a 1 SCU box limit on small grids', () => {
    expect(maxBox(1, 1, 3, 2)).toBe(1);
    expect(maxBox(1, 6, 20, 6)).toBeUndefined();
    expect(maxBox(32, 8, 15, 3)).toBe(32);
    expect(maxBox(3, 2, 2, 2)).toBeUndefined();
  });

  it('names holds and external grids', () => {
    const named = nameGrids([{ external: true }, { external: false }, { external: true }]);
    expect(named.map((g: { name: string }) => g.name)).toEqual(['Hold', 'External 1', 'External 2']);
  });

  it('builds sorted presets, skipping display models, duplicates and ships without cargo', () => {
    const presets = toPresets([
      { game_name: 'MISC Freelancer', manufacturer: { name: 'MISC' }, cargo_grids: [grid(3, 11, 2, 16)] },
      { game_name: 'Drake Cutlass Black', manufacturer: { name: 'Drake' }, cargo_grids: [grid(4, 5, 2, 2), grid(1, 3, 2, 1)] },
      { game_name: 'Drake Cutlass Black', cargo_grids: [grid(9, 9, 9, 32)] },
      { game_name: 'Aegis Avenger Stalker Display', cargo_grids: [grid(2, 4, 1, 4)] },
      { game_name: 'Aegis Gladius', cargo_grids: [] },
    ]);
    expect(presets).toEqual([
      { model: 'Drake Cutlass Black', maker: 'Drake', scu: 46, grids: [{ name: 'Hold 1', w: 4, l: 5, h: 2, max: 2 }, { name: 'Hold 2', w: 1, l: 3, h: 2, max: 1 }] },
      { model: 'MISC Freelancer', maker: 'MISC', scu: 66, grids: [{ name: 'Hold', w: 3, l: 11, h: 2, max: 16 }] },
    ]);
    const mod = renderModule(presets, { fetchedAt: '2026-11-15' });
    expect(mod).toContain("SHIP_GRIDS_FETCHED_AT = \"2026-11-15\"");
    expect(mod).toContain('Drake Cutlass Black');
    expect(mod).toContain('export const GENERATED_SHIPS: GeneratedShip[] = [');
  });
});
