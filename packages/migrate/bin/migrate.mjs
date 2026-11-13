#!/usr/bin/env node
// Per-repo SQL migration runner. Each repo applies only its own db/migrations/*.sql,
// tracked in platform_meta.migrations (repo, version) so repos never clash.
//
//   node ../shared-kit/packages/migrate/bin/migrate.mjs --repo cargo-manifest [--dir db/migrations]
//
// platform-core's own schema is NOT applied with this runner — it uses Supabase migrations
// (supabase/migrations, deployed by the Supabase GitHub integration). Tool schemas depend on it.
//
// DATABASE_URL comes from the environment or a .env file in the current folder.
import postgres from 'postgres';
import { existsSync, readFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};

if (!process.env.DATABASE_URL && existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*(.*)\s*$/);
    if (m) process.env.DATABASE_URL = m[1].replace(/^["']|["']$/g, '');
  }
}

const repo = arg('--repo');
const dir = path.resolve(arg('--dir', 'db/migrations'));
const url = process.env.DATABASE_URL;
if (!repo || !url) {
  console.error('Usage: DATABASE_URL=postgres://... orgtools-migrate --repo <repo-name> [--dir db/migrations]');
  process.exit(1);
}

// Supabase poolers need SSL and no prepared statements; local databases don't use SSL.
const local = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(url);
const sql = postgres(url, { max: 1, onnotice: () => {}, prepare: false, ssl: local ? false : 'require' });
try {
  await sql`create schema if not exists platform_meta`;
  await sql`create table if not exists platform_meta.migrations (
    repo text not null, version text not null, applied_at timestamptz not null default now(),
    primary key (repo, version))`;
  const done = new Set((await sql`select version from platform_meta.migrations where repo = ${repo}`).map((r) => r.version));
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const body = await readFile(path.join(dir, file), 'utf8');
    process.stdout.write(`→ ${repo}/${file} … `);
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into platform_meta.migrations (repo, version) values (${repo}, ${file})`;
    });
    console.log('ok');
    applied++;
  }
  console.log(`✓ ${repo}: ${applied ? applied + ' applied' : 'up to date'}`);
} catch (e) {
  console.error(`\n✗ ${repo}: ${e.message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
