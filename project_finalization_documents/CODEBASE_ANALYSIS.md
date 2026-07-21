# GRAAF: Comprehensive Codebase Analysis

## Overview

GRAAF is a SvelteKit-based graph editor tool for university lecturers (TU Delft / PRIME group) to visually structure course knowledge. The core abstraction is a three-level hierarchy: **Domains** (high-level knowledge areas) → **Subjects** (specific topics) → **Lectures** (teaching sessions). Everything is visualized as an interactive D3 force-directed graph with directed edges representing prerequisites and dependencies.

---

## 1. Technology Stack & Infrastructure

### Core Dependencies

| Area          | Library                                | Version         |
| ------------- | -------------------------------------- | --------------- |
| Framework     | SvelteKit                              | 2.21.1          |
| Build         | Vite                                   | 6.3.5           |
| ORM           | Prisma                                 | 6.7.0           |
| Auth          | @auth/sveltekit + @auth/prisma-adapter | 1.9.1 / 2.9.0   |
| Visualization | D3.js                                  | 7.9.0           |
| UI            | Bits UI, Tailwind CSS 4, Lucide Svelte | 1.5.3 / 4.1.7   |
| Forms         | SvelteKit Superforms + Zod             | 2.25.0 / 3.24.4 |
| Drag & Drop   | @thisux/sveltednd, svelte-dnd-action   | —               |
| Tables        | @tanstack/table-core                   | 8.21.3          |
| Notifications | svelte-sonner                          | 1.0.1           |
| Testing       | Vitest                                 | 3.1.4           |
| Package mgr   | pnpm                                   | —               |

### Infrastructure

**Dockerfile** — Node 22-Alpine, installs pnpm via corepack, builds SvelteKit with Prisma code generation, writes `version.txt` timestamp. Entrypoint: `pnpm prisma migrate deploy & node build`.

**compose.yaml** — Three services: `caddy` (reverse proxy, ports 80/443), `web` (SvelteKit on port 3000), `db` (PostgreSQL 16 with persistent volume).

**Caddyfile** — Domain: `beta.prime-applets.ewi.tudelft.nl`, reverse proxy to `web:3000`, includes `X-Clacks-Overhead: GNU Terry Pratchett` header.

**svelte.config.js** — Vite preprocessing, Netlify adapter when `BUILD_ENV=netlify`, Node adapter otherwise.

**Required env vars:** `DATABASE_URL`, `AUTH_SECRET`, `SURFCONEXT_ISSUER`, `SURFCONEXT_CLIENT_ID`, `SURFCONEXT_CLIENT_SECRET`. Optional: `DEBUG`, `TESTING`, `NETLIFY_CONTEXT`.

---

## 2. Database Schema (prisma/schema.prisma)

### Enums

- `UserRole`: `USER` | `ADMIN`
- `ParentType`: `COURSE` | `SANDBOX`
- `DomainStyle`: 10 values — `PROSPEROUS_RED`, `ENERGIZING_ORANGE`, `SUNNY_YELLOW`, `ELECTRIC_GREEN`, `CONFIDENT_TURQUOISE`, `MYSTERIOUS_BLUE`, `MAJESTIC_PURPLE`, `POWERFUL_PINK`, `NEUTRAL_GRAY`, `SERIOUS_BROWN`

### Models

**User** — `id: String @cuid`, `role: UserRole`, `nickname?`, `firstName?`, `lastName?`, `email @unique`, `emailVerified?`, `image?`. Relations: accounts, sessions, sandboxes (owner), sandbox_editors, program_editors, program_admins, course_editors, course_admins, pinned_courses.

**Account / Session / VerificationToken** — Standard Auth.js adapter models.

**Program** — `id: Int @autoincrement`, `name: String`. Relations: `courses` (many-many via "ProgramCourse"), `editors` / `admins` (users).

**Course** — `id: Int @autoincrement`, `code: String @unique`, `name: String`, `isArchived: Boolean @default(false)`. Relations: programs, graphs, editors, admins, pinnedBy (users), links.

