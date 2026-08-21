# Graph data ownership: one owner for the editor tables and the D3 canvas

From the architecture review of the graph-editing subsystem (dual-write between
`domains/+page.svelte` and `GraphD3`). The triage brief marked this `ready-for-human` because the
deliverable is an interface decision, not a mechanical edit. This document makes that decision and
breaks the work into phases that ship one at a time.

**Status: implemented** on `104-graph-data-has-two-independently-written-copies-page-state-vs-graphd3-canvas`.
The design below is what was built, with three deliberate changes from the first draft:

- The store is created per render tree through Svelte context, not as a module singleton. The
  tables have to be server-rendered, so the store has to exist during render, and a module-level
  singleton would be shared between concurrent SSR requests.
- The payload shape is a second projection (`projectWithRelations`) rather than something the
  components were migrated off. The tables, the form components and `GraphValidator` were all
  written against the loader's payload, so keeping that shape as a derived read cut the change from
  ~15 components to 6, and it removes the stale-duplicate problem in finding 7 by being read-only.
- Node positions go through the store too (`persistPositions`), which turned out to be required
  rather than optional: once the canvas is updated incrementally instead of rebuilt, a projection
  built from stale rows would pull dragged nodes back to their last loaded position.

## What the seam looked like

Before this change, one server payload fed two independently maintained shapes:

```
GraphActions.getRenderablePayload        (src/lib/server/actions/Graphs.ts:25)
  └─ +layout.server.ts load → data.graph
       ├─ domains|subjects|lectures/+page.svelte:  let graph = $state(data.graph)   → tables
       └─ +layout.svelte → GraphRenderer → new GraphD3(payload)
              └─ GraphD3.formatPayload → GraphData {domain_nodes, domain_edges, …}  → canvas
```

Nothing keeps the two in step after construction. What actually holds them together today is
`invalidateAll`: every superforms mutation re-runs the layout load, which produces a new
`data.graph`, which makes `GraphRenderer`'s `$effect` construct a brand new `GraphD3`. The four
mutations that use `fetch` instead of a form action get no such refresh, and each one patches
whatever copies its author remembered.

| Mutation                                                                   | Server      | Table copy                     | Canvas                                    |
| -------------------------------------------------------------------------- | ----------- | ------------------------------ | ----------------------------------------- |
| create / rename / delete domain, subject, lecture, relation (form actions) | form action | `invalidateAll` reload         | whole `GraphD3` rebuilt                   |
| domain style (`PATCH /api/domains/style`)                                  | yes         | `domain.style = key`           | `setDomainStyle`, partial (see finding 2) |
| domain / subject / lecture order (`PATCH /api/*/order`)                    | yes         | local array + `order` renumber | nothing                                   |
| move subject between lectures (`PATCH /api/lectures/order-subjects`)       | yes         | `lecture.subjects = items`     | nothing                                   |
| node drag, simulation stop (`PATCH /api/*/position`)                       | yes         | nothing                        | node objects mutated in place             |

## Verified findings

Read from the code on `84-admin-panel`, not taken from the triage brief.

1. **The dual write is real.** `handleChangeStyle` writes the table copy
   (`domains/+page.svelte:70`), PATCHes the server, then calls
   `graphD3Store.graphD3?.setDomainStyle(...)` (`domains/+page.svelte:82`). Two writes, two shapes,
   one user action.

2. **The canvas half of that write is incomplete.** `GraphD3.setDomainStyle` (`GraphD3.ts:267`)
   selects `#domain-{id}`, mutates the bound `NodeData.style`, and calls `NodeToolbox.updateStyle`,
   which only touches the node's own `path` (`NodeToolbox.ts:231`). Two consequences:
   - Edges take their colour from `edge.source.style` (`EdgeToolbox.ts:45`).
     `EdgeToolbox.updateStyle` is never called, so every edge leaving that domain keeps its old
     colour until the next view transition or rebuild re-runs the update join.
   - Subject nodes copy their parent domain's style at projection time (`GraphD3.ts:478`), so
     subjects never pick up the new colour at all without a rebuild.

   This is the strongest argument for the refactor: the second write path is not just duplicated
   work, it is wrong in ways that stay invisible until someone switches views.

