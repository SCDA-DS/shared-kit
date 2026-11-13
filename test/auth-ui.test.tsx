// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PlatformProvider, getSupabase, isConfigured, readCookie, usePlatform, writeCookie } from '@orgtools/auth';
import { AppShell, TOOLS, toolUrl } from '@orgtools/ui';

beforeEach(() => cleanup());
const off = { supabaseUrl: '', supabaseAnonKey: '' };

describe('auth', () => {
  it('detects configuration and returns no client when unconfigured', () => {
    expect(isConfigured(off)).toBe(false);
    expect(isConfigured({ supabaseUrl: 'http://x', supabaseAnonKey: 'k' })).toBe(true);
    expect(getSupabase(off)).toBeNull();
  });
  it('creates a client when configured', () => {
    const sb = getSupabase({ supabaseUrl: 'http://127.0.0.1:54321', supabaseAnonKey: 'test-key' });
    expect(sb).not.toBeNull();
    expect(typeof sb!.auth.signInWithOAuth).toBe('function');
  });
  it('reads and writes cookies', () => {
    writeCookie('orgtools_test', 'a b/c');
    expect(readCookie('orgtools_test')).toBe('a b/c');
    expect(readCookie('missing')).toBeNull();
  });
  it('usePlatform requires the provider', () => {
    const Bad = () => {
      usePlatform();
      return null;
    };
    expect(() => render(<Bad />)).toThrow(/PlatformProvider/);
  });
  it('provides an offline state when unconfigured', () => {
    const Show = () => {
      const p = usePlatform();
      return <div>{`${p.configured}|${p.loading}|${p.user === null}|${p.memberships.length}`}</div>;
    };
    render(<PlatformProvider env={off}><Show /></PlatformProvider>);
    expect(screen.getByText('false|false|true|0')).toBeInTheDocument();
  });
});

describe('ui', () => {
  it('builds tool URLs for local dev and production', () => {
    expect(toolUrl('cargo', off)).toBe('http://localhost:5171');
    expect(toolUrl('cargo', { ...off, platformDomain: 'example.com' })).toBe('https://cargo.example.com');
    expect(toolUrl('hub', { ...off, platformDomain: 'example.com' })).toBe('https://example.com');
    const t = { ...off, platformDomain: 'example.com', toolUrlTemplate: 'https://scda-{id}.pages.dev' };
    expect(toolUrl('market', t)).toBe('https://scda-market.pages.dev');
    expect(toolUrl('hub', t)).toBe('https://scda-hub.pages.dev');
  });
  it('tool registry has unique ids, ports and subdomains', () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((t) => t.port)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((t) => t.sub)).size).toBe(TOOLS.length);
  });
  it('AppShell shows the tool menu, setup note and disclaimer when offline', () => {
    render(
      <PlatformProvider env={off}>
        <AppShell tool="cargo"><p>body</p></AppShell>
      </PlatformProvider>,
    );
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByText(/Supabase isn't configured/)).toBeInTheDocument();
    expect(screen.getByText(/Not affiliated with Cloud Imperium Games/)).toBeInTheDocument();
    for (const t of TOOLS) expect(screen.getByRole('link', { name: new RegExp(t.name) })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sign in with Discord/ })).toBeNull();
  });
  it('AppShell offers Discord sign-in when configured', () => {
    render(
      <PlatformProvider env={{ supabaseUrl: 'http://127.0.0.1:54321', supabaseAnonKey: 'k' }}>
        <AppShell tool="hub"><p>x</p></AppShell>
      </PlatformProvider>,
    );
    expect(screen.queryByText(/Supabase isn't configured/)).toBeNull();
  });
});