**Sandbox** — `id: Int @autoincrement`, `name: String`, `ownerId: String`. Relations: `owner` (cascade delete), `editors`, `graphs`, `links`.

**Graph** — `id: Int @autoincrement`, `name: String`, `parentType: ParentType`, `courseId?`, `sandboxId?`. Unique: `[courseId, sandboxId, name]`. Relations: domains, subjects, lectures, links.

**Domain** — `id: Int @autoincrement`, `name: String`, `style: DomainStyle?`, `order: Int`, `x: Int @default(0)`, `y: Int @default(0)`, `graphId: Int`. Relations: `subjects`, `sourceDomains` ↔ `targetDomains` (self-many-many "DomainRelation").

**Subject** — `id: Int @autoincrement`, `name: String @default("")`, `order: Int`, `x/y: Int @default(0)`, `graphId: Int`, `domainId?: Int`. Relations: `domain`, `lectures`, `sourceSubjects` ↔ `targetSubjects` (self-many-many "SubjectRelation").

**Lecture** — `id: Int @autoincrement`, `name: String @default("")`, `order: Int`, `graphId: Int`. Relations: `subjects` (many-many "LectureSubject").

**Link** — `id: Int @autoincrement`, `name: String`, `isArchived: Boolean @default(false)`, `parentType: ParentType`, `courseId?`, `sandboxId?`, `graphId: Int`. Unique: `[courseId, name]`. Relations: course, sandbox, graph.

---

## 3. Authentication System

### src/lib/server/auth.ts

SURFconext (Dutch educational OIDC federation) provider:

- `fetchUserInfo(accessToken)` → calls `{ISSUER}/oidc/userinfo`, returns `{ nickname, firstName, lastName, email }`
- PrismaAdapter maps auth models to database
- Sessions use database strategy, JWT disabled

### src/hooks.server.ts

`handle: Handle` runs on every request:

1. **Chrome DevTools path** → returns workspace JSON config
2. **`NETLIFY_CONTEXT == 'DEPLOY_PREVIEW'`** → cookie-based user ID lookup, bypasses OIDC, redirects to `/auth` if no user
3. **Production** → uses Auth.js `SvelteKitAuth` handle

`authFunction({ locals }, userId?)` — fetches `User` from DB by session or explicit ID, sets 1-year expiry.

### src/routes/auth/

- `+page.svelte` — Login UI with SURFconext button and error display; includes `TestUser.svelte` for dev environments
- `signin/+page.server.ts` — Redirects to provider sign-in
- `signout/+page.server.ts` — Signs out and redirects home
- `get-all-testusers/+server.ts` — API for dev: returns all users
- `toggle-admin/+server.ts` — Dev-only endpoint to toggle admin role

---

## 4. Permission System

### src/lib/server/permissions.ts (server-side — Prisma where clauses)

All functions return Prisma `where` clause fragments embedded directly in DB queries, making unauthorized access structurally impossible.

**Program permissions:**

- `OnlySuperAdmin` → `{ role: 'ADMIN' }` on user
- `ProgramAdmin` → `{ admins: { some: { id } } }` OR super admin
- `ProgramAdminEditor` → admins OR editors OR super admin

`whereHasProgramPermission(user, has)` — returns Prisma where object.

**Course permissions:**

- `ProgramAdmin` → via linked programs
- `CourseAdminORProgramAdminEditor` — course-level admin OR program admin/editor
- `CourseAdminEditorORProgramAdminEditor` — course-level admin/editor OR program admin/editor

`whereHasCoursePermission(user, has)` — composes program + course permissions with `OR`.
`whereHasGraphCoursePermission(user, has)` — wraps above for graph queries: `{ course: { ...coursePermission } }`.

**Sandbox permissions:**

- `Owner` → `{ ownerId: user.id }`
- `OwnerOREditor` → owner OR `{ editors: { some: { id } } }`

