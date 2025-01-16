import type { Graph, Domain, Subject } from '@prisma/client';

export type DomainType = Domain & { incommingDomains: Domain[]; outgoingDomains: Domain[] };
export type SubjectType = Subject & { incommingSubjects: Subject[]; outgoingSubjects: Subject[] };
export type GraphType = Graph & { domains: DomainType[]; subjects: SubjectType[] };

export class GraphValidator {
	#domains: Map<number, DomainType> = new Map();
	roots: DomainType[] = []; // A root is a domain that has no incoming domains
	#subGraphs: Set<DomainType>[] = [];

	constructor(g: GraphType) {
		if (g.domains.length === 0) return; // Guard to prevent empty graphs

		for (const domain of g.domains) this.#domains.set(domain.id, domain);

		this.findSubGraphs();
	}

	hasEdge(from: DomainType, to: DomainType): boolean {
		return (
			from.outgoingDomains.some((domain) => domain.id === to.id) &&
			to.incommingDomains.some((domain) => domain.id === from.id)
		);
	}

	removeEdge(from: DomainType, to: DomainType) {
		const fromLength = from.outgoingDomains.length;
		const toLength = to.incommingDomains.length;
		from.outgoingDomains = from.outgoingDomains.filter((domain) => domain.id !== to.id);
		to.incommingDomains = to.incommingDomains.filter((domain) => domain.id !== from.id);

		if (
			from.outgoingDomains.length !== fromLength - 1 ||
			to.incommingDomains.length !== toLength - 1
		) {
			throw new Error('The edge was not removed');
		}
	}

	addEdge(from: DomainType, to: DomainType) {
		if (this.hasEdge(from, to)) {
			throw new Error('The edge already exists');
		}

		from.outgoingDomains.push(to);
		to.incommingDomains.push(from);
	}

	findSubGraphs() {
		// Reset roots and subgraphs
		this.roots = [];
		this.#subGraphs = [];

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
	getDomainById(id: number): DomainType | undefined {
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

	validateNewEdge(fromId: number, toId: number) {
		const from = this.getDomainById(fromId);
		const to = this.getDomainById(toId);

		if (from == undefined || to == undefined) {
			throw new Error('One of the domains does not exist');
		}

		// Add the new edge
		this.addEdge(from, to);

		// Check if graph is valid
		this.findSubGraphs();

		const hasCycle = this.hasCycle();

		this.removeEdge(from, to); // Revert the changes

		return hasCycle;
	}

	validateEdgeChange(oldInId: number, oldOutId: number, newInId: number, newOutId: number) {
		const oldIn = this.getDomainById(oldInId);
		const oldOut = this.getDomainById(oldOutId);

		if (oldIn == undefined || oldOut == undefined) {
			throw new Error('One of the domains does not exist');
		}

		// Remove the old edge
		this.removeEdge(oldIn, oldOut);

		const hasCycle = this.validateNewEdge(newInId, newOutId);

		this.addEdge(oldIn, oldOut); // Revert the changes

		return hasCycle;
	}
}
