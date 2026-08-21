import { getContext, setContext } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';

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
import type { GraphCanvas, GraphData, NodePositions, PositionSink } from '$lib/d3/types';
import type { Issues } from '$lib/validators/types';
import type {
	DomainRow,
	EdgeKey,
	GraphModel,
	GraphPayload,
	GraphWithRelations,
	LectureRow,
	SubjectRow
} from './model';

/**
 * The single owner of one graph's contents while it is open in the editor or the public viewer.
 *
 * The server stays the source of truth: `hydrate` reconciles the loader's payload into the model,
 * and every form action still round-trips through `invalidateAll`. What this class owns is the
 * *write path*. Nothing else may hold a mutable copy of a graph:
 *
 * - the editor tables and form components read the payload-shaped `graph` projection
 * - the D3 canvas is handed the `graphData` projection, and is pushed a fresh one on every change
 * - the four mutations that bypass form actions (style, the three orders, lecture membership,
 *   node positions) are methods here, each doing the optimistic update, the request, and the
 *   rollback in one place
 *
 * Internally the model is id-keyed and relations are id pairs, so there is exactly one row per
 * entity to update and no duplicated relation rows to keep in step. Object references between
 * nodes are created in `projectGraphData` and nowhere else.
 */
export class GraphStore implements PositionSink {
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

	// A drag whose request is still in flight keeps its preview, so a reload that lands while the
	// server has not caught up yet cannot pull the display back to the order it still knows
	readonly #committingOrder = new SvelteSet<OrderedCollection>();
	readonly #committingLectures = new SvelteSet<number>();

	/** The mounted canvas, while there is one. Pushed to, never read from. */
	#canvas: GraphCanvas | null = null;

