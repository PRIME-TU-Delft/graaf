# GRAAF: Current State & Missing Implementation

## Overall Assessment

The project is **functionally complete at its core** — the graph editor works end-to-end for courses (create program → course → graph → domains → subjects → lectures → share via link). The remaining work is a mix of **bugs, missing UX polish, two incomplete major features (admin panel and sandbox public links), and zero test/documentation coverage**.

---

## Part 1: Confirmed Bugs (from Issues + Code Evidence)

### #62 — Graph Editor Reactivity (Critical, Reopened)

**What the code shows:** The graph editor uses two distinct update mechanisms — SvelteKit form actions (for domain/subject/lecture CRUD) and direct `fetch()` PATCH calls (for reorder, position, style). The D3 canvas only re-renders when the SvelteKit `data` prop changes (i.e. after a form action causes a page reload/invalidation). API-only updates silently modify the DB but leave the D3 instance stale.

Specific confirmed bugs from [src/routes/graph-editor/graphs/\[graphid=int\]/domains/+page.svelte](src/routes/graph-editor/graphs/[graphid=int]/domains/+page.svelte):

- **Domain style change does not update edge color** — `handleChangeStyle()` calls `graphD3Store.graphD3?.setDomainStyle()` to update node color, but `EdgeToolbox.updatePosition()` derives edge stroke from `source.style` and is never called afterward. Edges stay the old color.
- **Changing style does not revalidate** — the `GraphValidator` only runs in `+layout.server.ts` on server load; a style PATCH never triggers it. The `IssueIndicator` can show stale issue state.
- **Reordering domains/lectures does not revalidate** — same root cause. The `handleDndFinalize()` functions save reorder via API but never rerun the validator.
- **Stale view on navigation** — `graphView` is a module-level singleton (`graphState` / `graphView` in [src/lib/d3/GraphD3State.svelte.ts](src/lib/d3/GraphD3State.svelte.ts) and [src/lib/d3/GraphD3View.svelte.ts](src/lib/d3/GraphD3View.svelte.ts)). Navigating from domains → subjects → back to domains can show the stale D3 instance if the component is not fully unmounted.

**Root cause / proposed fix (per the issue):** Convert all API PATCH calls (order, position, style) into form actions, remove the REST API entirely. This lets SvelteKit `invalidate()` drive all re-renders. The concern about D3 node dragging (which calls fetch live on every drag end) is the main obstacle — Svelte 5's `use:enhance` with `applyAction: false` could mitigate this.

---

### #63 — Can Only Add One Link Per Session (Bug)

**What the code shows:** [src/lib/components/graphSettings/CreateLink.svelte](src/lib/components/graphSettings/CreateLink.svelte) initializes a `superForm` that uses `$effect` to reset `$formData.name = ''` whenever `graph` changes. But `graph` does not change after a successful submit — only `newLinkForm` does. Superforms reuses the same form instance, and the `$effect` does not run again after submission. The fix would be resetting the form explicitly in the `onResult` callback (currently only `dialogOpen = false` is called) and potentially using `invalidateAll()` or `id`-based form isolation.

---

### #66 — Breadcrumbs Broken/Inconsistent (Bug)

**What the code shows:** [src/lib/components/NavigationBar.svelte](src/lib/components/NavigationBar.svelte) generates breadcrumbs by splitting `page.url.pathname` on `/` and capitalizing each segment. It has hardcoded heuristics:
- Numbers after `courses` → "Graph N"
- Numbers after `programs` → "Program N"

No actual entity names (course name, graph name, sandbox name) are ever fetched. This produces:

| Path | Actual output | Should be |
|---|---|---|
| `/graph-editor/programs/5/settings` | Home > Programs > Program 5 > Settings | Home > Programs > [program name] > Settings |
| `/graph-editor/sandboxes/3/settings` | Home > Sandboxes > 3 > Settings | Home > Sandboxes > [sandbox name] > Settings |
| `/graph-editor/graphs/12/domains` | Home > Graphs > Graph 12 > Domains | Home > Courses > [course code] > [graph name] > Domains |

