# shared-kit

Shared packages for every SC Org Tools app. Packages ship TypeScript source; the consuming
app's Vite build compiles them.

| Package | Purpose |
|---|---|
| `@orgtools/sc-data` | Game data + shared types: commodities, locations, container sizes, ship presets, org access levels |
| `@orgtools/auth` | Supabase browser client (cross-subdomain cookie session), Discord sign-in, `PlatformProvider` / `usePlatform()` with orgs |
| `@orgtools/ui` | Design tokens, `AppShell` (header, tool switcher, org switcher, account), basic components, tool registry |
| `@orgtools/migrate` | Tiny per-repo SQL migration runner (`platform_meta.migrations`) |
| `@orgtools/testing` | Test helpers: in-process Postgres (PGlite) with a Supabase stub, `createTestDb()`, run SQL as a user for RLS tests |

React and Supabase are **peer dependencies** — each app provides them, and its Vite config
dedupes them so there is only one copy at runtime.

**Versioning:** bump the package version on any change. Apps pin versions; locally they link
with `file:../shared-kit/packages/<name>`. Publishing to GitHub Packages comes when the repos go online.
