import type { PlatformEnv } from '@orgtools/auth';

export type ToolId = 'hub' | 'cargo' | 'fleet' | 'ops' | 'trade' | 'market';

export interface ToolInfo { id: ToolId; name: string; sub: string; port: number; description: string }

/** Every tool on the platform. Add new tools here (and bump the package version). */
export const TOOLS: ToolInfo[] = [
  { id: 'hub', name: 'Hub', sub: '', port: 5170, description: 'Landing page, tool launcher and org management — structure, ranks, divisions and members.' },
  { id: 'cargo', name: 'Cargo Manifest', sub: 'cargo', port: 5171, description: 'Map, track and arrange ship cargo and inventory — 3D hold layouts, locations, contracts and org stockpiles.' },
  { id: 'fleet', name: 'Fleet Planner', sub: 'fleet', port: 5172, description: 'Org fleet composition, ship roles and crew assignments.' },
  { id: 'ops', name: 'Ops Planner', sub: 'ops', port: 5173, description: 'Plan operations — timings, role slots, sign-ups and Discord posting.' },
  { id: 'trade', name: 'Trade Data', sub: 'trade', port: 5174, description: 'Commodity prices, trade routes and margins.' },
  { id: 'market', name: 'Resource Exchange', sub: 'market', port: 5175, description: 'Public board for resource buy/sell orders and contracts with quality requirements.' },
];

export const PLATFORM_NAME = 'SC Org Tools';

/** Template if set (e.g. pages.dev), else https://<sub>.<domain> (hub on the apex), else http://localhost:<port>. */
export function toolUrl(id: ToolId, env: PlatformEnv): string {
  const t = TOOLS.find((x) => x.id === id);
  if (!t) return '/';
  if (env.toolUrlTemplate) return env.toolUrlTemplate.replaceAll('{id}', t.id).replaceAll('{sub}', t.sub);
  if (env.platformDomain) return `https://${t.sub ? t.sub + '.' : ''}${env.platformDomain}`;
  return `http://localhost:${t.port}`;
}
