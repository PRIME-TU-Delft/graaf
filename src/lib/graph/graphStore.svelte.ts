import { getContext, setContext } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import { GraphValidator } from '$lib/validators/graphValidator';
import {
	domainRow,
	graphMeta,
	lectureRow,
	reconcileEdges,
	reconcileRows,
	sameIds,
	sameRow,
	subjectRow
} from './hydration';
import { projectGraphData } from './projectGraphData';
import { projectWithRelations } from './projectWithRelations';

import type { DomainStyle, Graph } from '@prisma/client';
import type { GraphCanvas, GraphData, NodePosition } from '$lib/d3/types';
import type { Issues } from '$lib/validators/types';
import type {
	DomainRow,
	EdgeKey,
	GraphModel,
	GraphWithRelations,
	LectureRow,
	SubjectRow
} from './model';
import type { RenderableGraph } from './renderablePayload';

/**
 * The single owner of one graph's contents while it is open in the editor or the public viewer.
 *
 * The server stays the source of truth: `hydrate` reconciles the loader's payload into the model,
 * and mutations are still posted through the route's form actions. What this class owns is the
 * *model*. Nothing else may hold a mutable copy of a graph:
 *
 * - the editor tables and form components read the payload-shaped `graph` projection
 * - the D3 canvas is handed the `graphData` projection, and is pushed a fresh one on every change
 *
 * Mutations are applied here optimistically and synchronously, then confirmed or reverted when the
 * server answers. The request itself stays in the component, because that is where superforms and
 * its form element live; this class never talks to the server.
 *
 * Internally the model is id-keyed and relations are id pairs, so there is exactly one row per
 * entity to update and no duplicated relation rows to keep in step. Object references between
 * nodes are created in `projectGraphData` and nowhere else.
 */
export class GraphStore {
	// -----------------------------> Committed model

	#meta = $state.raw<Graph | null>(null);
	readonly #domains = new SvelteMap<number, DomainRow>();
	readonly #subjects = new SvelteMap<number, SubjectRow>();
	readonly #lectures = new SvelteMap<number, LectureRow>();
	readonly #lectureSubjects = new SvelteMap<number, number[]>();
	readonly #domainEdges = new SvelteSet<EdgeKey>();
	readonly #subjectEdges = new SvelteSet<EdgeKey>();

	// -----------------------------> Drag previews
	// While a drag is in flight the rendered order is not the committed order yet. It lives here
	// rather than in the dragging component, so the component keeps no copy of its own.

	readonly #orderPreview = new SvelteMap<OrderedCollection, number[]>();
	readonly #lectureSubjectPreview = new SvelteMap<number, number[]>();

	// -----------------------------> Pending mutations
	// An optimistic change stays pending until the component reports what the server said. While
	// it is pending its previous value is kept for a revert, and `hydrate` will not overwrite it:
	// a reload that lands in that window is behind the change, not ahead of it.

	readonly #pendingOrder = new SvelteMap<OrderedCollection, [number, number][]>();
	readonly #pendingStyle = new SvelteMap<number, DomainStyle | null>();
	readonly #pendingStyleTarget = new SvelteMap<number, DomainStyle | null>();
	readonly #pendingLectureSubjects = new SvelteMap<number, number[]>();
	readonly #pendingLectureSubjectsTarget = new SvelteMap<number, number[]>();

	/** The mounted canvas, while there is one. Pushed to, never read from. */
	#canvas: GraphCanvas | null = null;

	constructor(payload: RenderableGraph) {
		this.hydrate(payload);
	}

	// -----------------------------> Reads

