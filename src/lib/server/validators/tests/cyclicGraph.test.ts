import { describe, expect, test } from 'vitest';
import { addConnection, dummyDomain, dummyGraph } from './utils';
import { GraphValidator } from '../graphValidator';

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
		expect(c1?.from.id).toBe((c1!.to.id - 1) % 4);

		const c2 = validator2.hasCycle();
		expect(c2?.from.id).toBe((c2!.to.id - 1) % 2);
	});

	test('graph1 has one root', () => {
		expect(validator1.roots.length).toBe(1); // There is only one root
	});

	test('graph2 has one root', () => {
		expect(validator1.roots.length).toBe(1); // There is only one root
	});
});
