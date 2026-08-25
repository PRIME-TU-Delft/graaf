import { describe, expect, it } from 'vitest';

import { GraphStore } from './graphStore.svelte';

import type { GraphCanvas, GraphData } from '$lib/d3/types';
import type { GraphPayload } from './model';

const timestamps = { createdAt: new Date(0), updatedAt: new Date(0) };

/** A graph with two domains related 1 -> 2, a subject in each, and a lecture holding subject 1. */
function payload(): GraphPayload {
	return {
		id: 1,
		name: 'graph',
		parentType: 'COURSE',
		courseId: 1,
		sandboxId: null,
		...timestamps,
		domains: [
			{
				id: 1,
				name: 'domain 1',
				style: 'SUNNY_YELLOW',
				order: 0,
				x: 0,
				y: 0,
				graphId: 1,
				...timestamps,
				sourceDomains: [],
				targetDomains: [{ id: 2 }]
			},
			{
				id: 2,
				name: 'domain 2',
				style: null,
				order: 1,
				x: 4,
				y: 0,
				graphId: 1,
				...timestamps,
				sourceDomains: [{ id: 1 }],
				targetDomains: []
			}
		],
		subjects: [
			{
				id: 1,
				name: 'subject 1',
				order: 0,
				x: 0,
				y: 2,
				graphId: 1,
				domainId: 1,
				...timestamps,
				sourceSubjects: [],
				targetSubjects: []
			},
			{
				id: 2,
				name: 'subject 2',
				order: 1,
				x: 4,
				y: 2,
				graphId: 1,
				domainId: 2,
				...timestamps,
				sourceSubjects: [],
				targetSubjects: []
			}
		],
		lectures: [
			{
				id: 1,
				name: 'lecture 1',
				order: 0,
				subjectOrder: [1],
				graphId: 1,
				...timestamps,
				subjects: [{ id: 1 }]
			}
		]
	};
}

/** Stands in for GraphD3, recording what the store pushes at it. */
class FakeCanvas implements GraphCanvas {
	pushes: { data: GraphData; recenter: boolean }[] = [];

	applyData(data: GraphData, options: { recenter?: boolean } = {}) {
		this.pushes.push({ data, recenter: options.recenter ?? false });
	}

	get last(): GraphData {
		return this.pushes[this.pushes.length - 1].data;
	}
}

function attached(): { store: GraphStore; canvas: FakeCanvas } {
	const store = new GraphStore(payload());
	const canvas = new FakeCanvas();
	store.attachCanvas(canvas);

	return { store, canvas };
}

const styleOf = (data: GraphData, uuid: string) =>
	[...data.domain_nodes, ...data.subject_nodes].find((node) => node.uuid === uuid)?.style;

