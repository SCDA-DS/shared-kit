import { PGlite } from '@electric-sql/pglite';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Just enough of Supabase for migrations + row-level-security tests to run in-process (PGlite):
 * the auth schema, auth.uid(), the anon/authenticated/service_role roles and the realtime publication.
 */
export const SUPABASE_STUB = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
create publication supabase_realtime;
`;

export interface TestDb {
  db: PGlite;
  /** Run SQL as a signed-in user (uid) or as anon (null). Rolled back on error, committed otherwise. */
  as<T = Record<string, unknown>>(uid: string | null, sql: string, params?: unknown[]): Promise<T[]>;
  /** Create a user in auth.users (fires the profile trigger). */
  user(id: string, meta?: Record<string, unknown>): Promise<void>;
  close(): Promise<void>;
}

/** Fresh in-memory Postgres with the Supabase stub and the given migration files applied in order. */
export async function createTestDb(migrationFiles: string[]): Promise<TestDb> {
  const db = await PGlite.create();
  await db.exec(SUPABASE_STUB);
  for (const f of migrationFiles) {
    const sql = readFileSync(f, 'utf8');
    try {
      await db.transaction(async (tx) => {
        await tx.exec(sql);
      });
    } catch (e) {
      throw new Error(`Migration failed: ${f}\n${(e as Error).message}`);
    }
  }
  return {
    db,
    async as(uid, sql, params = []) {
      return db.transaction(async (tx) => {
        await tx.exec(`set local role ${uid ? 'authenticated' : 'anon'}`);
        await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
        const r = await tx.query(sql, params);
        return r.rows as never[];
      });
    },
    async user(id, meta = {}) {
      await db.query('insert into auth.users (id, raw_user_meta_data) values ($1, $2)', [id, JSON.stringify(meta)]);
    },
    close: () => db.close(),
  };
}

/** Deterministic UUIDs for tests: uid(1) → 00000000-0000-4000-8000-000000000001 */
export const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** All *.sql files in a folder, sorted (migration order). Empty if the folder doesn't exist. */
export function sqlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => path.join(dir, f));
}