### src/lib/utils/permissions.ts (client-side runtime checks)

```typescript
hasProgramPermissions(user, program: { editors?, admins? }, has): boolean
hasCoursePermissions(user, course: { editors?, admins?, programs[] }, has): boolean
hasSandboxPermissions(user, sandbox: { editors?, owner? }, has): boolean
```

---

## 5. Server Actions (src/lib/server/actions/)

All actions are static class methods accepting `(user: User, form: SuperValidated<Schema>)`. They validate permissions via Prisma `where` clauses (unauthorized = not found → returns error), then mutate DB and return `{ form }` on success.

### ProgramActions.ts

| Method          | Permission    | DB Operation                                    |
| --------------- | ------------- | ----------------------------------------------- |
| `newProgram`    | super admin   | `prisma.program.create`                         |
| `editProgram`   | program admin | `prisma.program.update`                         |
| `deleteProgram` | super admin   | `prisma.program.delete`                         |
| `editSuperUser` | program admin | `connect`/`disconnect` user from admins/editors |

`isAllowedToEditSuperUser(fromRole, toRole, admins[])` — validates role transitions, prevents removing last admin.

### CourseActions.ts

| Method          | Permission                     | DB Operation                                |
| --------------- | ------------------------------ | ------------------------------------------- |
| `newCourse`     | program admin/editor           | `prisma.course.create` + auto-pin           |
| `editCourse`    | course or program admin/editor | `prisma.course.update`                      |
| `editSuperUser` | course or program admin/editor | connect/disconnect                          |
| `linkCourses`   | program admin                  | `connect`/`disconnect` courses from program |
| `changePin`     | any user                       | add/remove from `pinnedBy`                  |
| `changeArchive` | course or program admin/editor | `isArchived` toggle                         |
| `deleteCourse`  | course or program admin/editor | `prisma.course.delete` + redirect           |

### GraphActions.ts

| Method           | Permission                  | DB Operation                                                                                                                                                      |
| ---------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `newGraph`       | admin/editor by parent type | `prisma.graph.create`                                                                                                                                             |
| `editGraph`      | admin/editor by parent type | `prisma.graph.update`                                                                                                                                             |
| `deleteGraph`    | admin/editor by parent type | `prisma.graph.delete`                                                                                                                                             |
| `duplicateGraph` | admin/editor                | Full deep copy in transaction: domains+styles+positions, subjects+domain links+positions, lectures, all domain edges, all subject edges, lecture→subject mappings |

### DomainActions.ts

| Method             | Notes                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| `addDomainToGraph` | Auto-increments `order`; style `""` → `null`                                |
| `deleteDomain`     | Transaction: remove from subject relations, disconnect domain edges, delete |
| `changeDomain`     | Updates name + style                                                        |
| `addDomainRel`     | Bidirectional edge: validates source ≠ target, prevents duplicates          |
| `deleteDomainRel`  | Removes both directions                                                     |
| `changeDomainRel`  | Disconnect old + connect new in one transaction                             |

### SubjectActions.ts — same pattern as DomainActions with subject-specific validation.

### LectureActions.ts

| Method                  | Notes                                                   |
| ----------------------- | ------------------------------------------------------- |
| `addLectureToGraph`     | Connects multiple subjects via `subjectIds[]`           |
| `changeLectureName`     | Stricter permission: course admin or program admin only |
| `linkSubjectsToLecture` | Uses `set` (replaces entire subject list atomically)    |
| `deleteLecture`         | Simple delete                                           |

### LinkActions.ts

| Method       | Notes                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `newLink`    | Name: alphanumeric+hyphens, max 12 chars, lowercased; works for both course and sandbox parents |
| `moveLink`   | Updates `graphId`                                                                               |
| `deleteLink` | Simple delete                                                                                   |

### SandboxActions.ts