3. **Reorder does not reach the canvas, and today that is invisible.** The triage brief says the
   canvas "silently goes stale" after `handleDndFinalize`. The write is indeed missing, but
   `NodeData` has no `order` field and nothing in `src/lib/d3/` reads one, so no rendered property
   depends on domain or subject order. Array order only affects DOM insertion order, and
   `NodeToolbox.updatePosition` calls `selection.raise()` while `EdgeToolbox.updatePosition` calls
   `selection.lower()` anyway. Treat this as a latent gap (it becomes a real bug the moment
   anything on the canvas derives from `order`), not a live one.

4. **Lecture membership is the write that is visibly stale.** `LectureSubject.svelte:28` moves a
   subject between lectures through `/api/lectures/order-subjects` and never tells the canvas. The
   lectures view renders exactly that membership: `formatPayload` partitions each lecture into
   `present_nodes` from `lecture.subjects` and walks one hop outward for `past_nodes` /
   `future_nodes` (`GraphD3.ts:527-590`). With the preview pane on the lectures view, dragging a
   subject into the focused lecture leaves the canvas showing the old partition until a reload.
   Note `handleDndFinalize` deliberately reverts same-length drops (`LectureSubject.svelte:30`), so
   only cross-lecture moves persist.

5. **Every form action pays for a full canvas rebuild.** `GraphRenderer`'s `$effect` re-runs when
   `payload` changes and, because `view === graphView.state` on a plain reload, takes the `else`
   branch and calls `setGraphD3` (`GraphRenderer.svelte:19-26`), whose constructor clears the SVG
   (`GraphD3.ts:104`) and snaps to the initial view. Renaming one domain therefore discards camera
   position and zoom, re-enters every node as `.fixed` at its persisted x/y, rebuilds the
   `LectureData` objects, and cancels any running simulation. The current "it stays in sync"
   behaviour is really "it is rebuilt from scratch".

6. **The reference-identity invariant is load-bearing and undocumented.** Within one `GraphData`,
   `edge.source` / `edge.target`, `node.parent`, and every entry of `lecture.past_nodes` /
   `present_nodes` / `future_nodes` / `nodes` must be the _same objects_ as the entries of
   `domain_nodes` / `subject_nodes`. Four consumers depend on it:
   - `NodeToolbox.updateHighlight` uses `graph.lecture?.domains.includes(node)`
     (`NodeToolbox.ts:219`)
   - `TransitionToolbox.lectureTransform` uses `includes(node)` / `indexOf(node)`
     (`TransitionToolbox.ts:257`)
   - `EdgeToolbox.updatePosition` reads `edge.source.x` / `edge.target.x`, which are only current
     because the simulation and the drag handler mutate those same objects (`EdgeToolbox.ts:94`)
   - `d3.forceLink(edges)` (`TransitionToolbox.ts:140`) only skips id resolution when
     `typeof link.source === 'object'` (d3-force `link.js:60`), and no `.id()` accessor is set here

   It holds today only because `formatPayload` builds every reference in one pass and because
   `structuredClone` preserves shared references (verified: it does).

7. **The payload itself has the same problem on the table side.** `domain.targetDomains` rows are
   separate objects from the matching `graph.domains` entries, and the relations table renders
   names off those duplicates (`domains/+page.svelte:39-51`). Harmless while every change arrives
   via `invalidateAll`, but any optimistic rename would have to write the row and every duplicate
   of it. Normalising relations to id pairs is the table-side half of "store edges by id".

