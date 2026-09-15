# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repo.

## What this is

PRIME Graph Editor — SvelteKit app, build/browse curriculum "graphs": programs contain courses, courses contain graphs, each graph got domains, subjects, lectures connected by relationships. Public graphs viewed at `/graph/[code]/[alias]`; authoring happen in authenticated `/graph-editor` area.

## Commands

```bash
pnpm dev                  # start dev server (requires db running, see below)
pnpm build                # production build
pnpm check                # svelte-kit sync + svelte-check (type checking)
pnpm lint                 # prettier --check + eslint
pnpm format               # prettier --write

pnpm test                 # unit tests, single run (vitest --run)
pnpm test:unit            # unit tests, watch mode
pnpm test:integration     # spins up db-test via podman/docker, runs prisma db push, runs vitest against vitest.config.integration.ts

pnpm prisma:generate       # regenerate Prisma client after schema.prisma changes
pnpm prisma:migrate        # create/apply a dev migration
pnpm prisma:studio         # inspect the local db
```

Local Postgres: `cd db && podman compose up db` (or `docker compose up db`), then `pnpm prisma db push` and `pnpm prisma db seed`. `NETLIFY_CONTEXT=DEPLOY_PREVIEW pnpm run dev` runs app with auth disabled, cookie-based test users (see `hooks.server.ts`).

Single unit test file: `pnpm vitest run path/to/file.test.ts`. Integration tests live under `src/lib/server/actions/tests/**/*.test.ts`, run sequentially (`fileParallelism: false`) against real Postgres — not mocked.

## Architecture

**Domain model** (`prisma/schema.prisma`): `Program` → `Course` → `Graph` → (`Domain`, `Subject`, `Lecture`). Domains and Subjects each self-relate (`sourceDomains`/`targetDomains`, `sourceSubjects`/`targetSubjects`) forming DAG edges shown in graph view; Subjects optionally belong to Domain and to Lectures. `Sandbox` parallel container to `Course` for graphs not attached to course (compare via `ParentType.COURSE`/`SANDBOX` on `Graph` and `Link`). `Link` = named, shareable alias pointing at one Graph, scoped to either Course or Sandbox — this what `/graph/[code]/[alias]` resolves. `Domain`/`Subject`/`Lecture` all carry manually-maintained `order` field for drag-and-drop ordering — keep consistent when inserting/deleting.

**Authorization** (`src/lib/server/permissions.ts`): permission checks composed as Prisma `where` fragments, not middleware — e.g. `whereHasCoursePermission(user, 'ProgramAdminEditor')` returns `{ OR: [...] }` clause meant spread directly into `prisma.*.findFirst`/`update` `where`. `whereHasGraphCoursePermission` wraps this for graph-scoped mutations, `whereHasSandboxPermission` sandbox equivalent. `role: 'ADMIN'` on `User` = super-admin, bypasses all these (returns `{}`). Permission tiers hierarchical: `ProgramAdmin` ⊂ `ProgramAdminEditor` ⊂ ...`CourseAdmin` ⊂ `CourseAdminEditor`, each level's `where` accumulating previous level's OR clauses.

**Server actions** (`src/lib/server/actions/*.ts`): one static class per aggregate (`DomainActions`, `GraphActions`, `ProgramActions`, `SubjectActions`, etc.), each method takes `(user, form)` where `form` = `SuperValidated` object from `sveltekit-superforms` validated against Zod schema in `src/lib/zod/`. Methods return `setError(form, field, message)` on failure rather than throwing, so callers (form actions in `+page.server.ts`) pass result straight back to client. Mutations touching multiple related rows (e.g. deleting domain plus dangling relations/subject links) wrapped in `prisma.$transaction([...])`. Follow this shape for new actions rather than querying `prisma` directly from route files.

**Auth** (`src/lib/server/auth.ts`, `hooks.server.ts`): Auth.js (`@auth/sveltekit`) with custom SURFconext OIDC provider, Prisma adapter. In `NETLIFY_CONTEXT=DEPLOY_PREVIEW`, `hooks.server.ts` bypasses real auth entirely, authenticates via `user_id` cookie instead (see README's "Running with test users", seeded test users in `prisma/seed.ts`) — don't assume `event.locals.auth()` always goes through Auth.js.

**Graph rendering** (`src/lib/d3/`): interactive graph canvas hand-rolled D3, not charting library. `GraphD3.ts` main orchestrator; composes `NodeToolbox`, `EdgeToolbox`, `BackgroundToolbox`, `CameraToolbox`, `OverlayToolbox`, `TransitionToolbox`, each handling one concern (node rendering, edge drawing/routing, pan/zoom camera, hover/selection overlays, animated transitions). `GraphD3State.svelte.ts`/`graphD3.svelte.ts` bridge imperative D3 layer into Svelte 5 runes state. Changing graph visuals: find relevant Toolbox rather than editing `GraphD3.ts` directly.

**Routes**: `src/routes/graph-editor/**` = authenticated CRUD surface (programs, courses, graphs, sandboxes, users, per-entity settings), generally follows SvelteKit's `+page.server.ts` (load + form actions) / `+page.svelte` pairing, calling into `src/lib/server/actions`. `src/routes/graph/[code]/[alias]/**` = public, read-only graph viewer resolved through `Link`. `src/routes/api/**` holds JSON endpoints used for drag-and-drop reordering/positioning (domains, subjects, lectures) rather than full page loads. `int` param matcher (`src/params/int.ts`) constrains routes like `graphs/[graphid=int]`.

**UI components**: shadcn-svelte (`components.json`, Tailwind v4, `src/lib/components/ui/*`) — prefer composing existing `ui/` primitives over adding new dependencies. Path aliases: `$lib` → `src/lib`.

## Conventions

- Tabs, single quotes, no trailing commas, 100-col print width (Prettier; `prettier-plugin-tailwindcss` auto-sorts class strings) — run `pnpm format` rather than hand-formatting.
- Svelte 5 runes syntax (`.svelte.ts` files) used for reactive state outside components, e.g. in `src/lib/d3`.

## Writing style

Never use em-dashes or AI-slop language, in code comments, commit messages, PR descriptions, or issue/comment text posted to tracker. Write plainly, directly.

## Git actions

Don't run git actions (staging, committing, unstaging, branching, etc.) unless very much needed. If seems necessary, ask first rather than doing it. User may be actively reviewing working tree state, unrequested git commands can interfere with that.

## Agent skills

### Issue tracker

Issues live in PRIME-TU-Delft/graaf's GitHub Issues (via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.