| Method          | Notes                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| `newSandbox`    | Any authenticated user                                                                                      |
| `editSandbox`   | Owner only                                                                                                  |
| `editSuperUser` | Owner only; `owner` role = transfer ownership (old owner becomes editor), `editor` = add, `revoke` = remove |
| `deleteSandbox` | Owner only + redirect home                                                                                  |

### Users.ts

- `getUser({ locals })` → returns `User` or redirects to `/auth`
- `getUserResponse({ locals })` → returns `User | { error }` (non-throwing, for API routes)

---

## 6. API Routes (src/routes/api/)

All endpoints use PATCH with JSON bodies, Zod validation, and permission checks.

| Endpoint                             | Schema                                       | Action                        |
| ------------------------------------ | -------------------------------------------- | ----------------------------- |
| `PATCH /api/domains/order`           | `[{ domainId, newOrder }]`                   | Batch update `order` field    |
| `PATCH /api/domains/position`        | `[{ domainId, x, y }]`                       | Batch update x/y grid coords  |
| `PATCH /api/domains/style`           | `{ domainId, style: enum\|null }`            | Update domain color           |
| `PATCH /api/subjects/order`          | `[{ subjectId, newOrder }]`                  | Batch update subject order    |
| `PATCH /api/subjects/position`       | `[{ subjectId, x, y }]`                      | Batch update subject coords   |
| `PATCH /api/lectures/order`          | `[{ lectureId, newOrder }]`                  | Batch update lecture order    |
| `PATCH /api/lectures/order-subjects` | `{ graphId, lectureId, name, subjectIds[] }` | Replace lecture's subject set |

Position endpoints are called live as the user drags nodes in the D3 canvas.

---

## 7. Zod Schemas (src/lib/zod/)

### courseSchema.ts

- `newCourseSchema`: `{ code: alphanumeric ≤30, name: ≤30, programId: number }`
- `editCourseSchema`: `{ courseId, name: ≤30 }`
- `editSuperUserSchema`: `{ courseId, userId, role: 'admin'|'editor'|'revoke' }`
- `linkingCoursesSchema`: `{ programId, courseIds: number[] non-empty }`
- `changeArchiveSchema`: `{ courseId, archive: boolean }`
- `changePinSchema`: `{ courseId, pin: boolean }`
- `deleteCourseSchema`: `{ courseId: min 1 }`

### programSchema.ts

- `newProgramSchema`: `{ name: 1–50 chars }`
- `editProgramSchema`: `{ programId ≥1, name: non-empty }`
- `editSuperUserSchema`: `{ programId, userId, role: enum }`
- `deleteProgramSchema`: `{ programId ≥1 }`

### graphSchema.ts

- `newGraphSchema`: `{ parentId, parentType: 'SANDBOX'|'COURSE', name: 1–50 }`
- `graphSchemaWithId`: extends above + `graphId ≥1`
- `duplicateGraphSchema`: `{ graphId ≥1, newName: 1–50, destinationType, destinationId ≥1 }`

### domainSchema.ts

- `domainSchema`: `{ domainId, graphId ≥0, name: 1–50, style: enum|'' }`
- `deleteDomainSchema`: `{ graphId, domainId ≥1, sourceDomains[], targetDomains[], connectedSubjects[] }`
- `domainRelSchema`: `{ graphId, sourceDomainId >0, targetDomainId >0 }` — refines source ≠ target
- `changeDomainRelSchema`: extends above with old IDs, refines new ≠ old

### subjectSchema.ts — mirrors domain schema with subject IDs.

### lectureSchema.ts

- `lectureSchema`: `{ graphId, lectureId, name: 1–50, subjectIds: number[] }`
- `deleteLectureSchema`: `{ graphId, lectureId }`

### linkSchema.ts

- `newLinkSchema`: `{ parentId, parentType, graphId ≥1, name: 1–12 alphanumeric+hyphens }`
- `editLinkSchema`: `{ parentId, parentType, graphId ≥1, linkId ≥1 }`

### sandboxSchema.ts

