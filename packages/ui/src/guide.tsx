import { useEffect, useState } from 'react';
import type { ToolId } from './tools';

export interface GuideStep {
  title: string;
  body: string;
}

/** Short first-visit tours, one per tool. Keep each step to a sentence or two. Bump GUIDE_VERSION to show them again. */
export const GUIDE_VERSION = 1;
export const GUIDES: Record<ToolId, GuideStep[]> = {
  hub: [
    { title: 'Welcome to SC Org Tools', body: 'The Hub is home base: your orgs, members, ranks and divisions. Every tool shares your Discord sign-in.' },
    { title: 'Start or join an org', body: 'Create an org and invite people with a code — or open "Find an org" to browse orgs that are recruiting and apply.' },
    { title: 'Your org at a glance', body: "Open an org for its Overview (upcoming ops, fleet, stock), a shared Calendar, and members. Admins set up the public recruitment page in Settings." },
    { title: 'Never miss a thing', body: 'The 🔔 bell collects seats you\'re given, offers on your posts and refinery jobs that are ready. Turn on Discord DMs below to get them on your phone.' },
  ],
  cargo: [
    { title: 'Welcome to Cargo Manifest', body: 'Track every SCU you carry and store. Use the menu at the top to switch between your personal cargo and an org\'s.' },
    { title: 'Ships and grids', body: 'Fleet: add your ships to see their cargo grids in 3D and pack lots into them, box by box.' },
    { title: 'What you own, where', body: 'Inventory and Stockpile show every lot and where it is. Add what you paid or sold for at a terminal and Trade Data updates for everyone.' },
    { title: 'Refinery jobs', body: 'Log ore at a refinery with the time left. You get a notification when it\'s ready, then collect it straight into stock.' },
  ],
  fleet: [
    { title: 'Welcome to Fleet Planner', body: 'Your hangar and your org\'s fleet in one place, with a searchable catalogue of every ship.' },
    { title: 'Add your ships', body: 'Add ships one by one, or use "Import ships…" to bring your whole hangar across from FleetYards or Hangar XPLORer.' },
    { title: 'Pledge to your org', body: 'Pledged ships appear in the org fleet with their crew positions, ready for Ops Planner to fill.' },
  ],
  ops: [
    { title: 'Welcome to Ops Planner', body: 'Plan operations, sign up, and fill crew seats — pick your org with the menu at the top.' },
    { title: 'Seats from your fleet', body: 'Officers add ships from the org fleet and their crew positions become seats. Members sign up and get seated.' },
    { title: 'Discord and calendars', body: 'Officers can post ops and automatic reminders to a Discord channel. Everyone can add ops to their own calendar from the Hub.' },
    { title: 'After the op', body: 'Log income and costs, split the payout by equal shares or custom shares, and write up what happened.' },
  ],
  trade: [
    { title: 'Welcome to Trade Data', body: 'Prices from UEX, refreshed hourly, plus live reports from players using these tools — the newest wins. No sign-in needed to browse.' },
    { title: 'Find a run', body: 'Routes finds the best one-way runs or round trips for your ship\'s SCU and budget. Prices that look wrong are left out.' },
    { title: 'Watch a price, share a price', body: 'Open a commodity for its price history and set alerts. Seen a different price in game? Report it and it updates for everyone.' },
  ],
  market: [
    { title: 'Welcome to the Resource Exchange', body: 'Buy, sell and post contracts with other players — in-game currency (aUEC) only, never real money.' },
    { title: 'Post or respond', body: 'Post what you want or have. Make an offer on someone else\'s post; they accept or decline and you sort out the hand-over on Discord.' },
    { title: 'Trust', body: 'After a trade, both sides confirm and rate it. The badge on each post shows completed trades and how they were rated.' },
  ],
};

const key = (tool: ToolId) => `ot-guide:${tool}:v${GUIDE_VERSION}`;
const seen = (tool: ToolId) => {
  try {
    return localStorage.getItem(key(tool)) === 'done';
  } catch {
    return true; // no storage (private mode etc.): don't nag every visit
  }
};
const markSeen = (tool: ToolId) => {
  try {
    localStorage.setItem(key(tool), 'done');
  } catch {
    /* ignore */
  }
};

/** Opens the tour again from anywhere (the "?" button in the header). */
export const openGuide = () => window.dispatchEvent(new Event('ot-open-guide'));

/** First-visit welcome card. Dismissed for good with "Got it" or ✕; reopen with the header's "?". */
export function Guide({ tool, steps = GUIDES[tool] }: { tool: ToolId; steps?: GuideStep[] }) {
  const [open, setOpen] = useState(() => !seen(tool));
  const [i, setI] = useState(0);
  useEffect(() => {
    const on = () => {
      setI(0);
      setOpen(true);
    };
    window.addEventListener('ot-open-guide', on);
    return () => window.removeEventListener('ot-open-guide', on);
  }, []);
  if (!open || !steps?.length) return null;
  const close = () => {
    markSeen(tool);
    setOpen(false);
  };
  const s = steps[Math.min(i, steps.length - 1)];
  const last = i >= steps.length - 1;
  return (
    <section className="ot-guide" role="region" aria-label="Getting started">
      <button className="ot-guide-x" aria-label="Close guide" onClick={close}>✕</button>
      <div className="ot-guide-step">{i + 1} / {steps.length}</div>
      <h2 className="ot-guide-title">{s.title}</h2>
      <p className="ot-guide-body">{s.body}</p>
      <div className="ot-guide-nav">
        <span className="ot-guide-dots" aria-hidden="true">
          {steps.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}
        </span>
        <span className="ot-grow" />
        {i > 0 && <button className="ot-btn" onClick={() => setI(i - 1)}>Back</button>}
        {!last && <button className="ot-btn" onClick={close}>Skip</button>}
        <button className="ot-btn primary" onClick={() => (last ? close() : setI(i + 1))}>{last ? 'Got it' : 'Next'}</button>
      </div>
    </section>
  );
}
