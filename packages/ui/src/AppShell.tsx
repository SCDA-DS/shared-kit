import type { ReactNode } from 'react';
import { usePlatform } from '@orgtools/auth';
import { PLATFORM_NAME, TOOLS, toolUrl, type ToolId } from './tools';
import { Button, Note } from './components';

export function AppShell({ tool, children }: { tool: ToolId; children: ReactNode }) {
  const p = usePlatform();
  const current = TOOLS.find((t) => t.id === tool);
  const name = p.profile?.display_name || p.profile?.username || p.user?.email || 'Pilot';

  return (
    <>
      <header className="ot-header">
        <a className="ot-brand" href={toolUrl('hub', p.env)}>
          {PLATFORM_NAME.split(' ').slice(0, -1).join(' ')} <span>{PLATFORM_NAME.split(' ').slice(-1)}</span>
        </a>
        <details className="ot-menu">
          <summary className="ot-btn">{current?.name ?? 'Tools'} ▾</summary>
          <nav className="ot-menu-list">
            {TOOLS.map((t) => (
              <a key={t.id} href={toolUrl(t.id, p.env)} className={t.id === tool ? 'current' : ''}>
                {t.name}
                <small>{t.description}</small>
              </a>
            ))}
          </nav>
        </details>
        <span className="ot-grow" />
        {p.user && p.memberships.length > 0 && (
          <select
            className="ot-select"
            aria-label="Organisation"
            value={p.currentOrg?.org.id ?? ''}
            onChange={(e) => p.setCurrentOrg(e.target.value || null)}
          >
            <option value="">Personal</option>
            {p.memberships.map((m) => (
              <option key={m.org.id} value={m.org.id}>
                {m.org.sc_tag ? `[${m.org.sc_tag}] ` : ''}
                {m.org.name}
              </option>
            ))}
          </select>
        )}
        {p.configured && !p.loading && !p.user && (
          <Button variant="discord" onClick={() => void p.signIn()}>
            Sign in with Discord
          </Button>
        )}
        {p.user && (
          <>
            {p.profile?.avatar_url && <img className="ot-avatar" src={p.profile.avatar_url} alt="" />}
            <span className="ot-muted" style={{ fontSize: 13 }}>{name}</span>
            <Button onClick={() => void p.signOut()}>Sign out</Button>
          </>
        )}
      </header>
      <main className="ot-main">
        {!p.configured && (
          <div style={{ marginBottom: 14 }}>
            <Note>
              Supabase isn't configured yet. Copy <code>.env.example</code> to <code>.env</code> and add your
              Supabase URL and anon key — the app runs in offline mode until then.
            </Note>
          </div>
        )}
        {children}
      </main>
      <footer className="ot-footer">
        Unofficial fan-made tools. Not affiliated with Cloud Imperium Games. Star Citizen® is a registered trademark of
        Cloud Imperium Rights LLC.
      </footer>
    </>
  );
}