	/** Domains in display order, honouring an in-flight reorder drag. */
	readonly domains: DomainRow[] = $derived.by(() =>
		ordered(this.#domains, this.#orderPreview.get('domains'))
	);
	/** Subjects in display order, honouring an in-flight reorder drag. */
	readonly subjects: SubjectRow[] = $derived.by(() =>
		ordered(this.#subjects, this.#orderPreview.get('subjects'))
	);
	/** Lectures in display order, honouring an in-flight reorder drag. */
	readonly lectures: LectureRow[] = $derived.by(() =>
		ordered(this.#lectures, this.#orderPreview.get('lectures'))
	);

	/**
	 * The payload-shaped projection: the same structure the loader returns, rebuilt from the model.
	 * This is what the tables, the form components and GraphValidator read.
	 */
	readonly graph: GraphWithRelations = $derived.by(() =>
		projectWithRelations(this.#meta!, this.#model)
	);

	/** Validation issues for the current model, replacing the per-page GraphValidator calls. */
	readonly issues: Issues = $derived.by(() => new GraphValidator(this.graph).validate());

	/** The canvas-shaped projection. See projectGraphData for the reference-identity invariant. */
	readonly graphData: GraphData = $derived.by(() => projectGraphData(this.#model));

	readonly #model: GraphModel = $derived.by(() => ({
		id: this.#meta!.id,
		domains: this.domains,
		subjects: this.subjects,
		lectures: this.lectures.map((row) => ({ ...row, subjectIds: this.subjectIdsOf(row.id) })),
		domainEdges: [...this.#domainEdges],
		subjectEdges: [...this.#subjectEdges]
	}));

	get id(): number {
		return this.#meta!.id;
	}

	get name(): string {
		return this.#meta!.name;
	}

	/** The subject ids of one lecture, in display order, honouring an in-flight drag. */
	subjectIdsOf(lectureId: number): number[] {
		return this.#lectureSubjectPreview.get(lectureId) ?? this.#lectureSubjects.get(lectureId) ?? [];
	}

	/** The subject ids of one lecture as last persisted, ignoring any in-flight drag. */
	committedSubjectIdsOf(lectureId: number): number[] {
		return this.#lectureSubjects.get(lectureId) ?? [];
	}

	// -----------------------------> Hydration

	/**
	 * Reconcile the model with a freshly loaded payload, row by row: rows whose contents changed
	 * are replaced, new rows inserted, missing rows deleted, and the canvas is pushed a new
	 * projection only if something actually changed. Hydrating the same payload twice is a no-op,
	 * which is what lets a component both hydrate during render (so SSR sees the data) and hydrate
	 * again from an `$effect` when `data.graph` changes.
	 *
	 * @param payload - The graph as returned by GraphActions.getRenderablePayload
	 */
	hydrate(payload: RenderableGraph): void {
		const isNewGraph = this.#meta !== null && this.#meta.id !== payload.id;
		if (isNewGraph) this.#clear();

		let changed = isNewGraph;

		const meta = graphMeta(payload);
		if (this.#meta === null || !sameRow(this.#meta, meta)) {
			this.#meta = meta;
			changed = true;
		}

		if (reconcileRows(this.#domains, payload.domains.map(domainRow))) changed = true;
		if (reconcileRows(this.#subjects, payload.subjects.map(subjectRow))) changed = true;
		if (reconcileRows(this.#lectures, payload.lectures.map(lectureRow))) changed = true;

		for (const lecture of payload.lectures) {
			const subjectIds = lecture.subjects.map((subject) => subject.id);
			if (sameIds(this.#lectureSubjects.get(lecture.id), subjectIds)) continue;

			this.#lectureSubjects.set(lecture.id, subjectIds);
			changed = true;
		}
		for (const lectureId of [...this.#lectureSubjects.keys()]) {
			if (this.#lectures.has(lectureId)) continue;

			this.#lectureSubjects.delete(lectureId);
			changed = true;
		}

		if (reconcileEdges(this.#domainEdges, payload.domains, (domain) => domain.targetDomains)) {
			changed = true;
		}
		if (reconcileEdges(this.#subjectEdges, payload.subjects, (subject) => subject.targetSubjects)) {
			changed = true;
		}

		// A reload is the authority on order and membership, so drop what a finished drag left
		// behind. Anything still waiting on the server is kept, and re-asserted below.
		for (const collection of [...this.#orderPreview.keys()]) {
			if (this.#pendingOrder.has(collection)) continue;

			this.#orderPreview.delete(collection);
			changed = true;
		}
		for (const lectureId of [...this.#lectureSubjectPreview.keys()]) {
			if (this.#pendingLectureSubjects.has(lectureId)) continue;

			this.#lectureSubjectPreview.delete(lectureId);
			changed = true;
		}

		// Re-assert pending changes the reload just wrote over with the server's older values
		for (const [id, target] of this.#pendingStyleTarget) {
			const row = this.#domains.get(id);
			if (!row || row.style === target) continue;

			this.#domains.set(id, { ...row, style: target });
			changed = true;
		}
		for (const collection of this.#pendingOrder.keys()) {
			const ids = this.#orderPreview.get(collection);
			if (!ids) continue;

			renumber(this.#rowsOf(collection), ids);
			changed = true;
		}
		for (const [lectureId, subjectIds] of this.#pendingLectureSubjectsTarget) {
			if (sameIds(this.#lectureSubjects.get(lectureId), subjectIds)) continue;

			this.#lectureSubjects.set(lectureId, subjectIds);
			changed = true;
		}

		if (changed) this.#pushToCanvas({ recenter: isNewGraph });
	}

	// -----------------------------> Canvas binding

	/**
	 * Bind a freshly mounted canvas to this store, so it is pushed a new projection whenever the
	 * model changes.
	 *
	 * @param canvas - The canvas to bind, already constructed from `graphData`
	 */
	attachCanvas(canvas: GraphCanvas): void {
		this.#canvas = canvas;
	}

	/**
	 * Unbind a canvas that is going away. Ignores a canvas that is not the bound one, so an
	 * out-of-order unmount cannot detach its replacement.
	 *
	 * @param canvas - The canvas to unbind
	 */
	detachCanvas(canvas: GraphCanvas): void {
		if (this.#canvas !== canvas) return;

		this.#canvas = null;
	}

	// -----------------------------> Mutations
	// Each of these applies the change to the model straight away and pushes it at the canvas, so
	// the tables and the canvas move together. The caller posts the matching form action and then
	// calls confirm or revert, which is the only place the previous value is remembered.

	/**
	 * Restyle a domain: the node, the edges leaving it, and the subjects that inherit its style all
	 * follow from this one write, because the canvas is re-projected rather than patched.
	 *
	 * @param id - The domain's id
	 * @param style - The new style, or null to clear it
	 */
	setDomainStyle(id: number, style: DomainStyle | null): void {
		const row = this.#domains.get(id);
		if (!row || row.style === style) return;

		if (!this.#pendingStyle.has(id)) this.#pendingStyle.set(id, row.style);
		this.#pendingStyleTarget.set(id, style);

		this.#domains.set(id, { ...row, style });
		this.#pushToCanvas();
	}

	/** The server accepted a restyle: stop holding on to the old value. */
	confirmDomainStyle(id: number): void {
		this.#pendingStyle.delete(id);
		this.#pendingStyleTarget.delete(id);
	}

	/** The server rejected a restyle: put the old style back. */
	revertDomainStyle(id: number): void {
		const previous = this.#pendingStyle.get(id);
		this.#pendingStyle.delete(id);
		this.#pendingStyleTarget.delete(id);

		const row = this.#domains.get(id);
		if (previous === undefined || !row) return;

		this.#domains.set(id, { ...row, style: previous });
		this.#pushToCanvas();
	}

	/** Show a reorder drag in progress. Not pushed to the canvas, and not posted anywhere. */
	previewOrder(collection: OrderedCollection, ids: number[]): void {
		this.#orderPreview.set(collection, ids);
	}

	/**
	 * Apply a finished reorder drag: renumber the rows so the new order is the committed one.
	 *
	 * @param collection - Which collection was dragged
	 * @param ids - Every id in that collection, in the new display order
	 */
	applyOrder(collection: OrderedCollection, ids: number[]): void {
		const rows = this.#rowsOf(collection);

		if (!this.#pendingOrder.has(collection)) {
			this.#pendingOrder.set(
				collection,
				[...rows.values()].map((row) => [row.id, row.order])
			);
		}

		this.#orderPreview.set(collection, ids);
		renumber(rows, ids);
		this.#pushToCanvas();
	}

	/** The server accepted a reorder: the rows carry the new order, so the preview can go. */
	confirmOrder(collection: OrderedCollection): void {
		this.#pendingOrder.delete(collection);
		this.#orderPreview.delete(collection);
	}

	/** The server rejected a reorder: put the previous order back. */
	revertOrder(collection: OrderedCollection): void {
		const previous = this.#pendingOrder.get(collection);
		this.#pendingOrder.delete(collection);
		this.#orderPreview.delete(collection);
		if (!previous) return;

		const rows = this.#rowsOf(collection);
		for (const [id, order] of previous) {
			const row = rows.get(id);
			if (!row || row.order === order) continue;

			rows.set(id, { ...row, order });
		}

		this.#pushToCanvas();
	}

	/** Show a lecture membership drag in progress. Not pushed to the canvas. */
	previewLectureSubjects(lectureId: number, subjectIds: number[]): void {
		this.#lectureSubjectPreview.set(lectureId, subjectIds);
	}

	/**
	 * Apply a finished lecture membership drag, so the lectures view repartitions into
	 * past/present/future without waiting for a reload.
	 *
	 * @param lectureId - The lecture whose subjects changed
	 * @param subjectIds - The lecture's subjects, in display order
	 */
	setLectureSubjects(lectureId: number, subjectIds: number[]): void {
		if (!this.#lectures.has(lectureId)) return;

		if (!this.#pendingLectureSubjects.has(lectureId)) {
			this.#pendingLectureSubjects.set(lectureId, this.committedSubjectIdsOf(lectureId));
		}
		this.#pendingLectureSubjectsTarget.set(lectureId, subjectIds);

		this.#lectureSubjects.set(lectureId, subjectIds);
		this.#lectureSubjectPreview.delete(lectureId);

		// Keep the row's persisted order field in step, so it never contradicts the membership map
		const row = this.#lectures.get(lectureId);
		if (row) this.#lectures.set(lectureId, { ...row, subjectOrder: subjectIds });

		this.#pushToCanvas();
	}

	/** The server accepted a membership change: stop holding on to the old membership. */
	confirmLectureSubjects(lectureId: number): void {
		this.#pendingLectureSubjects.delete(lectureId);
		this.#pendingLectureSubjectsTarget.delete(lectureId);
	}

	/** Drop a membership drag, or put the previous membership back if it was already applied. */
	revertLectureSubjects(lectureId: number): void {
		this.#lectureSubjectPreview.delete(lectureId);

		const previous = this.#pendingLectureSubjects.get(lectureId);
		this.#pendingLectureSubjects.delete(lectureId);
		this.#pendingLectureSubjectsTarget.delete(lectureId);
		if (!previous) {
			this.#pushToCanvas();
			return;
		}

		this.#lectureSubjects.set(lectureId, previous);
		this.#pushToCanvas();
	}

	/**
	 * Record positions the canvas has already moved nodes to, so a later projection does not pull
	 * them back to whatever the last load carried. The canvas is not pushed a new projection here:
	 * it is the one that moved the nodes.
	 *
	 * @param domains - Moved domain nodes, in whole grid units
	 * @param subjects - Moved subject nodes, in whole grid units
	 */
	recordPositions(domains: NodePosition[], subjects: NodePosition[]): void {
		for (const moved of domains) {
			const row = this.#domains.get(moved.id);
			if (!row || (row.x === moved.x && row.y === moved.y)) continue;

			this.#domains.set(moved.id, { ...row, x: moved.x, y: moved.y });
		}

		for (const moved of subjects) {
			const row = this.#subjects.get(moved.id);
			if (!row || (row.x === moved.x && row.y === moved.y)) continue;

			this.#subjects.set(moved.id, { ...row, x: moved.x, y: moved.y });
		}
	}

	// -----------------------------> Internals

	#rowsOf(collection: OrderedCollection): SvelteMap<number, { id: number; order: number }> {
		if (collection === 'domains') return this.#domains;
		if (collection === 'subjects') return this.#subjects;

		return this.#lectures;
	}

	#pushToCanvas(options: { recenter?: boolean } = {}): void {
		this.#canvas?.applyData(this.graphData, options);
	}

	#clear(): void {
		this.#domains.clear();
		this.#subjects.clear();
		this.#lectures.clear();
		this.#lectureSubjects.clear();
		this.#domainEdges.clear();
		this.#subjectEdges.clear();
		this.#lectureSubjectPreview.clear();
		this.#orderPreview.clear();
		this.#pendingOrder.clear();
		this.#pendingStyle.clear();
		this.#pendingStyleTarget.clear();
		this.#pendingLectureSubjects.clear();
		this.#pendingLectureSubjectsTarget.clear();
	}
}

/** The three collections the editor lets a user drag into a new order. */
export type OrderedCollection = 'domains' | 'subjects' | 'lectures';

// -----------------------------> Context

const GRAPH_STORE_KEY = Symbol('graphStore');

/**
 * Create the store for a graph and put it in context, for the tables and the canvas below to read.
 * Call this in the component that loads the graph (the graph editor layout, the public viewer
 * page), during render rather than in an `$effect`, so server-rendered markup has the data too.
 *
 * @param payload - The graph as returned by GraphActions.getRenderablePayload
 * @returns The store, so the caller can hydrate it when its load data changes
 */
export function setGraphStore(payload: RenderableGraph): GraphStore {
	const store = new GraphStore(payload);
	setContext(GRAPH_STORE_KEY, store);

	return store;
}

/** Read the graph store from context. Throws if no ancestor called setGraphStore. */
export function getGraphStore(): GraphStore {
	const store = getContext<GraphStore | undefined>(GRAPH_STORE_KEY);
	if (!store) {
		throw new Error('No graph store in context, call setGraphStore in an ancestor component');
	}

	return store;
}

// -----------------------------> Helpers

/** Write `ids`' positions onto the rows' `order` field, replacing only the rows that moved. */
function renumber<Row extends { id: number; order: number }>(
	rows: SvelteMap<number, Row>,
	ids: number[]
): void {
	ids.forEach((id, index) => {
		const row = rows.get(id);
		if (!row || row.order === index) return;

		rows.set(id, { ...row, order: index });
	});
}

/** Rows by display order: the order of an in-flight drag if there is one, else the `order` field. */
function ordered<Row extends { id: number; order: number }>(
	rows: SvelteMap<number, Row>,
	preview: number[] | undefined
): Row[] {
	if (preview !== undefined) {
		const dragged = preview.flatMap((id) => rows.get(id) ?? []);
		if (dragged.length === rows.size) return dragged;
	}

	return [...rows.values()].sort((a, b) => a.order - b.order);
}
