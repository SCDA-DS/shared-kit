export interface GameLocation {
  name: string;
  system: 'Stanton' | 'Pyro' | 'Nyx';
  kind: 'city' | 'station' | 'outpost';
}

/** Common trade / storage locations. Free-text locations are always allowed too. */
export const LOCATIONS: GameLocation[] = [
  { name: 'Area18', system: 'Stanton', kind: 'city' },
  { name: 'Lorville', system: 'Stanton', kind: 'city' },
  { name: 'New Babbage', system: 'Stanton', kind: 'city' },
  { name: 'Orison', system: 'Stanton', kind: 'city' },
  { name: 'Port Tressler', system: 'Stanton', kind: 'station' },
  { name: 'Everus Harbor', system: 'Stanton', kind: 'station' },
  { name: 'Baijini Point', system: 'Stanton', kind: 'station' },
  { name: 'Seraphim Station', system: 'Stanton', kind: 'station' },
  { name: 'Grim HEX', system: 'Stanton', kind: 'station' },
  { name: 'ARC-L1 Wide Forest Station', system: 'Stanton', kind: 'station' },
  { name: 'CRU-L1 Ambitious Dream Station', system: 'Stanton', kind: 'station' },
  { name: 'HUR-L1 Green Glade Station', system: 'Stanton', kind: 'station' },
  { name: 'HUR-L2 Faithful Dream Station', system: 'Stanton', kind: 'station' },
  { name: 'MIC-L1 Shallow Frontier Station', system: 'Stanton', kind: 'station' },
  { name: 'MIC-L2 Long Forest Station', system: 'Stanton', kind: 'station' },
  { name: 'Ruin Station', system: 'Pyro', kind: 'station' },
  { name: 'Checkmate', system: 'Pyro', kind: 'station' },
  { name: 'Orbituary', system: 'Pyro', kind: 'station' },
  { name: 'Starlight Service Station', system: 'Pyro', kind: 'station' },
  { name: 'Gaslight', system: 'Pyro', kind: 'station' },
  { name: 'Patch City', system: 'Pyro', kind: 'station' },
  { name: 'Endgame', system: 'Pyro', kind: 'station' },
  { name: 'Levski', system: 'Nyx', kind: 'station' },
];
