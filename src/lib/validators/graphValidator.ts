import type { Graph, Domain, Subject } from '@prisma/client';

export type DomainType = Domain & { sourceDomains: Domain[]; targetDomains: Domain[] };
export type SubjectType = Subject & { sourceSubjects: Subject[]; targetSubjects: Subject[] };
export type GraphType = Graph & { domains: DomainType[]; subjects: SubjectType[] };

export class GraphValidator {
	domains: Map<number, DomainType> = new Map();
	roots: DomainType[] = [];
	subgraphs: Set<DomainType>[] = [];

	constructor(graph: GraphType) {
		if (graph.domains.length === 0) return; // Guard to prevent empty graphs

		for (const domain of graph.domains) this.domains.set(domain.id, domain);

		this.findSubGraphs();
	}

	hasEdge(source: DomainType, target: DomainType): boolean {
		return (
			source.targetDomains.some((domain) => domain.id === target.id) &&
			target.sourceDomains.some((domain) => domain.id === source.id)
		);
	}

	removeEdge(source: DomainType, target: DomainType) {
		const sourceLength = source.targetDomains.length;
		const targetLength = target.sourceDomains.length;
		source.targetDomains = source.targetDomains.filter((domain) => domain.id !== target.id);
		target.sourceDomains = target.sourceDomains.filter((domain) => domain.id !== source.id);

		if (
			source.targetDomains.length !== sourceLength - 1 ||
			target.sourceDomains.length !== targetLength - 1
		) {
			throw new Error('The edge was not removed');
		}
	}

	addEdge(source: DomainType, target: DomainType) {
		if (this.hasEdge(source, target)) {
			throw new Error('The edge already exists');
		}

		source.targetDomains.push(target);
		target.sourceDomains.push(source);
	}

	findSubGraphs() {
		// Reset roots and subgraphs
		this.roots = [];
		this.subgraphs = [];

		// Find all subgraphs
		const subgraphs: Set<DomainType>[] = [];
		const visited = new Set<number>();

		for (const domain of this.domains.values()) {
			if (visited.has(domain.id)) continue;

			const subgraph: Set<DomainType> = new Set();

			this.dfs(domain.id, visited, subgraph);
			subgraphs.push(subgraph);
		}

		this.subgraphs = subgraphs;

		// Find roots
		for (const subgraphSet of subgraphs) {
			const subgraph = Array.from(subgraphSet);

			if (subgraph.length === 0) continue; // I see no reason why this could happen, but just in case

			// A root is a domain that has no source domains
			const roots = subgraph.filter((domain) => domain.sourceDomains.length === 0);
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
		return this.domains.get(id);
	}

	getSubGraphs(): Set<DomainType>[] {
		return this.subgraphs;
	}

	private dfs(v: number, visited: Set<number>, subgraph: Set<DomainType>) {
		if (!visited.has(v)) {
			visited.add(v);

			for (const neighbour of this.domains.get(v)!.targetDomains) {
				this.dfs(neighbour.id, visited, subgraph);
			}

			subgraph.add(this.domains.get(v)!);
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
	): { source: Domain; target: Domain } | undefined {
		if (!visited.has(v)) {
			visited.add(v);
			recStack.add(v);

			for (const neighbour of this.domains.get(v)!.targetDomains) {
				if (!visited.has(neighbour.id)) {
					const cycle = this.isCyclicUtil(neighbour.id, visited, recStack);

					if (cycle != undefined) {
						return cycle;
					}
				} else if (recStack.has(neighbour.id)) {
					return { source: this.domains.get(v)!, target: neighbour };
				}
			}
		}

		recStack.delete(v);
		return undefined;
	}

	hasCycle(): { source: Domain; target: Domain } | undefined {
		const visited = new Set<number>();
		const recStack = new Set<number>();

		for (const root of this.roots) {
			if (root.targetDomains.length === 0) continue;

			const cycle = this.isCyclicUtil(root.id, visited, recStack);

			if (cycle != undefined) {
				return cycle;
			}
		}

		return undefined;
	}

	validateNewEdge(sourceId: number, targetId: number) {
		const from = this.getDomainById(sourceId);
		const to = this.getDomainById(targetId);

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

	validateEdgeChange(
		oldSourceId: number,
		oldTargetId: number,
		newSourceId: number,
		newTargetId: number
	) {
		const oldSource = this.getDomainById(oldSourceId);
		const oldTarget = this.getDomainById(oldTargetId);

		if (oldSource == undefined || oldTarget == undefined) {
			throw new Error('One of the domains does not exist');
		}

		// Remove the old edge
		this.removeEdge(oldSource, oldTarget);

		const hasCycle = this.validateNewEdge(newSourceId, newTargetId);

		this.addEdge(oldSource, oldTarget); // Revert the changes

		return hasCycle;
	}
}
