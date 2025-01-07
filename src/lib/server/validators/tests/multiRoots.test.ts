import { describe } from 'node:test';
import { expect, test } from 'vitest';
import { addConnection, dummyDomain, dummyGraph } from './utils';
import { GraphValidator } from '../graphValidator';

describe('Trivial graph', () => {
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
