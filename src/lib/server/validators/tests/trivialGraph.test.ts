import { describe } from 'node:test';
import { expect, test } from 'vitest';
import { addConnection, dummyDomain, dummyGraph } from './utils';
import { GraphValidator } from '../graphValidator';

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
		expect(validator1.roots).toContain(validator1.getDomain(0)); // The root is domain 'a'
	});

	test('domain "D" is the only root', () => {
		expect(validator2.roots.length).toBe(1); // There is only one root
		expect(validator2.roots).toContain(validator2.getDomain(3)); // The root is domain 'g'
	});

	test('sub graph sizes', () => {
		expect(validator1.getSubGraphs().length).toBe(1);
		expect(validator2.getSubGraphs().length).toBe(1);
		expect(validator3.getSubGraphs().length).toBe(0);
	});
});