- `newSandboxSchema`: `{ ownerId, name: ≤30 }`
- `editSandboxSchema`: `{ sandboxId, name: ≤30 }`
- `deleteSandboxSchema` / `editSuperUserSchema`

---

## 8. D3 Graph Engine (src/lib/d3/)

### types.ts — Core type definitions

```typescript
enum NodeType { DOMAIN = 'domain', SUBJECT = 'subject' }

NodeData {
  id: number; uuid: string; type: NodeType; style: DomainStyle | null
  text: string; x, y: number; parent?: NodeData; fx?, fy?: number
}

EdgeData { uuid: string; source: NodeData; target: NodeData }

GraphData {
  domain_nodes: NodeData[]; domain_edges: EdgeData[]
  subject_nodes: NodeData[]; subject_edges: EdgeData[]
  lectures: LectureData[]
}

LectureData {
  id, name: string
  past_nodes: NodeData[]    // prerequisites of present subjects
  present_nodes: NodeData[] // subjects covered in this lecture
  future_nodes: NodeData[]  // subjects that depend on present ones
  domains: NodeData[]; nodes: NodeData[]; edges: EdgeData[]
}

CameraTransform { x, y, k: number }
```

### GraphD3State.svelte.ts

Reactive state machine: `'IDLE' | 'SIMULATING' | 'TRANSITIONING'`. Exported singleton `graphState` with `isIdle()`, `toIdle()`, `isSimulating()`, etc.

### GraphD3View.svelte.ts

View state machine: `'domains' | 'subjects' | 'lectures'`. Exported singleton `graphView` with `isDomains()`, `toDomains()`, etc.

### graphD3.svelte.ts — `GraphD3` main class

**Constructor** `(element: SVGElement, payload: PrismaGraphPayload, editable: boolean, view: string, lectureId?: number)`:

1. `formatPayload()` — converts Prisma data to D3 `GraphData`
2. Sets view mode, finds lecture if specified
3. Creates SVG layer hierarchy: `defs` → `background` → `content` → `overlay`
4. Creates D3 force simulation with center force (0.05) + charge force (−15)
5. Creates D3 zoom behavior (scale 0–1.5x), double-click disabled
6. Initializes all toolboxes
7. Attaches keyboard listeners
8. Calls `setView()` + `centerOnGraph()`

**Public API:**

| Method                         | Description                                               |
| ------------------------------ | --------------------------------------------------------- |
| `setData(data, animateCamera)` | Update graph data, trigger D3 transition                  |
| `setView(targetView)`          | Switch between domains/subjects/lectures                  |
| `setLecture(lecture)`          | Highlight nodes belonging to a lecture                    |
| `setDomainStyle(id, style)`    | Live-update domain node color                             |
| `zoomIn() / zoomOut()`         | Programmatic zoom (step = 1.5×)                           |
| `startSimulation()`            | Enable physics, unfix all nodes, backup current positions |
| `stopSimulation()`             | Stop physics, fix all nodes                               |
| `resetSimulation()`            | Restore positions from backup                             |
| `centerOnGraph()`              | Animate camera to fit all nodes                           |
| `clear()`                      | Remove all SVG elements                                   |

**`formatPayload(PrismaGraphPayload): GraphData`:**

1. Map domain Prisma records → `NodeData[]`, build `id → NodeData` map
2. Extract domain edges from `targetDomains` relation arrays
3. Map subject Prisma records → `NodeData[]`, assign `parent` from domain map
4. Extract subject edges, build forward/reverse edge maps for lecture computation
5. For each lecture: compute `present_nodes` (direct subjects), `past_nodes` (predecessors reachable from present), `future_nodes` (successors of present)
6. Return `GraphData`

### NodeToolbox.ts

