import { Component, useCallback, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { usePlatform } from '@orgtools/auth';
import { Button } from './components';
import { toolUrl, type ToolId } from './tools';

// ---------------------------------------------------------------- error reporting

let sent = 0;
/** Send a browser error to the platform (at most 5 per page load, never throws). */
export function reportError(sb: SupabaseClient | null, tool: string, err: unknown, extra?: string) {
  if (!sb || sent >= 5) return;
  sent++;
  const e = err instanceof Error ? err : new Error(String(err));
  try {
    void sb
      .rpc('report_client_error', {
        p_tool: tool,
        p_message: `${e.name}: ${e.message}`.slice(0, 500),
        p_stack: `${e.stack ?? ''}${extra ? `\n${extra}` : ''}`.slice(0, 4000) || null,
        p_page: typeof location === 'undefined' ? null : location.href.split('#')[0].slice(0, 500),
        p_user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent.slice(0, 300),
      })
      .then(() => {}, () => {});
  } catch {
    /* never let reporting break the page */
  }
}

/** Reports uncaught errors and rejected promises for this page. */
export function useErrorReporting(tool: string) {
  const { sb } = usePlatform();
  useEffect(() => {
    if (!sb || typeof window === 'undefined') return;
    const onError = (e: ErrorEvent) => reportError(sb, tool, e.error ?? e.message);
    const onReject = (e: PromiseRejectionEvent) => reportError(sb, tool, e.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onReject);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onReject);
    };
  }, [sb, tool]);
}

/** Catches render crashes: shows a friendly message, reports it, offers a reload. */
export class ErrorBoundary extends Component<{ tool: string; sb: SupabaseClient | null; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(this.props.sb, this.props.tool, error, info.componentStack ?? undefined);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="ot-panel" role="alert" style={{ padding: 18 }}>
        <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
        <p className="ot-muted">This page hit an error. It has been reported. Reloading usually fixes it.</p>
        <Button variant="primary" onClick={() => location.reload()}>Reload</Button>
      </div>
    );
  }
}

// ---------------------------------------------------------------- notifications

export interface AppNotification {
  id: number;
  tool: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

const TOOL_IDS: ToolId[] = ['hub', 'cargo', 'fleet', 'ops', 'trade', 'market', 'ships', 'crew'];

export function ago(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}

/** Where a notification's link goes: "#…" links are relative to the tool that sent it. */
export function notificationHref(n: Pick<AppNotification, 'tool' | 'link'>, env: Parameters<typeof toolUrl>[1]) {
  if (!n.link) return null;
  if (/^https?:\/\//.test(n.link)) return n.link;
  const tool = (TOOL_IDS as string[]).includes(n.tool) ? (n.tool as ToolId) : 'hub';
  return `${toolUrl(tool, env)}/${n.link.replace(/^\//, '')}`;
}

export function NotificationBell({ pollMs = 60_000 }: { pollMs?: number }) {
  const { sb, user, env } = usePlatform();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    if (!sb || !user) return;
    const r = await sb.from('notifications').select('id, tool, kind, title, body, link, created_at, read_at').order('created_at', { ascending: false }).limit(30);
    if (!r.error) setItems((r.data ?? []) as AppNotification[]);
  }, [sb, user]);
  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), pollMs);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [load, pollMs]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  if (!sb || !user) return null;
  const unread = items.filter((n) => !n.read_at).length;
  const markAll = async () => {
    await sb.rpc('mark_notifications_read', { p_ids: null });
    setItems((xs) => xs.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
  };
  return (
    <div className="ot-bell" ref={box}>
      <button className="ot-btn" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open} onClick={() => setOpen(!open)}>
        🔔{unread > 0 && <span className="ot-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="ot-bell-list" role="dialog" aria-label="Notifications">
          <div className="ot-bell-head">
            <b>Notifications</b>
            {unread > 0 && <button className="ot-linkbtn" onClick={() => void markAll()}>Mark all read</button>}
          </div>
          {items.length === 0 && <p className="ot-muted" style={{ padding: '6px 10px' }}>Nothing yet.</p>}
          {items.map((n) => {
            const href = notificationHref(n, env);
            const inner = (
              <>
                <b>{n.title}</b>
                {n.body && <span>{n.body}</span>}
                <small>{ago(n.created_at)}</small>
              </>
            );
            return href ? (
              <a key={n.id} href={href} className={n.read_at ? '' : 'unread'} onClick={() => void sb.rpc('mark_notifications_read', { p_ids: [n.id] })}>{inner}</a>
            ) : (
              <div key={n.id} className={`ot-bell-item ${n.read_at ? '' : 'unread'}`}>{inner}</div>
            );
          })}
          <a className="ot-bell-foot" href={`${toolUrl('hub', env)}#notifications`}>Get these as Discord DMs →</a>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- donate link

let linksCache: Promise<{ donate_url: string | null }> | null = null;
const LINKS_KEY = 'ot-site-links';

/** Site-wide links set by admins (currently just the optional donate link). Fetched once per page load. */
export function useSiteLinks() {
  const p = usePlatform();
  const [links, setLinks] = useState<{ donate_url: string | null }>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(LINKS_KEY) ?? 'null') ?? { donate_url: null };
    } catch {
      return { donate_url: null };
    }
  });
  useEffect(() => {
    if (!p.sb) return;
    linksCache ??= Promise.resolve(p.sb.rpc('site_links')).then((r) => ((r.data as { donate_url: string | null } | null) ?? { donate_url: null }), () => ({ donate_url: null }));
    let alive = true;
    void linksCache.then((l) => {
      if (!alive) return;
      setLinks(l);
      try {
        sessionStorage.setItem(LINKS_KEY, JSON.stringify(l));
      } catch {
        /* ignore */
      }
    });
    return () => {
      alive = false;
    };
  }, [p.sb]);
  return links;
}