8. **A reactive proxy must never reach `GraphData`.** `startSimulation` does
   `structuredClone(this.data)` (`GraphD3.ts:317`), and `structuredClone` throws `DataCloneError`
   on a Svelte `$state` proxy, including one nested inside a plain object (verified on Node 24).
   Today no proxy gets there because the layout passes the unproxied `data.graph` to
   `GraphRenderer`. Any owner that sits between load data and the canvas has to keep that true.

9. **Two smaller things found in the same seam.** `data.issues` from the layout load
   (`+layout.server.ts:34`) is computed by the 815-line `GraphValidator` on every load and read by
   nobody: all three pages recompute it client-side. And `PrismaGraphPayload` is declared twice
   (`src/lib/d3/types.ts:41`, `src/lib/validators/types.ts:3`), neither derived from
   `GraphActions.renderablePayloadInclude`, which is why neither mentions the `domain: true`
   include the real query carries (`Graphs.ts:36`).

## Design decision

### One owner, two projections

Do not try to make the tables and the canvas share one shape. They legitimately want different
ones: the tables want ordered rows with names and relations, the simulation wants flat node arrays
with mutable positions and object references. What must be single is the **write path** and the
**truth**, not the representation.

So: a `graphStore` module owns the committed model of one graph. The tables read it reactively. The
canvas receives a projection of it. Every mutation goes through the store, which updates the model,
pushes the projection at the canvas, calls the server, and rolls back on failure.

### The model is the payload shape, normalised

The store's internal model is the renderable payload, restructured two ways:

- **Id-keyed instead of arrays.** `SvelteMap<number, DomainRow>` and friends, with derived
  `domainsInOrder` and so on. Reconciling a reload by id then keeps row identity stable, which is
  what makes incremental canvas updates and stable `{#each}` keys possible.
- **Relations as id pairs.** A `SvelteSet` of `EdgeKey` (a `sourceId->targetId` string) instead of
  duplicated row objects, resolved through the maps when the tables need names. This is finding 7
  fixed, and it simplifies the components that already only want ids (`DeleteDomain.svelte:40` does
  `domain.sourceDomains.map((d) => d.id)`).

Rows are **immutable**: an update replaces the row object via `map.set(id, { ...row, style })`. Two
things fall out of that. Reactivity works without wrapping rows in `$state` (SvelteMap tracks
per-key reads), and reads out of the store are plain objects, so the projection cannot smuggle a
proxy into `GraphData` (finding 8).

The model stays close enough to `PrismaGraphPayload` that `GraphValidator` can keep its current
input: the store rebuilds a payload-shaped object for it in a `$derived`, and exposes `issues`.
That deletes the three copies of `new GraphValidator(graph).validate()` in the pages.

### The projection owns the invariant

`projectGraphData(model): GraphData` becomes the single place where ids turn into object
references. That is the whole point: the invariant from finding 6 stops being a property of
"however the last clone behaved" and becomes a documented, unit-tested property of one pure
function. Edges are id pairs everywhere upstream of it.

Keeping references (rather than making the toolboxes resolve ids per read) is deliberate: the
simulation mutates node positions in place and `d3.forceLink` wants objects, so the reference graph
has to exist somewhere. It should exist in exactly one function.

### Who owns what, precisely

| Thing                                                         | Owner                                                |
| ------------------------------------------------------------- | ---------------------------------------------------- |
| Committed names, styles, order, relations, lecture membership | `graphStore`                                         |
| Live node x/y while the canvas is mounted                     | the canvas (`NodeData`), persisted through the store |
| In-flight drag order during a `svelte-dnd-action` drag        | `graphStore` preview state, not the component        |
| Which view and which lecture are focused                      | the URL, as today                                    |
| Validation issues                                             | `graphStore` (derived)                               |

`svelte-dnd-action` needs the array it was handed to change on every `consider` event, so the
preview has to live somewhere reactive. Putting it in the store as `previewOrder(collection, ids)`
(no server call, no canvas push) and committing on finalize keeps zero copies in the component,
which is the point of the exercise.

