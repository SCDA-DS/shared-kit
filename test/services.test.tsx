// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary, ago, notificationHref, reportError } from '@orgtools/ui';

const env = { supabaseUrl: '', supabaseAnonKey: '', toolUrlTemplate: 'https://scda-{id}.pages.dev' };

describe('platform services', () => {
  it('turns notification links into links to the tool that sent them', () => {
    expect(notificationHref({ tool: 'market', link: '#post=abc' }, env)).toBe('https://scda-market.pages.dev/#post=abc');
    expect(notificationHref({ tool: 'ops', link: '/x' }, env)).toBe('https://scda-ops.pages.dev/x');
    expect(notificationHref({ tool: 'weird', link: '#org=1' }, env)).toBe('https://scda-hub.pages.dev/#org=1');
    expect(notificationHref({ tool: 'trade', link: 'https://example.com/a' }, env)).toBe('https://example.com/a');
    expect(notificationHref({ tool: 'trade', link: null }, env)).toBeNull();
    expect(ago(new Date(Date.now() - 3 * 3600_000).toISOString())).toBe('3 h ago');
  });

  it('reports render crashes and shows a friendly message', () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const sb = { rpc } as never;
    const Boom = () => {
      throw new Error('kaboom');
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary tool="cargo" sb={sb}><Boom /></ErrorBoundary>);
    spy.mockRestore();
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(rpc).toHaveBeenCalledWith('report_client_error', expect.objectContaining({ p_tool: 'cargo', p_message: 'Error: kaboom' }));
  });

  it('never sends more than 5 error reports per page', () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
    for (let i = 0; i < 10; i++) reportError({ rpc } as never, 'hub', new Error(`e${i}`));
    expect(rpc.mock.calls.length).toBeLessThanOrEqual(5);
  });
});

describe('donate link and tool icons', () => {
  it('shows the donate link only for a known donation site', async () => {
    const { PlatformProvider } = await import('@orgtools/auth');
    const { DonateLink, ToolIcon, iconSvg } = await import('@orgtools/ui');
    const off = { supabaseUrl: '', supabaseAnonKey: '' };
    sessionStorage.setItem('ot-site-links', JSON.stringify({ donate_url: 'https://ko-fi.com/scorgtools' }));
    const { unmount } = render(<PlatformProvider env={off}><DonateLink /></PlatformProvider>);
    expect(screen.getByRole('link', { name: /Support the site/ })).toHaveAttribute('href', 'https://ko-fi.com/scorgtools');
    unmount();
    sessionStorage.setItem('ot-site-links', JSON.stringify({ donate_url: 'https://evil.example/pay' }));
    const v2 = render(<PlatformProvider env={off}><DonateLink /></PlatformProvider>);
    expect(screen.queryByRole('link', { name: /Support the site/ })).toBeNull();
    v2.unmount();
    sessionStorage.clear();
    render(<ToolIcon id="trade" title="Trade Data" />);
    expect(screen.getByRole('img', { name: 'Trade Data' })).toBeInTheDocument();
    expect(iconSvg('cargo')).toMatch(/^<svg[^>]+viewBox="0 0 64 64".*#f0a94a/);
  });
});