	constructor(payload: GraphPayload) {
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
	hydrate(payload: GraphPayload): void {
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
		// behind. A drag still waiting for its request keeps its preview: the reload is behind it,
		// not ahead of it, and the commit re-asserts the order once the server confirms.
		for (const collection of [...this.#orderPreview.keys()]) {
			if (this.#committingOrder.has(collection)) continue;

			this.#orderPreview.delete(collection);
			changed = true;
		}
		for (const lectureId of [...this.#lectureSubjectPreview.keys()]) {
			if (this.#committingLectures.has(lectureId)) continue;

			this.#lectureSubjectPreview.delete(lectureId);
			changed = true;
		}

		if (changed) this.#pushToCanvas({ recenter: isNewGraph });
	}

	// -----------------------------> Canvas binding

	/**
	 * Bind a freshly mounted canvas to this store: it will be pushed a new projection whenever the
	 * model changes, and its node positions are persisted through this store.
	 *
	 * @param canvas - The canvas to bind, already constructed from `graphData`
	 */
	attachCanvas(canvas: GraphCanvas): void {
		this.#canvas = canvas;
		canvas.positionSink = this;
	}

	/**
	 * Unbind a canvas that is going away. Ignores a canvas that is not the bound one, so an
	 * out-of-order unmount cannot detach its replacement.
	 *
	 * @param canvas - The canvas to unbind
	 */
	detachCanvas(canvas: GraphCanvas): void {
		if (this.#canvas !== canvas) return;

		canvas.positionSink = null;
		this.#canvas = null;
	}

	// -----------------------------> Mutations

	/**
	 * Restyle a domain, on the tables and on the canvas (nodes, their edges, and the subjects that
	 * inherit the domain's style), then persist it.
	 *
	 * @param id - The domain's id
	 * @param style - The new style, or null to clear it
	 * @returns Whether the server accepted the change; on failure the style is rolled back
	 */
	async setDomainStyle(id: number, style: DomainStyle | null): Promise<boolean> {
		const row = this.#domains.get(id);
		if (!row) return false;

		const previous = row.style;
		this.#setDomainStyle(id, style);

		const ok = await patch('/api/domains/style', { domainId: id, style });
		if (!ok) {
			this.#setDomainStyle(id, previous);
			toast.error('Failed to update domain style, try again later');
		}

		return ok;
	}

	/** Show a reorder drag in progress. Not persisted, and not pushed to the canvas. */
	previewOrder(collection: OrderedCollection, ids: number[]): void {
		this.#orderPreview.set(collection, ids);
	}

	/**
	 * Commit a finished domain reorder: renumber the rows, push, and persist.
	 *
	 * @param ids - Every domain id, in the new display order
	 * @returns Whether the server accepted the new order; on failure the old order is restored
	 */
	async commitDomainOrder(ids: number[]): Promise<boolean> {
		const ok = await this.#commitOrder(
			'domains',
			this.#domains,
			ids,
			'/api/domains/order',
			(id, newOrder) => ({ domainId: id, newOrder })
		);
		if (!ok) toast.error('Failed to update domain order, try again later!');

		return ok;
	}

	/**
	 * Commit a finished subject reorder: renumber the rows, push, and persist.
	 *
	 * @param ids - Every subject id, in the new display order
	 * @returns Whether the server accepted the new order; on failure the old order is restored
	 */
	async commitSubjectOrder(ids: number[]): Promise<boolean> {
		const ok = await this.#commitOrder(
			'subjects',
			this.#subjects,
			ids,
			'/api/subjects/order',
			(id, newOrder) => ({ subjectId: id, newOrder })
		);
		if (!ok) toast.error('Failed to update subject order, try again later!');

		return ok;
	}

	/**
	 * Commit a finished lecture reorder: renumber the rows, push, and persist.
	 *
	 * @param ids - Every lecture id, in the new display order
	 * @returns Whether the server accepted the new order; on failure the old order is restored
	 */
	async commitLectureOrder(ids: number[]): Promise<boolean> {
		const ok = await this.#commitOrder(
			'lectures',
			this.#lectures,
			ids,
			'/api/lectures/order',
			(id, newOrder) => ({ lectureId: id, newOrder })
		);
		if (!ok) toast.error('Error while reordering lectures');

		return ok;
	}

	/** Show a lecture membership drag in progress. Not persisted, and not pushed to the canvas. */
	previewLectureSubjects(lectureId: number, subjectIds: number[]): void {
		this.#lectureSubjectPreview.set(lectureId, subjectIds);
	}

	/** Drop a lecture membership drag without persisting it. */
	revertLectureSubjects(lectureId: number): void {
		this.#lectureSubjectPreview.delete(lectureId);
	}

	/**
	 * Commit a finished lecture membership drag, so the lectures view of the canvas repartitions
	 * into past/present/future without needing a reload.
	 *
	 * @param lectureId - The lecture whose subjects changed
	 * @param subjectIds - The lecture's subjects, in display order
	 * @returns Whether the server accepted the change; on failure the old membership is restored
	 */
	async commitLectureSubjects(lectureId: number, subjectIds: number[]): Promise<boolean> {
		const lecture = this.#lectures.get(lectureId);
		if (!lecture) return false;

		const previous = this.committedSubjectIdsOf(lectureId);

		this.#lectureSubjectPreview.set(lectureId, subjectIds);
		this.#committingLectures.add(lectureId);
		this.#pushToCanvas();

		const ok = await patch('/api/lectures/order-subjects', {
			name: lecture.name,
			graphId: lecture.graphId,
			lectureId,
			subjectIds
		});

		this.#committingLectures.delete(lectureId);
		this.#lectureSubjects.set(lectureId, ok ? subjectIds : previous);
		this.#lectureSubjectPreview.delete(lectureId);
		this.#pushToCanvas();

		if (!ok) toast.error('Error while reordering lectures');

		return ok;
	}

	/**
	 * Record and persist node positions the canvas has already moved. Called by NodeToolbox on
	 * drag end and when the simulation is stopped or reset. The canvas is not pushed a new
	 * projection here: it is the one that moved the nodes, and re-projecting would only hand it
	 * back the positions it already has.
	 *
	 * @param positions - The moved nodes, split into domains and subjects
	 */
	async persistPositions({ domains, subjects }: NodePositions): Promise<void> {
		for (const moved of domains) {
			const row = this.#domains.get(moved.id);
			if (!row) continue;

			this.#domains.set(moved.id, { ...row, x: Math.round(moved.x), y: Math.round(moved.y) });
		}

		for (const moved of subjects) {
			const row = this.#subjects.get(moved.id);
			if (!row) continue;

			this.#subjects.set(moved.id, { ...row, x: Math.round(moved.x), y: Math.round(moved.y) });
		}

		const requests: Promise<boolean>[] = [];
		if (domains.length > 0) {
			requests.push(
				patch(
					'/api/domains/position',
					domains.map((moved) => ({
						domainId: moved.id,
						x: Math.round(moved.x),
						y: Math.round(moved.y)
					}))
				)
			);
		}

		if (subjects.length > 0) {
			requests.push(
				patch(
					'/api/subjects/position',
					subjects.map((moved) => ({
						subjectId: moved.id,
						x: Math.round(moved.x),
						y: Math.round(moved.y)
					}))
				)
			);
		}

		const results = await Promise.all(requests);
		if (results.some((ok) => !ok)) {
			toast.error('Failed to save node positions', { duration: 2000 });
		}
	}

	// -----------------------------> Internals

	#setDomainStyle(id: number, style: DomainStyle | null): void {
		const row = this.#domains.get(id);
		if (!row) return;

		this.#domains.set(id, { ...row, style });
		this.#pushToCanvas();
	}

	async #commitOrder<Row extends { id: number; order: number }>(
		collection: OrderedCollection,
		rows: SvelteMap<number, Row>,
		ids: number[],
		url: string,
		body: (id: number, newOrder: number) => unknown
	): Promise<boolean> {
		const previous = [...rows.values()].map((row) => [row.id, row.order] as const);

		this.#orderPreview.set(collection, ids);
		this.#committingOrder.add(collection);
		renumber(rows, ids);
		this.#pushToCanvas();

		const ok = await patch(
			url,
			ids.map((id, index) => body(id, index))
		);

		this.#committingOrder.delete(collection);

		if (ok) {
			// Re-assert, in case a reload landed mid-request and wrote the server's old order
			renumber(rows, ids);
		} else {
			for (const [id, order] of previous) {
				const row = rows.get(id);
				if (!row || row.order === order) continue;

				rows.set(id, { ...row, order });
			}
		}

		this.#orderPreview.delete(collection);
		this.#pushToCanvas();

		return ok;
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
		this.#committingOrder.clear();
		this.#committingLectures.clear();
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
export function setGraphStore(payload: GraphPayload): GraphStore {
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

async function patch(url: string, body: unknown): Promise<boolean> {
	try {
		const response = await fetch(url, {
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: { 'content-type': 'application/json' }
		});

		return response.ok;
	} catch {
		return false;
	}
}