### No deep clone

`startSimulation` / `resetSimulation` do not need a deep copy of the object graph. They need the
positions from before the simulation ran. Replace `structuredClone(this.data)` with a
`Map<uuid, {x, y}>` and restore in place. That removes the exact construct the three cited commits
oscillated over (`d5a7223` added `repairReferences()` to fix a clone that broke identity, `105721d`
deleted it in favour of `structuredClone`), and it removes the `DataCloneError` landmine from
finding 8 permanently.

### Scope of the store instance

Svelte context, created by whichever component loads the graph: the editor layout and the public
viewer page. Not a module singleton, even though `graphD3Store` / `graphState` / `graphView` all are.

The reason is server rendering. The tables have to be in the server-rendered markup, so the store
has to exist during render rather than being filled in from an `$effect`, and module-level state
that is written during SSR is shared between concurrent requests. `hydrate` still resets the model
when the graph id changes, for the case where the editor navigates from one graph to another without
remounting.

The three existing singletons are only ever touched from client-side code (effects and D3 callbacks),
so they are not affected. They are still a single-canvas assumption, which the context-scoped store
now no longer adds to.

## Interface

```ts
// src/lib/graph/model.ts
export type DomainRow = Domain; // the plain row, without relation arrays
export type SubjectRow = Subject;
export type LectureRow = Lecture;
export type EdgeKey = `${number}->${number}`;

export type GraphPayload = Graph & { ... }; // what the store hydrates from
export type GraphWithRelations = Graph & { ... }; // the payload-shaped projection
export type GraphModel = { ... }; // the plain snapshot both projections are built from
```

```ts
// src/lib/graph/projectGraphData.ts

/**
 * INVARIANT: this is the only place object references between nodes are created. Within the
 * returned GraphData, every edge.source/edge.target, every node.parent, and every entry of
 * lecture.past_nodes/present_nodes/future_nodes/nodes/domains is reference-equal to the matching
 * entry of domain_nodes/subject_nodes. [...] Everything returned is a plain object (never a Svelte
 * $state proxy), which is what keeps a GraphData structuredClone-able.
 */
export function projectGraphData(model: GraphModel): GraphData;
```

```ts
// src/lib/graph/projectWithRelations.ts
export function projectWithRelations(meta: Graph, model: GraphModel): GraphWithRelations;
```

```ts
// src/lib/graph/graphStore.svelte.ts
export class GraphStore implements PositionSink {
	constructor(payload: GraphPayload);

	// --- the server is still the source of truth
	hydrate(payload: GraphPayload): void; // reconcile by id, never wholesale replace

	// --- reads
	readonly domains: DomainRow[]; // display order, honouring an in-flight drag
	readonly subjects: SubjectRow[];
	readonly lectures: LectureRow[];
	readonly graph: GraphWithRelations; // for the tables, the forms and GraphValidator
	readonly issues: Issues;
	readonly graphData: GraphData; // for the canvas
	get id(): number;
	get name(): string;
	subjectIdsOf(lectureId: number): number[];
	committedSubjectIdsOf(lectureId: number): number[];

	// --- canvas binding
	attachCanvas(canvas: GraphCanvas): void; // also hands itself over as the position sink
	detachCanvas(canvas: GraphCanvas): void;

	// --- mutations: model, then canvas, then server, rollback on failure
	setDomainStyle(id: number, style: DomainStyle | null): Promise<boolean>;
	previewOrder(collection: OrderedCollection, ids: number[]): void; // drag in flight
	commitDomainOrder(ids: number[]): Promise<boolean>;
	commitSubjectOrder(ids: number[]): Promise<boolean>;
	commitLectureOrder(ids: number[]): Promise<boolean>;
	previewLectureSubjects(lectureId: number, subjectIds: number[]): void;
	revertLectureSubjects(lectureId: number): void;
	commitLectureSubjects(lectureId: number, subjectIds: number[]): Promise<boolean>;
	persistPositions(positions: NodePositions): Promise<void>;
}

/** Create the store and put it in context. Called during render, so SSR has the graph too. */
export function setGraphStore(payload: GraphPayload): GraphStore;
export function getGraphStore(): GraphStore;
```

