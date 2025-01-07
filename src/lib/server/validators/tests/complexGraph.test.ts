import { describe } from 'node:test';
import { expect, test } from 'vitest';
import { addConnection, dummyDomain, dummyGraph } from './utils';
import { GraphValidator } from '../graphValidator';

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
		expect(cycle?.from.id).toBe(e.id);
		expect(cycle?.to.id).toBe(b.id);
	});

	test('domain "A" is the only root', () => {
		expect(validator1.roots.length).toBe(1); // There is only one root
		expect(validator1.roots).toContain(validator1.getDomain(0)); // The root is domain 'a'
	});
});
