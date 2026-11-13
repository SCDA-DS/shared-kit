/** Tradeable / minable commodities. Keep alphabetical; update each patch. */
export const COMMODITIES = [
  'Agricium', 'Agricultural Supplies', 'Altruciatoxin', 'Aluminum', 'Ammonia', 'Aphorite', 'Aslarite',
  'Astatine', 'Beryl', 'Bexalite', 'Borase', 'Carbon', 'Chlorine', 'Compboard', 'Construction Materials',
  'Copper', 'Corundum', 'Diamond', 'Distilled Spirits', 'Dolivine', 'Fluorine', 'Gold', 'Hadanite',
  'Helium', 'Hephaestanite', 'Hydrogen', 'Hydrogen Fuel', 'Iodine', 'Iron', 'Laranite', 'Lindinium',
  'Medical Supplies', 'Methane', 'Nitrogen', 'Ouratite', 'Pressurized Ice', 'Processed Food',
  'Quantainium', 'Quantum Fuel', 'Quartz', 'Recycled Material Composite', 'Riccite', 'Savrilium',
  'Scrap', 'Silicon', 'Steel', 'Stileron', 'Stims', 'Taranite', 'Tin', 'Titanium', 'Torite',
  'Tungsten', 'Waste', 'Water',
] as const;

export type Commodity = (typeof COMMODITIES)[number] | (string & {});

/** Quality scale used by refined/mined goods (0–1000). */
export const QUALITY_MIN = 0;
export const QUALITY_MAX = 1000;