Each mutation returns whether the server accepted it, so a caller that has UI to close (the style
popover) can wait for the answer instead of guessing. Optimistic update, request, toast and rollback
all live in the method: that is the logic that used to be inlined in each page handler, and moving
it here is the deletion test the issue asks for.

The canvas and the store meet through two narrow types in `src/lib/d3/types.ts` rather than
importing each other:

```ts
type GraphCanvas = {
	positionSink: PositionSink | null;
	applyData(data: GraphData, options?: { recenter?: boolean }): void;
};

type NodePositions = {
	domains: { id: number; x: number; y: number }[];
	subjects: { id: number; x: number; y: number }[];
};

type PositionSink = { persistPositions(positions: NodePositions): void };
```

## Files

New:

- `src/lib/graph/model.ts` - row, payload, projection and model types
- `src/lib/graph/hydration.ts` - row builders and the reconcilers, pure and Map-free of reactivity
- `src/lib/graph/projectGraphData.ts` - the canvas projection, moved out of `GraphD3.formatPayload`
- `src/lib/graph/projectWithRelations.ts` - the payload-shaped projection for the tables
- `src/lib/graph/graphStore.svelte.ts` - the owner, plus its context helpers
- `src/lib/graph/projectGraphData.test.ts` - the reference-identity invariant, 11 cases
- `src/lib/graph/graphStore.svelte.test.ts` - hydration, mutations, rollback, sink, 18 cases

Changed:

- `src/lib/d3/GraphD3.ts` - takes a GraphData instead of a payload; `formatPayload`,
  `setDomainStyle`, `setData` and `data_backup` gone; `applyData`, `setLectureById`,
  `carryOverPositions`, `applyPendingData` and the position snapshot added
- `src/lib/d3/TransitionToolbox.ts` - `refreshContent`, a content-only join that leaves the camera
- `src/lib/d3/NodeToolbox.ts` - `save` hands positions to the sink instead of fetching
- `src/lib/d3/types.ts` - the invariant documented on `EdgeData`, the three canvas port types added,
  the duplicated Prisma payload types dropped
- `src/lib/d3/graphD3.svelte.ts` - `mount`/`unmount` instead of `setGraphD3`
- `src/lib/components/GraphRenderer.svelte` - takes no payload, mounts once, follows the URL for
  view and lecture, all canvas calls untracked
- `src/lib/components/GraphDecorators.svelte` - lecture list from the store, dropdowns only navigate
- `.../[graphid=int]/+layout.svelte`, `src/routes/graph/[code]/[alias]/+page.svelte` - create the
  store, hydrate it on every load
- `.../[graphid=int]/+layout.server.ts` - dropped the `issues` nobody read (finding 9)
- `.../domains/+page.svelte`, `subjects/+page.svelte`, `lectures/+page.svelte` - read the store,
  call its mutations; the `$state(data.graph)` workaround and its eslint-disable are gone
- `.../lectures/LectureSubject.svelte` - membership drags go to the store, no local backup array
- `.../domains/DeleteDomainRel.svelte`, `subjects/DeleteSubjectRel.svelte` - `graph: Graph` instead
  of `PageData['graph']`, since both only ever read `graph.id`

Untouched, as planned: `GraphValidator`, every form action, every `src/routes/api/**` endpoint, and
the internals of `NodeToolbox` / `EdgeToolbox` / `CameraToolbox` / `BackgroundToolbox`.

## Change, phase by phase

The order the work was done in, and the order to read the diff in. Each step leaves the app working,
so they can also be split into separate PRs if review wants that.

