import type { ToolId } from './tools';
import { BADGE_BG, BADGE_LINE, TOOL_ICONS } from './icons-data';

export { TOOL_ICONS, iconSvg } from './icons-data';

/** Inline tool icon for the UI (badge or bare glyph). Decorative unless a title is given. */
export function ToolIcon({ id, size = 20, bare = false, title }: { id: ToolId; size?: number; bare?: boolean; title?: string }) {
  const t = TOOL_ICONS[id];
  if (!t) return null;
  const inner = bare
    ? `<g color="${t.color}">${t.glyph}</g>`
    : `<rect x="1" y="1" width="62" height="62" rx="14" fill="${BADGE_BG}" stroke="${BADGE_LINE}" stroke-width="2"/><g color="${t.color}" transform="translate(6 6) scale(.8125)">${t.glyph}</g>`;
  return (
    <svg
      className="ot-toolicon"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : '') + inner }}
    />
  );
}