const DONATE_RE = /^https:\/\/(www\.)?(ko-fi\.com|buymeacoffee\.com|paypal\.me|paypal\.com\/donate|github\.com\/sponsors|patreon\.com|liberapay\.com|opencollective\.com)\//;

/** "♥ Support the site" — only when an admin has set a donate link. */
export function DonateLink({ className = '' }: { className?: string }) {
  const { donate_url } = useSiteLinks();
  if (!donate_url || !DONATE_RE.test(donate_url)) return null;
  return (
    <a className={`ot-donate ${className}`} href={donate_url} target="_blank" rel="noreferrer noopener" title="Optional — helps pay for hosting. Everything stays free.">
      ♥ Support the site
    </a>
  );
}

// ---------------------------------------------------------------- feedback

export function FeedbackButton({ tool }: { tool: string }) {
  const { sb } = usePlatform();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'bug' | 'idea' | 'other'>('bug');
  const [msg, setMsg] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  if (!sb) return null;
  const send = async () => {
    setState('sending');
    const r = await sb.rpc('submit_feedback', {
      p_tool: tool, p_kind: kind, p_message: msg.trim(),
      p_page: location.href.split('#')[0].slice(0, 500), p_user_agent: navigator.userAgent.slice(0, 300),
    });
    if (r.error) {
      setError(r.error.message);
      setState('error');
    } else {
      setState('sent');
      setMsg('');
    }
  };
  return (
    <>
      <button className="ot-linkbtn" onClick={() => { setOpen(true); setState('idle'); }}>Feedback / report a bug</button>
      {open && (
        <div className="ot-modal-back" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="ot-panel ot-modal" role="dialog" aria-label="Send feedback">
            <h3 style={{ marginTop: 0 }}>Send feedback</h3>
            {state === 'sent' ? (
              <>
                <p>Thanks — it's been sent to the site admins.</p>
                <Button onClick={() => setOpen(false)}>Close</Button>
              </>
            ) : (
              <>
                <div className="ot-seg" role="group" aria-label="Feedback type">
                  {(['bug', 'idea', 'other'] as const).map((k) => (
                    <button key={k} aria-pressed={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                      {k === 'bug' ? '🐞 Bug' : k === 'idea' ? '💡 Idea' : '💬 Other'}
                    </button>
                  ))}
                </div>
                <textarea
                  className="ot-input"
                  rows={5}
                  aria-label="Feedback message"
                  maxLength={2000}
                  placeholder={kind === 'bug' ? 'What happened, and what did you expect?' : 'Tell us your idea…'}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, font: 'inherit' }}
                />
                {state === 'error' && <p style={{ color: 'var(--ot-red)', fontSize: 13 }}>{error}</p>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <Button variant="primary" disabled={msg.trim().length < 3 || state === 'sending'} onClick={() => void send()}>Send</Button>
                </div>
                <p className="ot-muted" style={{ fontSize: 11, marginBottom: 0 }}>Includes the page address and your browser type, plus your name if you're signed in.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