### Phase 0: pin the invariant

`GraphD3.formatPayload` became `projectGraphData(model)` in its own module, with the invariant
written above it and a matching note on `EdgeData` in `types.ts`. `projectGraphData.test.ts` asserts
each half of it, including that the result is still structuredClone-able:

```ts
expect(data.domain_edges[0].source).toBe(domainOf(1));
expect(data.subject_nodes[0].parent).toBe(data.domain_nodes[0]);
expect(projected.present_nodes[0]).toBe(data.subject_nodes[1]);
expect(() => structuredClone(data)).not.toThrow();
```

Cheap, and it makes every later step falsifiable.

### Phase 1: the store owns the model, tables read it

`model.ts`, `hydration.ts`, `projectWithRelations.ts` and `graphStore.svelte.ts`, with the store
created in the editor layout and the viewer page and re-hydrated from an `$effect` on `data.graph`.
The three pages read `store.graph` and `store.issues`.

The `let graph = $state(data.graph); $effect(() => { graph = data.graph; })` workaround and its
`eslint-disable svelte/prefer-writable-derived` are gone from all three pages, because the store is
writable state by design rather than a `$derived` someone needs to mutate. The three duplicate
`new GraphValidator(graph).validate()` calls collapsed into `store.issues`.

Relations are normalised to `EdgeKey` pairs on the way in, so this also covers what the first draft
had as a separate phase 4. The form components keep their payload-shaped props, because
`projectWithRelations` hands them the same shape they already expected.

### Phase 2: the canvas subscribes instead of being rebuilt

`GraphD3.applyData` runs the same keyed d3 join `setData` used to, rebinds the simulation, and leaves
the camera alone through the new `TransitionToolbox.refreshContent`. `GraphRenderer` mounts the
canvas once and follows the URL for view and lecture changes; `graphD3.svelte.ts` gained
`mount`/`unmount` to replace `setGraphD3`.

Three things this phase has to get right, all of which bit the earlier hot-fixes:

- **Updates during a transition.** `setData` returned early while transitioning, which with
  incremental updates silently drops one. `applyData` stashes the projection and applies it once the
  transition ends.
- **Positions.** A new projection carries the rows' positions, which would yank dragged nodes back.
  `carryOverPositions` copies the live position of every surviving node onto the incoming projection,
  so an edit elsewhere never moves what is on screen.
- **The focused lecture.** Every projection builds fresh `LectureData` objects while the renderers
  test lecture membership by reference, so `applyData` re-resolves `graph.lecture` by id. This is the
  invariant from finding 6 in its most easily missed form.

Renaming a domain no longer rebuilds the canvas or moves the camera, and no longer cancels a running
simulation.

### Phase 3: mutations move into the store

The four `fetch` mutations became store methods, each doing the optimistic update, the canvas push,
the request and the rollback. The page handlers are one-liners now, `GraphD3.setDomainStyle` is gone,
and `NodeToolbox.save` hands positions to the store's sink instead of fetching.

Style propagation came out fixed without a second update call: the projection recomputes subject
styles from their parent domain and the join re-runs `EdgeToolbox.updateStyle`, so finding 2 goes
away. The unit test asserts all three (node, edge, inheriting subject) after one `setDomainStyle`.

### Phase 4: drop the deep clone

`data_backup: GraphData` became `position_backup: Map<uuid, {x, y}>`, restored in place, and the
`structuredClone` call is gone.

`resetSimulation` also stopped persisting the wrong positions. It used to route through
`setData` -> `stopSimulation`, which pins and saves every node where the abandoned simulation left it
and only then renders the restored data, so the database kept the positions the user had just
discarded. It now restores, pins, and saves the restored positions.

## Verification

```bash
pnpm check   # 0 errors, 0 warnings
pnpm lint    # prettier + eslint clean
pnpm test    # 29 unit tests
pnpm build   # succeeds, SSR included
```

