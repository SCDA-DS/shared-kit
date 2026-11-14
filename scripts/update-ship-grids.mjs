#!/usr/bin/env node
// Fetches every vehicle from the Star Citizen Wiki API and regenerates packages/sc-data/src/ships.generated.ts.
//   node scripts/update-ship-grids.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WIKI_API, renderModule, toPresets } from './ship-grids-lib.mjs';

const out = fileURLToPath(new URL('../packages/sc-data/src/ships.generated.ts', import.meta.url));

async function fetchAll() {
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const res = await fetch(`${WIKI_API}?limit=50&page=${page}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`page ${page}: HTTP ${res.status}`);
    const body = await res.json();
    all.push(...(body.data ?? []));
    if (page >= (body.meta?.last_page ?? 1)) break;
  }
  return all;
}

const vehicles = await fetchAll();
const presets = toPresets(vehicles);
if (presets.length < 50) throw new Error(`only ${presets.length} ships with cargo grids — refusing to overwrite`);
writeFileSync(out, renderModule(presets, { fetchedAt: new Date().toISOString().slice(0, 10) }));
console.log(`✓ ${vehicles.length} vehicles, ${presets.length} ships with cargo grids → ${out}`);
