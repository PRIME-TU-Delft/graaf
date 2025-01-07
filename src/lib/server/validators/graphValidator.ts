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

	getDomain(id: number): DomainType | undefined {
		return this.#domains.get(id);
	}

	isCyclicUtil(v: number, visited: Set<number>, recStack: Set<number>): boolean {
		if (!visited.has(v)) {
			visited.add(v);
			recStack.add(v);

			for (const neighbour of this.#domains.get(v)!.outgoingDomains) {
				if (!visited.has(neighbour.id) && this.isCyclicUtil(neighbour.id, visited, recStack)) {
					return true;
				} else if (recStack.has(neighbour.id)) {
					return true;
				}
			}
		}

		recStack.delete(v);
		return false;
	}

	hasCycle(): boolean {
		const visited = new Set<number>();
		const recStack = new Set<number>();

		for (const root of this.roots) {
			if (this.isCyclicUtil(root.id, visited, recStack)) {
				return true;
			}
		}

		return false;
	}
}