The unit tests cover what does not need a browser: the reference-identity invariant and its
structuredClone-ability, hydration being idempotent and identity-preserving, the recenter on a
different graph, and every mutation's optimistic update, request body and rollback (including that
a domain restyle reaches its edges and its subjects through one write, and that positions are not
pushed back at the canvas that moved them).

What still needs a person and a database:

Manual, with the preview pane open (`NETLIFY_CONTEXT=DEPLOY_PREVIEW pnpm run dev`, seeded users
from `prisma/seed.ts`), on a graph that has at least two domains with a relation between them,
subjects in both, and two lectures:

1. Change a domain's style. Node, its outgoing edges, and its subjects (switch to the subjects view
   without reloading) all take the new colour. This fails today, see finding 2.
2. Drag a domain to reorder. Table order sticks after a reload, canvas unaffected, no console error.
3. Create, rename, and delete a domain. Table and canvas both update, and the camera does not jump
   or re-zoom (new behaviour after phase 2).
4. Drag a node on the canvas, reload. Position persisted.
5. Start the simulation, let it move, reset it. Nodes return to their pre-simulation positions,
   edges follow, no `DataCloneError`, no orphaned edges. This is the `d5a7223` / `105721d`
   regression, so do it twice: once with the lectures view visited in between.
6. On the lectures page with the preview showing a focused lecture, drag a subject from another
   lecture into it. The canvas partition updates without a reload. This fails today, see finding 4.
7. Delete a domain that has relations and subjects attached. No stale edge, and no crash from the
   projection's "Invalid graph data" throw.
8. Public viewer (`/graph/[code]/[alias]`): unchanged, read-only, all three views still transition.

Step 1 and step 6 are the ones that prove the refactor did something a targeted patch would not.

## Risks and traps

Handled, but these are the places to look first if something is off:

- **Updates during a transition.** `applyData` stashes the projection and applies it when the
  transition ends, retrying one animation at a time. Without that, the old early-return in `setData`
  would drop the update and leave the canvas stale, which is the bug class this issue is about.
- **Proxies into `GraphData`.** Finding 8. Three things keep them out: rows are replaced rather than
  mutated, `SvelteMap` does not deep-proxy its values, and both projections build plain objects. The
  `structuredClone` test in `projectGraphData.test.ts` is the tripwire.
- **Runes tracking imperative calls.** Every call into the canvas from `GraphRenderer` is wrapped in
  `untrack`, and `hydrate` is called inside `untrack` too. The D3 layer reads the `graphState` and
  `graphView` singletons internally, so without that those reads become dependencies and the effects
  re-run on every animation frame of a transition. This is also what the old
  `if (view != graphView.state) ... else setGraphD3(...)` effect got wrong: a transition ending
  re-ran it and rebuilt the whole canvas.
- **Store lifetime.** `hydrate` clears the model when the graph id changes, so navigating between two
  graphs in the editor (same layout, no remount) cannot leak rows from the first into the second, and
  the canvas recenters on the new graph.

Still worth watching in the manual pass:

- **Exit animations on rapid updates.** Incremental joins animate enter/exit where the old code wiped
  the SVG. Two mutations inside one animation window can leave an element mid-fade; the toolboxes
  already use `.on('end', remove)` instead of `.remove()` for this reason.
- **Projection churn.** Any row change rebuilds the payload projection, so components holding a row
  prop see a new object and their `$effect`s re-run (`ChangeDomain` re-seeds its form fields, for
  instance). Reachable in theory by dragging a canvas node while a dialog is open, which a single
  pointer cannot do; if it turns out to matter, memoise per row rather than per collection.

## Interaction with branch 62 (graph editor reactivity)

`62-graph-editor-reactivity` is not merged yet and touches five of the same files. Both branches
come off `main`, so nothing is merged yet either way. Fix by fix:

