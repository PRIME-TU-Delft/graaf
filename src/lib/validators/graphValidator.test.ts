import { beforeEach, describe, expect, it, test } from 'vitest';
import { GraphValidator } from '$lib/validators/graphValidator';

import type { DomainType, GraphType } from '$lib/validators/graphValidator';
import type { Domain } from '@prisma/client';

function dummyDomain(name: string, id: number) {
	return {
		name,
		id,
		style: null,
		x: 0,
		y: 0,
		order: 0,
		sourceDomains: [] as Domain[],
		targetDomains: [] as Domain[],
		graphId: 0
	} as DomainType;
}

function dummyGraph(domains: DomainType[]) {
	return {
		name: 'graph',
		id: 0,
		courseId: 'CSE2000',
		createdAt: new Date(),
		updatedAt: new Date(),
		domains: domains
	} as GraphType;
}

function addConnection(from: DomainType, to: DomainType) {
	from.targetDomains.push(to);
	to.sourceDomains.push(from);
}

describe('Trivial graph', () => {
	// A -> B -> C
	// D
	// [empty graph]

	const a = dummyDomain('a', 0);
	const b = dummyDomain('b', 1);
	const c = dummyDomain('c', 2);

	addConnection(a, b);
	addConnection(b, c);

	const graph1 = dummyGraph([a, b, c]);
	const validator1 = new GraphValidator(graph1);

	const d = dummyDomain('d', 3);
	const graph2 = dummyGraph([d]);
	const validator2 = new GraphValidator(graph2);

	const validator3 = new GraphValidator(dummyGraph([]));

	test('has cycles is false', () => {
		expect(validator1.hasCycle(), 'v1').toBe(undefined);
		expect(validator2.hasCycle(), 'v2').toBe(undefined);

		expect(validator3.hasCycle(), 'empty graph').toBe(undefined);
	});

	test('domain "A" is the only root', () => {
		expect(validator1.roots.length).toBe(1); // There is only one root
		expect(validator1.roots).toContain(validator1.getDomainById(0)); // The root is domain 'a'
	});

	test('domain "D" is the only root', () => {
		expect(validator2.roots.length).toBe(1); // There is only one root
		expect(validator2.roots).toContain(validator2.getDomainById(3)); // The root is domain 'g'
	});

	test('sub graph sizes', () => {
		expect(validator1.getSubGraphs().length).toBe(1);
		expect(validator2.getSubGraphs().length).toBe(1);
		expect(validator3.getSubGraphs().length).toBe(0);
	});
});

describe('Cycle graph', () => {
	// A -> B -> C -> D -> A
	// G -> H -> G

	const a = dummyDomain('a', 0);
	const b = dummyDomain('b', 1);
	const c = dummyDomain('c', 2);
	const d = dummyDomain('d', 3);

	addConnection(a, b);
	addConnection(b, c);
	addConnection(c, d);
	addConnection(d, a);

	const graph1 = dummyGraph([a, b, c, d]);
	const validator1 = new GraphValidator(graph1);

	const g = dummyDomain('g', 0);
	const h = dummyDomain('h', 1);
	addConnection(g, h);
	addConnection(h, g);

	const graph2 = dummyGraph([g, h]);
	const validator2 = new GraphValidator(graph2);

	test('has cycles is true', () => {
		const c1 = validator1.hasCycle();
		expect(c1?.source.id).toBe((c1!.target.id - 1) % 4);

		const c2 = validator2.hasCycle();
		expect(c2?.source.id).toBe((c2!.target.id - 1) % 2);
	});

	test('graph1 has one root', () => {
		expect(validator1.roots.length).toBe(1); // There is only one root
	});

	test('graph2 has one root', () => {
		expect(validator1.roots.length).toBe(1); // There is only one root
	});
});

describe('multi roots graph', () => {
	// A -> B -> D -> F
	// C -> D

	const a = dummyDomain('a', 0);
	const b = dummyDomain('b', 1);
	const c = dummyDomain('c', 2);
	const d = dummyDomain('d', 3);
	const f = dummyDomain('f', 4);

	addConnection(a, b);
	addConnection(b, d);
	addConnection(d, f);
	addConnection(c, d);

	const graph1 = dummyGraph([a, b, c, d, f]);
	const validator1 = new GraphValidator(graph1);

	test('has cycles is false', () => {
		expect(validator1.hasCycle(), 'v1').toBe(undefined);
	});

	test('domain "A" and "C" are the only roots', () => {
		expect(validator1.roots.length).toBe(2); // There is only one root
		expect(validator1.roots).toContain(a); // The root contains domain 'a'
		expect(validator1.roots).toContain(c); // The root contains domain 'c'
	});
});

