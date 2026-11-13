import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PlatformEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** e.g. ".example.com" in production so the session is shared by every tool subdomain. Leave empty locally. */
  cookieDomain?: string;
  /** e.g. "example.com" — used to build tool URLs. Empty = localhost ports. */
  platformDomain?: string;
  /**
   * Overrides tool URLs before a custom domain exists, e.g. "https://scda-{id}.pages.dev".
   * Placeholders: {id} (hub, cargo, fleet…) and {sub} (subdomain, "" for the hub).
   */
  toolUrlTemplate?: string;
}

export const isConfigured = (env: PlatformEnv) => !!env.supabaseUrl && !!env.supabaseAnonKey;

let client: SupabaseClient | null = null;

/** One Supabase client per page. Session lives in cookies so it is shared across tools. */
export function getSupabase(env: PlatformEnv): SupabaseClient | null {
  if (!isConfigured(env)) return null;
  if (client) return client;
  client = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookieOptions: {
      domain: env.cookieDomain || undefined,
      path: '/',
      sameSite: 'lax',
      secure: typeof location !== 'undefined' && location.protocol === 'https:',
    },
  });
  return client;
}

/**
 * Discord sign-in. `silent` asks Discord to skip its consent screen (prompt=none) when the user has already
 * authorised the app — used to carry a login from one tool to another without user interaction.
 */
export function signInWithDiscord(sb: SupabaseClient, redirectTo = window.location.href, { silent = false } = {}) {
  return sb.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo, ...(silent ? { queryParams: { prompt: 'none' } } : {}) },
  });
}

// ---------------------------------------------------------------- cross-tool sign-in
// Until the tools share a parent domain (env.cookieDomain), each tool is its own site and can't see the others'
// login cookie. Instead of passing tokens around (refresh tokens must not be shared), a link from a signed-in tool
// carries a marker; the next tool sees it and signs itself in through Discord silently, getting its own session.

export const SIGNIN_MARKER = 'ot_signin';
const TRIED_KEY = 'ot_signin_tried';

/** Matches origins built from env.toolUrlTemplate, e.g. https://scda-{id}.pages.dev. */
export function toolOriginPattern(env: PlatformEnv): RegExp | null {
  const origin = env.toolUrlTemplate?.match(/^https?:\/\/[^/?#]+/i)?.[0];
  if (!origin) return null;
  const esc = origin
    .split(/\{(?:id|sub)\}/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[a-z0-9-]*');
  return new RegExp(`^${esc}$`, 'i');
}

/** Does following `href` from `here` need the sign-in marker? Only for another tool's origin, while signed in. */
export function needsSigninMarker(href: string, here: string, env: PlatformEnv, signedIn: boolean): boolean {
  if (!signedIn || env.cookieDomain) return false;
  const pattern = toolOriginPattern(env);
  if (!pattern) return false;
  try {
    const to = new URL(href, here);
    return to.origin !== new URL(here).origin && pattern.test(to.origin) && !hasSigninMarker(to.hash);
  } catch {
    return false;
  }
}

export const hasSigninMarker = (hash: string) => new URLSearchParams(hash.replace(/^#/, '')).has(SIGNIN_MARKER);

export function addSigninMarker(href: string, here: string): string {
  const u = new URL(href, here);
  const params = new URLSearchParams(u.hash.replace(/^#/, ''));
  params.set(SIGNIN_MARKER, '1');
  u.hash = params.toString();
  return u.toString();
}

export function stripSigninMarker(href: string): string {
  const u = new URL(href);
  const params = new URLSearchParams(u.hash.replace(/^#/, ''));
  params.delete(SIGNIN_MARKER);
  const rest = params.toString();
  u.hash = rest;
  return rest ? u.toString() : u.toString().replace(/#$/, '');
}

/** One silent attempt per browser tab session, so a failed Discord bounce can't loop. */
export function claimSilentSignin(storage: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage): boolean {
  if (storage.getItem(TRIED_KEY)) return false;
  storage.setItem(TRIED_KEY, '1');
  return true;
}
export function resetSilentSignin(storage: Pick<Storage, 'removeItem'> = sessionStorage) {
  storage.removeItem(TRIED_KEY);
}

/** Tiny cookie helpers for cross-tool UI state (e.g. the selected org). */
export function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
export function writeCookie(name: string, value: string, domain?: string) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'max-age=31536000', 'samesite=lax'];
  if (domain) parts.push(`domain=${domain}`);
  if (location.protocol === 'https:') parts.push('secure');
  document.cookie = parts.join('; ');
}