| Branch 62 fix                                                                                        | Status here                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GraphRenderer split into two effects, view untracked in the data effect                              | Superseded, but its race fix was adopted. The canvas is mounted once here instead of being reinitialised on data change, so the data effect has no reason to exist; the view effect keeps 62's tracking of `graphView.state`, which is what lets a view change requested mid-transition catch up rather than be dropped.                                                                                                                                                                                                                                                                                  |
| `setDomainStyle` also restyles outgoing edges                                                        | Subsumed. `setDomainStyle` is gone; a restyle re-projects, and the d3 update join restyles the node, its edges and the subjects that inherit the domain's style. 62 fixed the edges; the inheriting subjects were still stale.                                                                                                                                                                                                                                                                                                                                                                            |
| Reorder through form actions, guarded by `isLocalUpdate` on an `$effect.pre`                         | Overlapping, and a decision. Reorder here stays on the `/api/*/order` endpoints but goes through the store, which owns the optimistic renumber and the rollback, so there is no second copy to clobber and no full graph refetch per drag. The clobber 62's flag guards is closed in `#commitOrder` / `commitLectureSubjects` instead: an in-flight commit keeps its drag preview, `hydrate` leaves that preview alone, and the commit re-asserts the order once the server confirms. If 62's form actions are kept instead, the three `commit*Order` methods and the reorder endpoints go away together. |
| `handleChangeStyle` calls `invalidateAll()`                                                          | Not needed. The store push updates the table, the canvas and the issues without a refetch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| LectureSubject: keep same-length in-lecture reorders, copy `subjectBackup`, invalidate after success | **Needs 62 first.** This branch still reverts a same-length drag, which is what `main` did, because without `Lecture.subjectOrder` there is nothing to persist an in-lecture order to. The aliasing bug and the backup array are gone here (the store holds committed membership), but the early return has to be dropped once `subjectOrder` exists.                                                                                                                                                                                                                                                     |
| `Lecture.subjectOrder` + migration + loader sorts each lecture's subjects by it                      | **Needs 62.** No conflict with the store: it hydrates whatever order the loader returns, so sorting server-side is enough. `lectureRow` has to start carrying `subjectOrder` once the column exists, and `commitLectureSubjects` should mirror it so a row never contradicts the membership map.                                                                                                                                                                                                                                                                                                          |
| `api/lectures/order-subjects` validates `orderSubjectsSchema` and persists `subjectOrder`            | **Needs 62.** The body the store sends still carries `name`, which `orderSubjectsSchema` ignores rather than rejects, so it keeps working either way; drop `name` from the call once merged.                                                                                                                                                                                                                                                                                                                                                                                                              |

Suggested order: land 62 first, then rebase this branch onto it. 62 carries a migration and a real
behavioural change (persisted in-lecture subject order) that this branch cannot infer, while the
three items marked "needs 62" are small edits in code this branch just wrote. Doing it the other way
means resolving 62's page-level diffs against handlers that no longer exist.

## Out of scope

- `#105` fullscreen DOM reach from `GraphDecorators` into `GraphD3` internals. Same subsystem,
  different seam, and `getFullscreenTarget` (`GraphD3.ts:394`) already narrowed it.
- `#107` graph-payload query duplicated across loaders. Both loaders already go through
  `GraphActions.getRenderablePayload`, so that issue looks already fixed; the leftover is the
  duplicated _type_ in finding 9, folded into phase 0 here.
- Server-side changes to the `/api/**` endpoints, the form actions, or `GraphValidator`.
- Promoting the "one owner, two projections" decision to `docs/adr/0001-*.md`. Worth doing once this
  is reviewed and merged, since `docs/agents/domain.md` expects ADRs for decisions in an area, and
  `docs/adr/` does not exist yet.
- `GraphD3.clear()` is unused (it was already unused before this change) and `graphState` /
  `graphView` are still module singletons, so the app still assumes one canvas at a time.
