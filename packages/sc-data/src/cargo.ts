/** Standard container sizes in SCU. */
export const CONTAINER_SIZES = [1, 2, 4, 8, 16, 24, 32] as const;
export type ContainerSize = (typeof CONTAINER_SIZES)[number];

/** Container footprint in SCU cells: [width, length, height]. 1 SCU = 1.25 m cube. */
export const CONTAINER_DIMS: Record<ContainerSize, [number, number, number]> = {
  1: [1, 1, 1], 2: [1, 2, 1], 4: [2, 2, 1], 8: [2, 2, 2], 16: [2, 4, 2], 24: [2, 6, 2], 32: [2, 8, 2],
};

export const SCU_METRES = 1.25;

/**
 * One cargo grid: a bounding box of SCU cells plus an optional occupancy mask
 * (string of '1'/'0', index = z*w*l + y*w + x). No mask = every cell usable.
 * Offsets place the grid relative to the ship's other grids.
 */
export interface CargoGrid {
  name: string;
  w: number; l: number; h: number;
  max?: ContainerSize;
  mask?: string;
  ox?: number; oy?: number; oz?: number;
}

export interface ShipPreset { model: string; grids: CargoGrid[]; approximate: boolean }

const g = (name: string, w: number, l: number, h: number, max?: ContainerSize): CargoGrid =>
  max ? { name, w, l, h, max } : { name, w, l, h };

/** Starter presets. SCU totals from community data; grid SHAPES ARE APPROXIMATE until built in the hold builder. */
export const SHIP_PRESETS: ShipPreset[] = [
  { model: 'Drake Cutlass Black', grids: [g('Main hold', 2, 5, 4), g('Rear', 1, 3, 2)], approximate: true },
  { model: 'Crusader C1 Spirit', grids: [g('Fore', 2, 8, 2, 16), g('Aft', 2, 8, 2, 16)], approximate: true },
  { model: 'MISC Freelancer', grids: [g('Hold', 3, 11, 2)], approximate: true },
  { model: 'RSI Constellation Taurus', grids: [g('Hold', 3, 29, 2)], approximate: true },
  { model: 'Crusader C2 Hercules', grids: [g('Hold', 6, 29, 4)], approximate: true },
  { model: 'Drake Caterpillar', grids: [1, 2, 3, 4].map((i) => g(`Module ${i}`, 4, 9, 4)), approximate: true },
  { model: 'MISC Hull C', grids: [1, 2, 3, 4, 5, 6].map((i) => g(`Spindle ${i}`, 8, 12, 8)), approximate: true },
];

export function gridCapacity(grid: CargoGrid): number {
  if (!grid.mask) return grid.w * grid.l * grid.h;
  let n = 0;
  for (let i = 0; i < grid.mask.length; i++) if (grid.mask[i] === '1') n++;
  return n;
}
