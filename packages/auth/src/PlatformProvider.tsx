import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Org, OrgAccess, OrgMembership, Profile } from '@orgtools/sc-data';
import { getSupabase, isConfigured, readCookie, signInWithDiscord, writeCookie, type PlatformEnv } from './client';

const ORG_COOKIE = 'orgtools_org';

export interface PlatformState {
  env: PlatformEnv;
  configured: boolean;
  sb: SupabaseClient | null;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  memberships: OrgMembership[];
  currentOrg: OrgMembership | null;
  setCurrentOrg: (orgId: string | null) => void;
  refreshOrgs: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<PlatformState | null>(null);

export function PlatformProvider({ env, children }: { env: PlatformEnv; children: ReactNode }) {
  const sb = useMemo(() => getSupabase(env), [env]);
  const [loading, setLoading] = useState(!!sb);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [orgId, setOrgId] = useState<string | null>(() => (typeof document !== 'undefined' ? readCookie(ORG_COOKIE) : null));

  useEffect(() => {
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [sb]);

  const userId = session?.user.id ?? null;

  const refreshOrgs = useCallback(async () => {
    if (!sb || !userId) {
      setMemberships([]);
      return;
    }
    const { data, error } = await sb
      .from('org_members')
      .select('access, org:orgs(id, slug, name, sc_tag, visibility)')
      .eq('user_id', userId);
    if (error) {
      console.warn('[orgtools] could not load orgs', error.message);
      return;
    }
    const rows = (data ?? []) as unknown as { access: OrgAccess; org: Org | Org[] | null }[];
    setMemberships(
      rows
        .map((r) => ({ access: r.access, org: Array.isArray(r.org) ? r.org[0] : r.org }))
        .filter((m): m is OrgMembership => !!m.org)
        .sort((a, b) => a.org.name.localeCompare(b.org.name)),
    );
  }, [sb, userId]);

  useEffect(() => {
    if (!sb || !userId) {
      setProfile(null);
      setMemberships([]);
      return;
    }
    sb.from('profiles')
      .select('id, discord_id, username, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setProfile((data as Profile) ?? null));
    void refreshOrgs();
  }, [sb, userId, refreshOrgs]);

  const setCurrentOrg = useCallback(
    (id: string | null) => {
      setOrgId(id);
      writeCookie(ORG_COOKIE, id ?? '', env.cookieDomain);
    },
    [env.cookieDomain],
  );

  const currentOrg = memberships.find((m) => m.org.id === orgId) ?? null;

  const value: PlatformState = {
    env,
    configured: isConfigured(env),
    sb,
    loading,
    session,
    user: session?.user ?? null,
    profile,
    memberships,
    currentOrg,
    setCurrentOrg,
    refreshOrgs,
    signIn: async () => {
      if (sb) await signInWithDiscord(sb);
    },
    signOut: async () => {
      if (sb) await sb.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlatform(): PlatformState {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePlatform() must be used inside <PlatformProvider>');
  return v;
}
