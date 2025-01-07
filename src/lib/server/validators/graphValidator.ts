import type { Graph, Domain } from '@prisma/client';

export type DomainType = Domain & { incommingDomains: Domain[]; outgoingDomains: Domain[] };
export type GraphType = Graph & { domains: DomainType[] };

export class GraphValidator {
	roots: DomainType[] = [];
	#domains: Map<number, DomainType> = new Map();

	constructor(g: GraphType) {
		if (g.domains.length === 0) return; // Guard to prevent empty graphs

		for (const domain of g.domains) {
			this.#domains.set(domain.id, domain);

			if (domain.incommingDomains.length === 0) {
				this.roots.push(this.#domains.get(domain.id)!);
			}
		}

		// If the graph has no roots, then it has a cycle. Make first domain the root
		if (this.roots.length === 0) {
			this.roots.push(this.#domains.get(g.domains[0].id)!);
		}
	}

	/**
	 * Get a domain by its id
	 * @param id - The domain id
	 * @returns The domain if it exists, otherwise undefined
	 */
	getDomain(id: number): DomainType | undefined {
		return this.#domains.get(id);
	}

	/**
	 * Check if the graph has a cycle
	 * @param v - The current domain
	 * @param visited - Set of visited domains
	 * @param recStack - Set of domains in the current recursion stack
	 * @returns The cycle-problem relationship if it exists, otherwise undefined
	 */
	private isCyclicUtil(
		v: number,
		visited: Set<number>,
		recStack: Set<number>
	): { from: Domain; to: Domain } | undefined {
		if (!visited.has(v)) {
			visited.add(v);
			recStack.add(v);

			for (const neighbour of this.#domains.get(v)!.outgoingDomains) {
				if (!visited.has(neighbour.id)) {
					const cycle = this.isCyclicUtil(neighbour.id, visited, recStack);

					if (cycle != undefined) {
						return cycle;
					}
				} else if (recStack.has(neighbour.id)) {
					return { from: this.#domains.get(v)!, to: neighbour };
				}
			}
		}

		recStack.delete(v);
		return undefined;
	}

	hasCycle(): { from: Domain; to: Domain } | undefined {
		const visited = new Set<number>();
		const recStack = new Set<number>();

		for (const root of this.roots) {
			const cycle = this.isCyclicUtil(root.id, visited, recStack);
			if (cycle != undefined) {
				return cycle;
			}
		}

		return undefined;
	}
}
