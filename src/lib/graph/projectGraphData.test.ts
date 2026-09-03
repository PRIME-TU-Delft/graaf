import { describe, expect, it } from 'vitest';

import { projectGraphData } from './projectGraphData';
import type { DomainRow, GraphModel, LectureRow, SubjectRow } from './model';

const timestamps = { createdAt: new Date(0), updatedAt: new Date(0) };

function domain(id: number, extra: Partial<DomainRow> = {}): DomainRow {
	return {
		id,
		name: `domain ${id}`,
		style: null,
		order: id,
		x: id,
		y: id,
		graphId: 1,
		...timestamps,
		...extra
	};
}

function subject(id: number, extra: Partial<SubjectRow> = {}): SubjectRow {
	return {
		id,
		name: `subject ${id}`,
		order: id,
		x: id,
		y: id,
		graphId: 1,
		domainId: null,
		...timestamps,
		...extra
	};
}

function lecture(id: number, subjectIds: number[]): LectureRow & { subjectIds: number[] } {
	return {
		id,
		name: `lecture ${id}`,
		order: id,
		subjectOrder: subjectIds,
		graphId: 1,
		...timestamps,
		subjectIds
	};
}

/**
 * Two domains with a relation between them, three subjects (two in the first domain, one in the
 * second) chained 1 -> 2 -> 3, and a lecture covering the middle subject.
 */
function model(): GraphModel {
	return {
		id: 1,
		domains: [domain(1, { style: 'SUNNY_YELLOW' }), domain(2)],
		subjects: [
			subject(1, { domainId: 1 }),
			subject(2, { domainId: 1 }),
			subject(3, { domainId: 2 })
		],
		lectures: [lecture(1, [2])],
		domainEdges: ['1->2'],
		subjectEdges: ['1->2', '2->3']
	};
}

describe('projectGraphData', () => {
	it('projects nodes, edges and lectures from the model', () => {
		const data = projectGraphData(model());

		expect(data.domain_nodes.map((node) => node.uuid)).toEqual(['domain-1', 'domain-2']);
		expect(data.subject_nodes.map((node) => node.uuid)).toEqual([
			'subject-1',
			'subject-2',
			'subject-3'
		]);
		expect(data.domain_edges.map((edge) => edge.uuid)).toEqual(['domain-1-2']);
		expect(data.subject_edges.map((edge) => edge.uuid)).toEqual(['subject-1-2', 'subject-2-3']);
		expect(data.lectures).toHaveLength(1);
	});

	it('inherits a subject node style from its parent domain', () => {
		const data = projectGraphData(model());

		expect(data.subject_nodes[0].style).toBe('SUNNY_YELLOW');
		expect(data.subject_nodes[2].style).toBeNull();
	});

	it('partitions a lecture into past, present and future nodes', () => {
		const [projected] = projectGraphData(model()).lectures;

		expect(projected.present_nodes.map((node) => node.id)).toEqual([2]);
		expect(projected.past_nodes.map((node) => node.id)).toEqual([1]);
		expect(projected.future_nodes.map((node) => node.id)).toEqual([3]);
		expect(projected.domains.map((node) => node.id)).toEqual([1]);
	});

	// The invariant documented on projectGraphData. NodeToolbox.updateHighlight,
	// TransitionToolbox.lectureTransform, EdgeToolbox.updatePosition and d3.forceLink all break
	// silently if any of these stop being reference-equal.
	describe('reference identity', () => {
		it('points every edge at the node objects in the node lists', () => {
			const data = projectGraphData(model());
			const domainOf = (id: number) => data.domain_nodes.find((node) => node.id === id);
			const subjectOf = (id: number) => data.subject_nodes.find((node) => node.id === id);

			expect(data.domain_edges[0].source).toBe(domainOf(1));
			expect(data.domain_edges[0].target).toBe(domainOf(2));
			expect(data.subject_edges[0].source).toBe(subjectOf(1));
			expect(data.subject_edges[1].target).toBe(subjectOf(3));
		});

		it('points every subject at its parent domain node', () => {
			const data = projectGraphData(model());

			expect(data.subject_nodes[0].parent).toBe(data.domain_nodes[0]);
			expect(data.subject_nodes[2].parent).toBe(data.domain_nodes[1]);
			expect(data.subject_nodes[0].parent).toBe(data.subject_nodes[1].parent);
		});

		it('points every lecture node and edge at the shared node objects', () => {
			const data = projectGraphData(model());
			const [projected] = data.lectures;

			expect(projected.present_nodes[0]).toBe(data.subject_nodes[1]);
			expect(projected.past_nodes[0]).toBe(data.subject_nodes[0]);
			expect(projected.future_nodes[0]).toBe(data.subject_nodes[2]);
			expect(projected.domains[0]).toBe(data.domain_nodes[0]);
			expect(projected.edges[0]).toBe(data.subject_edges[0]);
			expect(projected.nodes).toContain(data.subject_nodes[1]);
		});

		it('moves an edge endpoint when the node it points at moves', () => {
			const data = projectGraphData(model());

			data.domain_nodes[0].x = 42;

			expect(data.domain_edges[0].source.x).toBe(42);
		});
	});

	// GraphD3 keeps a position snapshot rather than a deep clone, but a GraphData still has to be
	// clonable: structuredClone throws on a Svelte $state proxy, so this fails the moment the
	// projection starts handing reactive objects to the canvas.
	it('returns plain objects that can be structured-cloned', () => {
		const data = projectGraphData(model());

		expect(() => structuredClone(data)).not.toThrow();

		// structuredClone keeps shared references shared, which is what the old data_backup relied on
		const clone = structuredClone(data);
		expect(clone.domain_edges[0].source).toBe(clone.domain_nodes[0]);
	});

	it('throws when a relation references a missing entity', () => {
		const dangling = model();
		dangling.domainEdges = ['1->404'];

		expect(() => projectGraphData(dangling)).toThrow(/missing domain/);
	});

	it('throws when a lecture references a missing subject', () => {
		const dangling = model();
		dangling.lectures = [lecture(1, [404])];

		expect(() => projectGraphData(dangling)).toThrow(/missing subject/);
	});
});