describe('GraphStore', () => {
	describe('hydration', () => {
		it('projects the payload for the tables, resolving relations through the model', () => {
			const store = new GraphStore(payload());

			expect(store.name).toBe('graph');
			expect(store.domains.map((domain) => domain.id)).toEqual([1, 2]);
			// Relation arrays hold the canonical rows, which carry no relation arrays of their own,
			// so the projection a table reads stays acyclic
			expect(store.graph.domains[0].targetDomains).toEqual([store.domains[1]]);
			expect(store.graph.domains[0].targetDomains[0]).toBe(store.domains[1]);
			expect(store.graph.domains[1].sourceDomains[0]).toBe(store.domains[0]);
			expect(store.graph.subjects[0].domain?.name).toBe('domain 1');
			expect(store.graph.lectures[0].subjects.map((subject) => subject.id)).toEqual([1]);
		});

		it('owns validation instead of each page recomputing it', () => {
			const store = new GraphStore(payload());

			expect(store.issues.domainIssues).toBeDefined();
			expect(store.issues.lectureIssues).toBeDefined();
		});

		it('does nothing when hydrated with the same payload again', () => {
			const { store, canvas } = attached();

			store.hydrate(payload());

			expect(canvas.pushes).toHaveLength(0);
		});

		it('keeps row identity for rows that did not change', () => {
			const store = new GraphStore(payload());
			const before = store.domains[1];

			const renamed = payload();
			renamed.domains[0].name = 'renamed';
			store.hydrate(renamed);

			expect(store.domains[0].name).toBe('renamed');
			expect(store.domains[1]).toBe(before);
		});

		it('pushes a changed payload at the canvas', () => {
			const { store, canvas } = attached();

			const renamed = payload();
			renamed.domains[0].name = 'renamed';
			store.hydrate(renamed);

			expect(canvas.pushes).toHaveLength(1);
			expect(canvas.pushes[0].recenter).toBe(false);
			expect(canvas.last.domain_nodes[0].text).toBe('renamed');
		});

		it('drops deleted entities and their relations', () => {
			const { store, canvas } = attached();

			const deleted = payload();
			deleted.domains = [deleted.domains[0]];
			deleted.domains[0].targetDomains = [];
			deleted.subjects = [deleted.subjects[0]];
			store.hydrate(deleted);

			expect(store.domains).toHaveLength(1);
			expect(canvas.last.domain_edges).toHaveLength(0);
			expect(canvas.last.subject_nodes).toHaveLength(1);
		});

		it('recenters when handed a different graph', () => {
			const { store, canvas } = attached();

			const other = payload();
			other.id = 2;
			store.hydrate(other);

			expect(canvas.pushes.at(-1)?.recenter).toBe(true);
		});
	});

	describe('domain style', () => {
		it('restyles the domain, its edges and the subjects that inherit from it', () => {
			const { store, canvas } = attached();

			store.setDomainStyle(1, 'MYSTERIOUS_BLUE');

			expect(store.graph.domains[0].style).toBe('MYSTERIOUS_BLUE');

			// One write, one projection: the subject inheriting the style and the edge leaving the
			// domain follow without a second update call
			expect(styleOf(canvas.last, 'domain-1')).toBe('MYSTERIOUS_BLUE');
			expect(styleOf(canvas.last, 'subject-1')).toBe('MYSTERIOUS_BLUE');
			expect(canvas.last.domain_edges[0].source.style).toBe('MYSTERIOUS_BLUE');
		});

		it('puts the old style back when the server rejects it', () => {
			const { store, canvas } = attached();

			store.setDomainStyle(1, 'MYSTERIOUS_BLUE');
			store.revertDomainStyle(1);

			expect(store.graph.domains[0].style).toBe('SUNNY_YELLOW');
			expect(styleOf(canvas.last, 'subject-1')).toBe('SUNNY_YELLOW');
		});

		it('keeps the applied style once confirmed', () => {
			const { store } = attached();

			store.setDomainStyle(1, 'MYSTERIOUS_BLUE');
			store.confirmDomainStyle(1);
			store.revertDomainStyle(1); // nothing left to revert

			expect(store.graph.domains[0].style).toBe('MYSTERIOUS_BLUE');
		});
	});

	describe('reorder', () => {
		it('shows a drag in progress without pushing it at the canvas', () => {
			const { store, canvas } = attached();

			store.previewOrder('domains', [2, 1]);

			expect(store.domains.map((domain) => domain.id)).toEqual([2, 1]);
			expect(canvas.pushes).toHaveLength(0);
		});

		it('renumbers the rows when a drag is applied', () => {
			const { store, canvas } = attached();

			store.previewOrder('domains', [2, 1]);
			store.applyOrder('domains', [2, 1]);
			store.confirmOrder('domains');

			expect(store.domains.map((domain) => domain.id)).toEqual([2, 1]);
			expect(store.domains.map((domain) => domain.order)).toEqual([0, 1]);
			expect(canvas.pushes.length).toBeGreaterThan(0);
		});

		it('restores the previous order when the server rejects it', () => {
			const { store } = attached();

			store.applyOrder('subjects', [2, 1]);
			store.revertOrder('subjects');

			expect(store.subjects.map((subject) => subject.id)).toEqual([1, 2]);
			expect(store.subjects.map((subject) => subject.order)).toEqual([0, 1]);
		});

		// A reload landing before the server answers still carries the order it had before the
		// drag, so hydrating on top of a pending reorder must not pull the display back to it
		it('survives a reload that lands while the reorder is still pending', () => {
			const { store } = attached();

			store.applyOrder('domains', [2, 1]);
			store.hydrate(payload());

			expect(store.domains.map((domain) => domain.id)).toEqual([2, 1]);

			store.confirmOrder('domains');
			expect(store.domains.map((domain) => domain.id)).toEqual([2, 1]);
		});
	});

	describe('lecture membership', () => {
		it('repartitions the canvas when a subject moves into a lecture', () => {
			const { store, canvas } = attached();

			store.setLectureSubjects(1, [1, 2]);

			expect(store.graph.lectures[0].subjects.map((subject) => subject.id)).toEqual([1, 2]);
			expect(canvas.last.lectures[0].present_nodes.map((node) => node.id)).toEqual([1, 2]);
			// The row's persisted order field follows the membership map
			expect(store.graph.lectures[0].subjectOrder).toEqual([1, 2]);
		});

		it('restores the previous membership when the server rejects it', () => {
			const { store, canvas } = attached();

			store.setLectureSubjects(1, [1, 2]);
			store.revertLectureSubjects(1);

			expect(store.committedSubjectIdsOf(1)).toEqual([1]);
			expect(canvas.last.lectures[0].present_nodes.map((node) => node.id)).toEqual([1]);
		});

		it('drops a preview that was never applied', () => {
			const { store } = attached();

			store.previewLectureSubjects(1, [1, 2]);
			expect(store.subjectIdsOf(1)).toEqual([1, 2]);

			store.revertLectureSubjects(1);
			expect(store.subjectIdsOf(1)).toEqual([1]);
		});

		it('survives a reload that lands while the membership change is still pending', () => {
			const { store } = attached();

			store.setLectureSubjects(1, [1, 2]);
			store.hydrate(payload());

			expect(store.subjectIdsOf(1)).toEqual([1, 2]);

			store.confirmLectureSubjects(1);
			expect(store.committedSubjectIdsOf(1)).toEqual([1, 2]);
		});
	});

	describe('positions', () => {
		it('records moved positions on the rows without pushing them back at the canvas', () => {
			const { store, canvas } = attached();

			store.recordPositions([{ id: 1, x: 3, y: -3 }], []);

			expect(store.graph.domains[0].x).toBe(3);
			expect(store.graph.domains[0].y).toBe(-3);

			// The canvas moved these nodes itself, so pushing them back at it would be busywork
			expect(canvas.pushes).toHaveLength(0);
		});

		it('keeps recorded positions through a later projection', () => {
			const { store, canvas } = attached();

			store.recordPositions([{ id: 1, x: 7, y: 8 }], []);
			store.setDomainStyle(1, null);

			const node = canvas.last.domain_nodes.find((n) => n.id === 1);
			expect([node?.x, node?.y]).toEqual([7, 8]);
		});
	});

	describe('canvas binding', () => {
		it('stops pushing at a canvas that detached', () => {
			const { store, canvas } = attached();

			store.detachCanvas(canvas);
			store.setDomainStyle(1, null);

			expect(canvas.pushes).toHaveLength(0);
		});

		it('ignores a detach from a canvas it is not bound to', () => {
			const { store, canvas } = attached();

			store.detachCanvas(new FakeCanvas());
			store.setDomainStyle(1, null);

			expect(canvas.pushes.length).toBeGreaterThan(0);
		});
	});
});
