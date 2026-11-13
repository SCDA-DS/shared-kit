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

export function signInWithDiscord(sb: SupabaseClient, redirectTo = window.location.href) {
  return sb.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo } });
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