Fixing this requires either passing entity names down via layout data and making `NavigationBar` prop-aware, or using a store/context populated by each layout's `load()`.

---

### #81 — Linking Courses Does Not Update AddCourses Menu (Bug)

**What the code shows:** [src/lib/components/addCourse/LinkCourses.svelte](src/lib/components/addCourse/LinkCourses.svelte) uses `rowSelection = {}` in `onResult` to reset the table selection but never calls `invalidate()` or `invalidateAll()`. The `courses` prop passed to `LinkCourseDataTable` is derived from the parent's `data.courses` which is a `Promise` (streamed via `await` in [src/routes/graph-editor/+page.svelte](src/routes/graph-editor/+page.svelte)). After a successful link, the data is stale — courses already linked still appear in the picker.

---

### #26 — Link Permissions Bug (Bug + Missing Feature)

**What the code shows:** The `duplicateGraph` action checks permissions on the *destination* (where you're copying *to*) and `availableCourses` / `availableSandboxes` are filtered by user permissions, so you can only duplicate *to* places you have admin/editor rights. However, there is no explanation shown in the UI when a course cannot be moved into a program. **No "why can't I do this" feedback exists anywhere.** The linking table shows courses with no indication of which are already linked or why certain operations are unavailable.

---

### #94 — Course Codes/Link URLs Cannot Contain Spaces (Bug)

**What the code shows:** [src/lib/settings.ts](src/lib/settings.ts): `COURSE_CODE_REGEX = /^[A-Za-z0-9]*$/` — hard rejects spaces. [src/lib/zod/courseSchema.ts](src/lib/zod/courseSchema.ts) enforces this on new course creation. The public viewer route at `/graph/[code]/[alias]` does URL-decode path segments, so a space in the DB would become `%20` in the URL. Legacy TU Delft course codes that contain spaces cannot be imported or created. A regex change plus a DB migration strategy for existing data is needed.

---

### Embed URL — `lectureId` Parameter Key Mismatch (Bug)

**What the code shows:** [src/lib/components/graphSettings/EmbedLink.svelte](src/lib/components/graphSettings/EmbedLink.svelte) sets `url.searchParams.set('lectureId', ...)` (lowercase `d`) but deletes `url.searchParams.delete('lecture')` (wrong key entirely). The public viewer in [src/routes/graph/\[code\]/\[alias\]/+page.svelte](src/routes/graph/[code]/[alias]/+page.svelte) reads `page.url.searchParams.get('lectureID')` (capital `ID`). The embed builder uses `lectureId`, so generated embed URLs with a lecture selected will silently ignore the lecture parameter — the viewer starts on the wrong lecture with no error.

---

## Part 2: Incomplete Features

### #84 — Admin Panel (Not Implemented)

**What the code shows:** [src/routes/graph-editor/users/+page.svelte](src/routes/graph-editor/users/+page.svelte) is a bare skeleton — it only renders a numbered list of user nicknames. There are no actions, no role management, no search. The server load at [users/+page.server.ts](src/routes/graph-editor/users/+page.server.ts) fetches all users with their course/program relations but the page does nothing with that data.

The full admin panel per issue #84 is **entirely missing**:
- Promote user to admin / demote to user — no form, no action
- Search users — no search bar
- Add/remove users from a program directly from the admin panel — no form
- Per-user privilege list — data is loaded but never rendered

---

### Sandbox Public Links — Not Supported (Incomplete Feature)

**What the code shows:** [src/routes/graph-editor/sandboxes/\[sandboxId=int\]/settings/+page.svelte](src/routes/graph-editor/sandboxes/[sandboxId=int]/settings/+page.svelte) hardcodes:

```svelte
getLinkURL={() => `SANDBOX LINKS ARE NOT SUPPORTED YET`}
```

with a `<!-- TODO Placeholder for link URL -->` comment. The `Link` model in Prisma supports `parentType: SANDBOX` and `sandboxId`, so the DB schema is ready. The public viewer route at `/graph/[code]/[alias]` only looks up graphs via `course.code` — there is no equivalent sandbox public route. The work needed:

1. Create a public route (e.g. `/graph/sandbox/[sandboxId]/[alias]`)
2. Implement the server load to look up the sandbox graph by ID and alias
3. Wire up `getLinkURL` in the sandbox settings page to generate the correct URL

---

### #79 — Cannot Leave a Sandbox as Editor (Missing Feature)

**What the code shows:** [src/routes/graph-editor/sandboxes/\[sandboxId=int\]/settings/superUsers/EditorTable.svelte](src/routes/graph-editor/sandboxes/[sandboxId=int]/settings/superUsers/EditorTable.svelte) only renders `RemoveEditor` for each editor. However, `RemoveEditor` is an owner-only action. A non-owner editor viewing this list cannot remove themselves. There is no "Leave sandbox" button or action for editors. The `SandboxActions.editSuperUser` supports `role: 'revoke'` but there is no self-service path to call it from a non-owner perspective.

---

### #83 — Course Graph Status Badges (Partially Implemented)

**What the code shows:** `IssueIndicator.svelte` is implemented and wired up on the domains/subjects/lectures pages, and `GraphValidator` runs on graph load inside the editor. However, the **course overview page** ([src/routes/graph-editor/courses/\[courseCode\]/+page.svelte](src/routes/graph-editor/courses/[courseCode]/+page.svelte)) shows graphs as cards with only `domains`, `subjects`, and `links` counts — there is no status indicator showing whether a graph has errors or warnings. Users must open each graph individually to discover structural issues. A summary status badge on each graph card is missing. This issue has 7 sub-issues attached, suggesting it covers a broader set of status-related features.

---

### #75 — Archived Course Indicator Missing (UX Gap)

**What the code shows:** The settings page correctly shows archive/restore in the danger zone, and `isArchived` is a real boolean field on the `Course` model. But neither the course overview page ([src/routes/graph-editor/courses/\[courseCode\]/+page.svelte](src/routes/graph-editor/courses/[courseCode]/+page.svelte)) nor the course cards on the home page ([src/routes/graph-editor/+page.svelte](src/routes/graph-editor/+page.svelte)) display any archived badge or visual distinction. An archived course is visually identical to an active one unless you navigate to its settings page.

---

## Part 3: Missing UX Polish

### #17 — Form Loading States (Inconsistently Applied)

**What the code shows:** Some forms already use `$delayed` correctly — `CreateLink.svelte` and `LinkCourses.svelte` both pass `loading={$delayed}` to `Form.FormButton`. However, many other form components do not destructure `delayed` from `superForm()` at all (e.g. `CreateNewDomain.svelte`, `CreateNewSubject.svelte`, `ChangeLecture.svelte`, `EditCourseName.svelte`). A pass through all form components is needed to ensure every submit button shows a loading spinner and is disabled while submitting, preventing duplicate submissions.

---

### #53 — Missing Tooltips on Icon Buttons

**What the code shows:** Icon-only buttons appear throughout — delete, archive/unarchive, edit, add relation, reorder, etc. — but the `Tooltip` components from [src/lib/components/ui/tooltip/](src/lib/components/ui/tooltip/) are never used anywhere in the application. The entire tooltip UI primitive exists but is completely unused. Every icon-only button needs a `<Tooltip>` wrapper with descriptive text.

---

### #95 — "Add Super User" Dropdown Is Not a Searchbar (UX)

**What the code shows:** [src/lib/components/SelectUsers.svelte](src/lib/components/SelectUsers.svelte) already implements a `Command.Input` searchable picker and is functional. The issue refers to places where the old plain `<select>` HTML element is still used for user selection instead of this component. The replacement component is ready; it just needs to be wired in consistently everywhere user selection occurs (program super users, course super users, sandbox editors).

---

### #89 — Help Pages Content (Empty Shell)

**What the code shows:** [src/lib/components/Help.svelte](src/lib/components/Help.svelte) is a working dialog wrapper that accepts a `title` and `children` snippet. It is used only on the home page ([src/routes/graph-editor/+page.svelte](src/routes/graph-editor/+page.svelte)) with a short placeholder paragraph. It is not present on any other page — the graph editor, domains view, subjects view, lectures view, course settings, program settings, and sandbox pages all have no help content. Each page needs contextual help content authored and a `<Help>` instance placed.

---

### #93 — No 404 / Error Pages

**What the code shows:** There are no `+error.svelte` files anywhere in the route tree (glob search returns zero results). SvelteKit's unstyled default error page is shown for all errors — 404s, 500s, and permission errors alike. The graph load at [src/routes/graph-editor/graphs/\[graphid=int\]/+layout.server.ts](src/routes/graph-editor/graphs/[graphid=int]/+layout.server.ts) correctly calls `error(404, ...)` but it falls through to the default. At minimum, a branded `src/routes/+error.svelte` is needed; route-specific error pages (e.g. for the graph editor) would provide a better experience.

---

## Part 4: Infrastructure Gaps

### #85 — Database Migration Strategy

**What the code shows:** The Prisma schema exists but there is no `prisma/migrations/` folder in the repository. This means either migrations have never been run (relying on `db push` for development) or they are gitignored. For production deployment with real user data, a formal migration history must be established before any schema changes can be safely made. Any fix to issue #94 (spaces in course codes) would require a migration.

---

### #90 — Integration Testing (Not Started)

**What the code shows:** `vitest.config.integration.ts` and `scripts/run-integration.sh` exist as stubs, and `src/test.test.ts` is a minimal placeholder file. There are zero integration tests written. The server actions, API routes, and permission logic — which are the most critical paths in the application — have no automated test coverage whatsoever.

---

### #91 — Code Documentation (Not Started)

No JSDoc, no inline comments beyond occasional `TODO` markers. The D3 toolbox classes (`NodeToolbox`, `EdgeToolbox`, `TransitionToolbox`, etc.) are the most complex parts of the codebase and are entirely undocumented. The graph validator's cycle detection algorithm has two `// TODO this is sloppy` comments indicating the author intended to revisit it.

---

## Summary Table

| # | Issue | Severity | Status in Code |
|---|---|---|---|
| #62 | Graph D3 reactivity / stale state after API calls | High | Partially mitigated (node style), still broken for edges, reorder, revalidation |
| #63 | Can only add one link per session | High | Bug in superforms reset pattern in `CreateLink.svelte` |
| — | Sandbox public graph links not working | High | Hardcoded `"SANDBOX LINKS ARE NOT SUPPORTED YET"` string |
| #84 | Admin panel | High | Skeleton page only — no functionality implemented |
| Embed URL | `lectureId` vs `lectureID` param mismatch | Medium | Generated embed URLs silently ignore lecture selection |
| #26 | Link permission / table UX feedback | Medium | No "why can't you" UI; permissions logic itself is correct |
| #66 | Breadcrumbs broken | Medium | URL-splitting heuristic, no entity names ever shown |
| #81 | AddCourses stale after linking | Medium | Missing `invalidate()` call after successful form submit |
| #79 | Cannot leave sandbox as editor | Medium | No self-service leave action for non-owners |
| #83 | Course graph status badges | Medium | Issues computed in editor but not surfaced on course overview |
| #75 | Archived course indicator | Low | `isArchived` field exists but never shown in course cards or overview |
| #17 | Form loading/delayed states | Low | Inconsistently applied — missing on most form components |
| #53 | Tooltips on icon buttons | Low | Tooltip component exists in UI library, never used in app |
| #95 | Super user picker not a searchbar | Low | `SelectUsers.svelte` is ready, not wired everywhere |
| #89 | Help page content | Low | Shell component exists, content missing on all pages except home |
| #93 | 404 / error pages | Low | No `+error.svelte` files exist anywhere in the route tree |
| #94 | Spaces in course codes/link URLs | Low | Regex hard-blocks spaces; needs schema change + migration |
| #85 | Database migration strategy | Infra | No `migrations/` folder in repo |
| #90 | Integration tests | Infra | Config stubs only, zero tests written |
| #91 | Code documentation | Infra | No docs; D3 toolboxes and validator are entirely undocumented |
