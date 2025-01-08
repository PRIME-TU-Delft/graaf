import type { Graph, Domain } from '@prisma/client';

export type DomainType = Domain & { incommingDomains: Domain[]; outgoingDomains: Domain[] };
export type GraphType = Graph & { domains: DomainType[] };

export class GraphValidator {
	roots: DomainType[] = []; // A root is a domain that has no incoming domains
	#domains: Map<number, DomainType> = new Map();
	#subGraphs: Set<DomainType>[] = [];

	constructor(g: GraphType) {
		if (g.domains.length === 0) return; // Guard to prevent empty graphs

		for (const domain of g.domains) this.#domains.set(domain.id, domain);

		// Find all subgraphs
		const subgraphs: Set<DomainType>[] = [];
		const visited = new Set<number>();

		for (const domain of this.#domains.values()) {
			if (visited.has(domain.id)) continue;

			const subgraph: Set<DomainType> = new Set();

			this.dfs(domain.id, visited, subgraph);
			subgraphs.push(subgraph);
		}

		this.#subGraphs = subgraphs;

		// Find roots
		for (const subgraphSet of subgraphs) {
			const subgraph = Array.from(subgraphSet);

			if (subgraph.length === 0) continue; // I see no reason why this could happen, but just in case

			// A root is a domain that has no incoming domains
			const roots = subgraph.filter((domain) => domain.incommingDomains.length === 0);
			this.roots.push(...roots);

			// If there is no trivial root, then the subgraph is a cycle
			// the roots will be the first domain in the cycle
			if (roots.length === 0) {
				this.roots.push(subgraph[0]);
			}
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

	getSubGraphs(): Set<DomainType>[] {
		return this.#subGraphs;
	}

	private dfs(v: number, visited: Set<number>, subgraph: Set<DomainType>) {
		if (!visited.has(v)) {
			visited.add(v);

			for (const neighbour of this.#domains.get(v)!.outgoingDomains) {
				this.dfs(neighbour.id, visited, subgraph);
			}

			subgraph.add(this.#domains.get(v)!);
		}
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
			if (root.outgoingDomains.length === 0) continue;

			const cycle = this.isCyclicUtil(root.id, visited, recStack);

			if (cycle != undefined) {
				return cycle;
			}
		}

		return undefined;
	}
}