- `init()` — Creates SVG drop shadow filter (5px green blur for lecture highlight)
- `create(selection, graph)` — Renders domain/subject nodes as styled SVG `<path>` with text; attaches drag behavior that calls `PATCH /api/{domains|subjects}/position` on drag end
- `updatePosition()` — Applies `translate(x,y)` transform
- `updateStyle()` — Updates fill/stroke CSS from `node.style`
- `updateHighlight()` — Adds/removes shadow filter based on lecture membership
- `wrapText()` — Word-wraps node label to fit `NODE_WIDTH`
- `setFixed()` — Toggles `fx/fy` constraint and "fixed" CSS class

### EdgeToolbox.ts

- `init()` — Creates SVG arrowhead marker definition
- `create(selection)` — Renders directed edges as `<line>` with arrowhead, colored from source node style
- `updatePosition(selection, transition?)` — Computes line endpoints at node boundary (not center) using quadrant geometry; optionally animated with D3 transition

### BackgroundToolbox.ts — Renders the grid background, updates on zoom/pan.

### CameraToolbox.ts — Manages zoom constraints and `centerOnGraph()` fit logic.

### OverlayToolbox.ts — Shows fade-in/out text overlays (e.g. "Simulation mode").

### TransitionToolbox.ts — Orchestrates animated transitions between view modes.

---

## 9. Graph Validator (src/lib/validators/graphValidator.ts)

Validates graph structure at design time; called on every graph load.

**Input:** `PrismaGraphPayload`

**Output:**

```typescript
Issues {
  domainIssues: { [domainId]: Issue[] }
  domainRelationIssues: { [domainId]: { [targetId]: Issue[] } }
  subjectIssues: { [subjectId]: Issue[] }
  subjectRelationIssues: { [subjectId]: { [targetId]: Issue[] } }
  lectureIssues: { [lectureId]: { lecture: Issue[], subjects: { [subjectId]: Issue[] } } }
}
```

**Issue checks:**

- **Nodes:** Missing name (error), missing style on domain (error), duplicate names (warning), domain without subjects (warning), subject without domain (error)
- **Relations:** Cyclic domain/subject relations (error) — uses **Johnson's algorithm** (Tarjan's SCC + cycle search)
- **Cross-layer conflicts:** Subject edge contradicts domain reachability — uses precomputed DFS reachability matrix
- **Lectures:** Missing name/subjects (error), duplicate lecture names (warning), subject's prerequisites not covered in earlier lectures (warning)

**Algorithm complexity:**

- Cycle detection: O((V+E)(C+1)) via Johnson's algorithm
- Conflict detection: O(V·(V+E)) precomputed reachability
- Prerequisite check: O(L·S·A) per lecture

---

## 10. Frontend Routes & Pages

### Layout Structure

```
/
└── /auth                        Login page
└── /graph-editor                Editor root (sidebar + auth guard)
    ├── /courses                 Course list
    │   └── /[courseCode]        Course detail + graphs list
    │       └── /settings        Edit name, admins, archive, delete
    ├── /programs
    │   └── /[programId]/settings  Edit name, link courses, manage users
    ├── /sandboxes
    │   └── /[sandboxId]         Sandbox detail + graphs list
    │       └── /settings        Edit name, transfer ownership, editors
    ├── /users                   User management (admin only)
    └── /graphs/[graphid=int]    Graph visualization shell
        ├── /domains             Domain management + D3 render
        ├── /subjects            Subject management + D3 render
        └── /lectures            Lecture management + D3 render
/graph/[code]/[alias]            Public read-only graph viewer
```

### Key Page Details

**`/graph-editor` (+page.server.ts):**
Loads: programs with courses, owned/editing sandboxes, pinned courses.
Forms/actions: `new-program`, `new-course`, `new-sandbox`, `link-courses`, `unlink-courses`, `change-course-pin`.

**`/graph-editor/courses/[courseCode]` (+page.server.ts):**
Loads: course detail, all graphs, all links, permission context.
Forms/actions: `new-graph`, `edit-graph`, `delete-graph`, `duplicate-graph`, `new-link`, `move-link`, `delete-link`.

