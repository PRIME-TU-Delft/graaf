import { describe } from 'node:test';
import { expect, test } from 'vitest';
import { addConnection, dummyDomain, dummyGraph } from './utils';
import { GraphValidator } from '../graphValidator';
import type { Domain } from '@prisma/client';

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
		expect(cycle?.from.id).toBe(a.id);
		expect(cycle?.to.id).toBe(b.id);
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
