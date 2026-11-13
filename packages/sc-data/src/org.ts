/** Matches the `public.org_access` enum in platform-core (lowest → highest). */
export const ORG_ACCESS = ['guest', 'member', 'officer', 'admin', 'owner'] as const;
export type OrgAccess = (typeof ORG_ACCESS)[number];

export const hasAccess = (have: OrgAccess | undefined, need: OrgAccess) =>
  !!have && ORG_ACCESS.indexOf(have) >= ORG_ACCESS.indexOf(need);

export interface Org {
  id: string;
  slug: string;
  name: string;
  sc_tag: string | null;
  visibility: 'public' | 'private';
}

export interface Profile {
  id: string;
  discord_id: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface OrgMembership { org: Org; access: OrgAccess }