**`/graph-editor/graphs/[graphid=int]` (+layout.server.ts):**
Loads full `PrismaGraphPayload` (domains + subjects + lectures with all relations). Runs `GraphValidator.validate()`. Returns `{ graph, issues }` shared by all sub-routes.

**`/graph-editor/graphs/[graphid=int]/domains` (+page.svelte):**
Renders `GraphRenderer.svelte` (hosts D3) + sidebar with domain list. Actions: add/edit/delete domain, add/edit/delete domain edge. API calls: reorder, reposition, restyle.

**`/graph-editor/graphs/[graphid=int]/subjects`** — Same pattern for subjects, plus domain assignment.

**`/graph-editor/graphs/[graphid=int]/lectures`** — Same pattern for lectures, plus subject linking.

**`/graph/[code]/[alias]` (+page.server.ts):**
Public read-only viewer. Finds course by `code`, finds link by `alias`, loads graph. Renders `GraphRenderer.svelte` with `editable=false`.

---

## 11. Shared Components (src/lib/components/)

### Top-level

- `GraphRenderer.svelte` — Mounts the D3 engine into an SVG element; reacts to `graphView` state changes; exposes zoom controls. The central visualization host.
- `GraphDecorators.svelte` — UI overlay on top of the graph: view switcher tabs, lecture selector dropdown, simulation controls.
- `NavigationBar.svelte` — Top nav with breadcrumbs, user avatar, help.
- `Help.svelte` — Help modal/drawer.
- `SelectUsers.svelte` — Searchable user picker for role assignment forms.
- `UserAvatar.svelte` — User avatar with fallback initials.
- `DialogButton.svelte` — Button that opens a modal dialog.
- `Icon.svelte` — Lucide icon wrapper.
- `Logo.svelte` — GRAAF logo mark.

### addCourse/

- `AddCourse.svelte` — Composite: tabs for "New course" vs "Link existing course"
- `NewCourseForm.svelte` — Form to create a new course
- `LinkCourses.svelte` — Multi-select to link existing courses to a program
- `LinkCourseDataTable.svelte` — TanStack table for course selection
- `add-course-columns.ts` — Column definitions for course link table

### graphSettings/

- `GraphSettings.svelte` — Dropdown/popover menu for graph-level actions
- `CreateGraph.svelte` — New graph form
- `DeleteGraph.svelte` — Confirm + delete
- `DuplicateGraph.svelte` — Deep copy form with destination picker
- `GraphTable.svelte` — Table listing graphs in a course/sandbox
- `CreateLink.svelte` — New link form
- `DeleteLink.svelte` — Confirm + delete link
- `EmbedLink.svelte` — Shows embed URL for a link
- `LinkEmbed.svelte` — Iframe embed code display

### ui/ (shadcn-svelte component library)

Standard re-exports of Bits UI primitives: accordion, alert-dialog, avatar, breadcrumb, button, checkbox, collapsible, command, data-table, dialog, dropdown-menu, form, grid, input, label, menubar, popover, radio-group, separator, sheet, sidebar, skeleton, sonner (toasts), table, tooltip.

Custom additions:

- `ui/grid/` — Custom `Grid.svelte`, `Rows.svelte`, `Cell.svelte`, `ReorderRows.svelte`, `gridState.svelte.ts` — a sortable/reorderable grid used for domain/subject/lecture lists
- `ui/data-table/` — TanStack Table integration with Svelte rendering helpers

---

## 12. Settings (src/lib/settings.ts)

All magic numbers are centralized here:

