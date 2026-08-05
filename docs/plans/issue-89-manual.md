# Issue #89 — Course-staff/TA manual

Continuing PR #96 (`manual` branch, rebased on `main`). Astro Starlight site under `manual/`.

## Decisions (confirmed with user)

- Base: PR #96's existing Starlight scaffold + `programmes.mdx`, not starting fresh.
- Repo location: stays inside `graaf` repo under `manual/`, not split out.
- Deploy target: undecided, leaning GitHub Pages, not part of this task.
- Branch: rebase `manual` onto `main` (done by user), continue PR #96, keep PR in draft.
- Scope: courses, graphs, domains, subjects, lectures, links (graph alias sharing). Super-admin/programme workflows out of scope (already covered by `programmes.mdx`).
- Page breakdown: one page per entity (not combined "editor manual").
- Screenshots: `shotr` unavailable in this environment. Write placeholders (path + alt text describing exactly what to capture) instead of live screenshots. User fills in real screenshots later.
- Content depth: full step-by-step prose now, written by reading actual app routes/UI, not skeleton-only.

## Steps

1. Refresh `manual/` deps (Astro, Starlight, pnpm-lock.yaml) to current versions. Verify `pnpm install && pnpm build && pnpm dev` work clean.
2. Read app routes/UI for course-staff/TA workflows: `src/routes/graph-editor/**` (courses, graphs, domains, subjects, lectures) and `src/routes/graph/[code]/[alias]` (links).
3. Write content pages under `manual/src/content/docs/`, matching `programmes.mdx` structure:
   - `courses.mdx`
   - `graphs.mdx`
   - `domains.mdx`
   - `subjects.mdx`
   - `lectures.mdx`
   - `links.mdx`
4. Insert image placeholders where screenshots belong.
5. Verify `pnpm build` succeeds, sidebar nav renders sensibly.
6. Commit, push to `manual` branch. Leave PR #96 in draft.
