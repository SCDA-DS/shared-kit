/** Kept in step with ToolId in tools.ts (this file is also loaded by plain Node in scripts/make-icons.mjs). */
type ToolId = 'hub' | 'cargo' | 'fleet' | 'ops' | 'trade' | 'market' | 'ships';

/**
 * Tool icons: one badge shape for the whole family, a colour and a line glyph per tool.
 * Drawn on a 64×64 grid; glyphs use `currentColor` so they follow the tool colour.
 * Used in the header/menu (ToolIcon) and by scripts/make-icons.mjs for favicons and app icons.
 */
export const TOOL_ICONS: Record<ToolId, { color: string; label: string; glyph: string }> = {
  hub: {
    color: '#3fd0c9',
    label: 'Hub',
    // a hex station with three docking spokes
    glyph: '<path d="M32 11 50.2 21.5v21L32 53 13.8 42.5v-21Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M32 32V11M32 32 13.8 42.5M32 32 50.2 42.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".55"/><circle cx="32" cy="32" r="6.5" fill="currentColor"/>',
  },
  cargo: {
    color: '#f0a94a',
    label: 'Cargo Manifest',
    // an isometric cargo container with a strap
    glyph: '<path d="M32 13 50 22.5v19L32 51 14 41.5v-19Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M14 22.5 32 32l18-9.5M32 32v19" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="m23 17.8 18 9.5v8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>',
  },
  fleet: {
    color: '#6aa8ff',
    label: 'Fleet Planner',
    // three ships in formation
    glyph: '<path d="M32 10 41 30l-9-4.5-9 4.5Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m18 32 7.5 16-7.5-3.6-7.5 3.6ZM46 32l7.5 16-7.5-3.6-7.5 3.6Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity=".7"/>',
  },
  ops: {
    color: '#ef6461',
    label: 'Ops Planner',
    // a target reticle with a waypoint
    glyph: '<circle cx="32" cy="32" r="15" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 10v7M32 47v7M10 32h7M47 32h7" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="4.5" fill="currentColor"/>',
  },
  trade: {
    color: '#5fd38d',
    label: 'Trade Data',
    // a rising price line over a baseline
    glyph: '<path d="M13 50h38" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M14 42 25 31l8 6 17-18" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 18.5h10.5V29" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  market: {
    color: '#b48cff',
    label: 'Resource Exchange',
    // two arrows trading places
    glyph: '<path d="M14 24h33M40 16.5l7.5 7.5-7.5 7.5" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 40H17M24 32.5 16.5 40l7.5 7.5" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>',
  },
  ships: {
    color: '#e8c35a',
    label: 'Ship Matrix',
    // a ship seen from above inside spec brackets
    glyph: '<path d="M32 13 39 33l9 7v5l-16-4-16 4v-5l9-7Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 15v-3h6M52 15v-3h-6M12 49v3h6M52 49v3h-6" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>',
  },
};

export const BADGE_BG = '#0f1720';
export const BADGE_LINE = '#2a3f57';

/** Full badge SVG (rounded square, tool glyph). `rounded=false` gives a full-bleed square for maskable app icons. */
export function iconSvg(id: ToolId, opts: { size?: number; rounded?: boolean; padding?: number } = {}): string {
  const { size = 64, rounded = true, padding = 0 } = opts;
  const t = TOOL_ICONS[id];
  const scale = (64 - padding * 2) / 64;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">` +
    (rounded
      ? `<rect x="1" y="1" width="62" height="62" rx="14" fill="${BADGE_BG}" stroke="${BADGE_LINE}" stroke-width="2"/>`
      : `<rect width="64" height="64" fill="${BADGE_BG}"/>`) +
    `<g color="${t.color}" transform="translate(${padding} ${padding}) scale(${scale})">${t.glyph}</g></svg>`
  );
}