| Category       | Key constants                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Name limits    | MAX_PROGRAM_NAME_LENGTH=50, MAX_COURSE_CODE_LENGTH=30, MAX_GRAPH_NAME_LENGTH=50, MAX_LINK_NAME_LENGTH=12 |
| Grid           | GRID_UNIT=10px, GRID_PADDING=5, NODE_WIDTH=16, NODE_HEIGHT=8 (grid units)                                |
| Zoom           | MIN_ZOOM=0, MAX_ZOOM=1.5, ZOOM_STEP=1.5                                                                  |
| Node           | NODE_MARGIN=1.5, NODE_PADDING=1, NODE_FONT_SIZE=15px, NODE_MAX_CHARS=35                                  |
| Simulation     | CENTER_FORCE=0.05, CHARGE_FORCE=−15, GRAPH_ANIMATION_DURATION=500ms                                      |
| Overlay        | OVERLAY_OPACITY=0.5, OVERLAY_FADE_OUT=500ms, OVERLAY_LINGER=1500ms                                       |
| Lecture layout | LECTURE_PADDING=5, HEADER_HEIGHT=3, COLUMN_WIDTH=NODE_WIDTH+2×PADDING                                    |
| Domain styles  | `STYLES` object mapping each `DomainStyle` enum to `{ display_name, stroke, fill, path }`                |

---

## 13. Utilities

### src/lib/utils/displayUserName.ts

`displayName(user?, fallback?)` — returns `nickname || (firstName + " " + lastName) || email || fallback`.

### src/lib/utils/setError.ts

`setError(form, path, error, options?)` — wraps Superforms error assignment; returns SvelteKit `fail()` with the updated form. Used in every server action for standardized error reporting.

### src/lib/server/db/prisma.ts

Singleton `PrismaClient` with conditional logging: full query log in `DEBUG` mode, none in `TESTING`, errors-only by default.

### src/params/int.ts

SvelteKit route param matcher: validates that `[graphid=int]`, `[programId=int]`, `[sandboxId=int]` are valid integers.

### src/lib/hooks/is-mobile.svelte.ts

Reactive hook `isMobile()` — returns `$state(boolean)` tracking `window.innerWidth < 768px`.

---

## 14. Data Flow Summary

```
User auth (SURFconext OIDC)
    → session stored in DB
    → hooks.server.ts extracts User from session on every request

Page load (+page.server.ts)
    → getUser() validates session
    → Prisma query with permission where-clause
    → returns typed data + Superforms instances

User interaction
    → Form submit → server action → permission check → DB mutation → { form }
    → Drag node → API PATCH /position → DB update (x/y)
    → Reorder → API PATCH /order → DB update (order)
    → Style change → API PATCH /style → DB update (style)

GraphRenderer.svelte
    → mounts GraphD3 class on SVGElement
    → GraphD3.setData() formats PrismaPayload → GraphData
    → D3 simulation + toolboxes render nodes/edges
    → graphView state machine switches domains/subjects/lectures views
    → Lecture selection → setLecture() → updateHighlight() on nodes

GraphValidator
    → runs on every graph load in +layout.server.ts
    → Johnson's algorithm for cycle detection
    → DFS reachability for cross-layer conflict detection
    → Returns Issues map displayed via IssueIndicator.svelte
```

---

## 15. Key Architectural Patterns

| Pattern                    | Implementation                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Permission enforcement** | Prisma `where` clauses — unauthorized records simply "don't exist"                                                |
| **Form handling**          | Zod schemas + Superforms — shared client/server validation                                                        |
| **Graph state**            | Two reactive singletons: `graphState` (idle/simulating/transitioning) and `graphView` (domains/subjects/lectures) |
| **Graph visualization**    | D3 force simulation; nodes draggable, positions persisted live via PATCH API                                      |
| **Structural validation**  | Offline graph algorithm (Johnson's + DFS) run server-side on every graph load                                     |
| **DB access**              | Single Prisma singleton, no raw SQL, cascading deletes handle cleanup                                             |
| **Deep copy**              | `duplicateGraph` runs inside a Prisma `$transaction` to ensure atomicity                                          |
| **Auth bypass**            | Netlify deploy previews use cookie-based auth; production uses OIDC                                               |

---

The project is clean, well-layered, and purpose-built: SvelteKit handles routing/forms/SSR, Prisma handles all data access with permission filtering baked into queries, D3 handles the interactive graph canvas, and a custom validator catches structural errors before students see broken course graphs.
