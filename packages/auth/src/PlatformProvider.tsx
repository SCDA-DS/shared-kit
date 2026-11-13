import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Org, OrgAccess, OrgMembership, Profile } from '@orgtools/sc-data';
import {
  addSigninMarker, claimSilentSignin, getSupabase, hasSigninMarker, isConfigured, needsSigninMarker, readCookie,
  resetSilentSignin, signInWithDiscord, stripSigninMarker, writeCookie, type PlatformEnv,
} from './client';

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
    // Arrived from another tool where the user is signed in?
    const marked = typeof location !== 'undefined' && hasSigninMarker(location.hash);
    if (marked) history.replaceState(history.state, '', stripSigninMarker(location.href));
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) resetSilentSignin();
      if (!data.session && marked && claimSilentSignin()) {
        void signInWithDiscord(sb, location.href, { silent: true });
        return; // stay "loading" while we bounce through Discord
      }
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

  // Links to other tools carry a sign-in marker while signed in (see client.ts: cross-tool sign-in).
  const signedIn = useRef(false);
  signedIn.current = !!session;
  useEffect(() => {
    if (!sb || typeof document === 'undefined') return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self')) return;
      if (!needsSigninMarker(a.href, location.href, env, signedIn.current)) return;
      e.preventDefault();
      location.assign(addSigninMarker(a.href, location.href));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [sb, env]);

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