describe('Multi roots cycles graph', () => {
	// A -> B -> A
	// C
	// D

	const a = dummyDomain('a', 0);
	const b = dummyDomain('b', 1);
	const c = dummyDomain('c', 2);
	const d = dummyDomain('d', 3);

	addConnection(a, b);
	addConnection(b, a);

	const graph1 = dummyGraph([a, b, c, d]);
	const validator1 = new GraphValidator(graph1);

	test('has cycles is true', () => {
		const cycle = validator1.hasCycle();
		expect(cycle?.source.id).toBe(a.id);
		expect(cycle?.target.id).toBe(b.id);
	});

	test('roots are a, c and d', () => {
		expect(validator1.roots.length).toBe(3); // There is only one root

		// Because the graph has a cycle, the roots will be either a or b, but not both
		expect(validator1.roots).toSatisfy((roots: Domain[]) => {
			return (roots.includes(a) || roots.includes(b)) && !(roots.includes(a) && roots.includes(b));
		});

		// These are the other subgraphs roots
		expect(validator1.roots).toContain(c); // The root contains domain 'c'
		expect(validator1.roots).toContain(d); // The root contains domain 'd'
	});

	test('sub graph sizes', () => {
		expect(validator1.getSubGraphs().length).toBe(3);
	});
});

describe('Complex graph', () => {
	//        <-> E
	//       /
	// A -> B -> C -> D

	const a = dummyDomain('a', 0);
	const b = dummyDomain('b', 1);
	const c = dummyDomain('c', 2);
	const d = dummyDomain('d', 3);
	const e = dummyDomain('e', 4);

	addConnection(a, b);
	addConnection(b, c);
	addConnection(c, d);

	addConnection(b, e);
	addConnection(e, b);

	const graph1 = dummyGraph([a, b, c, d, e]);
	const validator1 = new GraphValidator(graph1);

	test('has cycles is true', () => {
		const cycle = validator1.hasCycle();
		expect(cycle?.source.id).toBe(e.id);
		expect(cycle?.target.id).toBe(b.id);
	});

	test('domain "A" is the only root', () => {
		expect(validator1.roots.length).toBe(1); // There is only one root
		expect(validator1.roots).toContain(validator1.getDomainById(0)); // The root is domain 'a'
	});
});

describe('Remove edge is sound', () => {
	let graph: GraphType;
	let validator: GraphValidator;

	beforeEach(() => {
		const a = dummyDomain('a', 0);
		const b = dummyDomain('b', 1);

		addConnection(a, b);

		graph = dummyGraph([a, b]);
		validator = new GraphValidator(graph);
	});

	it('remove edge', () => {
		const a = validator.getDomainById(0)!;
		const b = validator.getDomainById(1)!;

		expect(validator.hasEdge(a, b)).toBe(true);
		validator.removeEdge(a, b);

		expect(b.sourceDomains.length).toBe(0);
		expect(a.targetDomains.length).toBe(0);
		expect(validator.hasEdge(a, b)).toBe(false);
	});

	describe('Teun graph insane', () => {
		const a = dummyDomain('a', 0);
		const b = dummyDomain('b', 1);
		const c = dummyDomain('c', 2);
		const d = dummyDomain('d', 3);
		const e = dummyDomain('e', 4);
		const f = dummyDomain('f', 5);
		const g = dummyDomain('g', 6);

		addConnection(a, c);
		addConnection(c, b);
		addConnection(c, e);
		addConnection(e, d);
		addConnection(d, b);
		addConnection(e, g);
		addConnection(g, f);
		addConnection(f, d);
		addConnection(b, a);

		const graph1 = dummyGraph([a, b, c, d, e, f, g]);
		const validator1 = new GraphValidator(graph1);

		test('has cycles is true', () => {
			const cycle = validator1.hasCycle();

			expect(cycle?.source.id).toBe(c.id);
			expect(cycle?.target.id).toBe(b.id);
		});
	});
});
