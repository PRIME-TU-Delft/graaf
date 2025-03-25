
import type { 
	PrismaGraphPayload,
	AbstractGraph,
	AbstractEdge,
	AbstractNode,
	Issues
} from "./types";

export class GraphValidator {
	domains: AbstractGraph;
	subjects: AbstractGraph;
	domainToSubject: Map<AbstractNode, AbstractNode>;

	constructor (graph: PrismaGraphPayload) {
		this.domains = new Map();
		this.subjects = new Map();
		this.domainToSubject = new Map();

		// Construct domain graph
		for (const domain of graph.domains) {
			const node: AbstractNode = { id: domain.id, sources: [], targets: [] };
			this.domains.set(domain.id, node);

			for (const source of domain.sourceDomains) {
				const sourceNode = this.domains.get(source.id);
				if (sourceNode) {
					sourceNode.targets.push(node);
					node.sources.push(sourceNode);
				}
			}

			for (const target of domain.targetDomains) {
				const targetNode = this.domains.get(target.id);
				if (targetNode) {
					targetNode.sources.push(node);
					node.targets.push(targetNode);
				}
			}
		}

		// Construct subject graph
		for (const subject of graph.subjects) {
			const node: AbstractNode = { id: subject.id, sources: [], targets: [] };
			this.subjects.set(subject.id, node);

			for (const source of subject.sourceSubjects) {
				const sourceNode = this.subjects.get(source.id);
				if (sourceNode) {
					sourceNode.targets.push(node);
					node.sources.push(sourceNode);
				}
			}

			for (const target of subject.targetSubjects) {
				const targetNode = this.subjects.get(target.id);
				if (targetNode) {
					targetNode.sources.push(node);
					node.targets.push(targetNode);
				}
			}

			// Map domain to subject
			if (subject.domainId) {
				const domain = this.domains.get(subject.domainId)!;
				this.domainToSubject.set(domain, node);
			}
		}
	}

	validate(): Issues {

		// Compute domain properties
		const domainSubgraphs = this.findSubgraphs(this.domains);
		const domainRoots = this.findRoots(domainSubgraphs);
		const domainReachability = this.computeReachability(domainSubgraphs);
				
		// Compute subject properties
		const subjectSubgraphs = this.findSubgraphs(this.subjects);
		const subjectRoots = this.findRoots(subjectSubgraphs);

		console.log(
			'domainSubgraphs', domainSubgraphs.map(subgraph => Array.from(subgraph).map(node => node.id)),
			'\nsubjectSubgraphs', subjectSubgraphs.map(subgraph => Array.from(subgraph).map(node => node.id)),
			'\ndomainRoots', domainRoots.map(node => node.id),
			'\nsubjectRoots', subjectRoots.map(node => node.id),
		)

		// Compute issues
		const domainBackEdges = this.findBackEdges(domainRoots);
		const subjectBackEdges = this.findBackEdges(subjectRoots);
		const conflictingEdges = this.findConflicts(this.subjects, this.domainToSubject, domainReachability);

		return {
			domainBackEdges: domainBackEdges.map(edge => ({ source: edge.source.id, target: edge.target.id })),
			subjectBackEdges: subjectBackEdges.map(edge => ({ source: edge.source.id, target: edge.target.id })),
			conflictingEdges: conflictingEdges.map(edge => ({ source: edge.source.id, target: edge.target.id }))
		}
	}

	/**
	 * Finds subgraphs in the graph using DFS @ O(V + E)
	 * @param graph The graph to find subgraphs in.
	 * @returns The subgraphs in the graph.
	 */

	private findSubgraphs(graph: AbstractGraph): Set<AbstractNode>[] {
		const subgraphs: Set<AbstractNode>[] = [];
		const visited = new Set<AbstractNode>();

		for (const node of graph.values()) {
			if (visited.has(node)) continue; // Only build subgraphs from unvisited nodes

			const subgraph: Set<AbstractNode> = new Set();
			const stack: AbstractNode[] = [node];

	   		while (stack.length > 0) {
				const node = stack.pop()!;

				if (visited.has(node)) continue;
				subgraph.add(node);
				visited.add(node);

				for (const target of node.targets) {
					stack.push(target);
				}
			}

			subgraphs.push(subgraph);
		}

		return subgraphs;
	}

	/**
	 * Finds root nodes in each subgraph @ O(V)
	 * @param subgraphs The subgraphs to find roots in.
	 * @returns The root nodes in each subgraph.
	 */

	private findRoots(subgraphs: Set<AbstractNode>[]): AbstractNode[] {
		const arrays = subgraphs.map(set => Array.from(set));
		const roots: AbstractNode[] = [];

		// Find domain roots
		for (const subgraph of arrays) {
			if (subgraph.length === 0) continue;

			// A root is a node that has no incoming edges
			const filtered = subgraph.filter(node => node.sources.length === 0);
			roots.push(...filtered);

			// If there is no trivial root, then the subgraph is a cycle
			// the roots will be the first domain in the cycle
			if (filtered.length === 0) {
				roots.push(subgraph[0]);
			}
		}

		return roots;
	}

	/**
	 * Finds back edges in the graph using DFS @ O(V + E)
	 * @param roots The roots of the graph
	 * @returns The back edges in the graph.
	 */

	private findBackEdges(roots: AbstractNode[]): AbstractEdge[] {

		// Recursive cycle detection
		const findCycle = (node: AbstractNode, visited: Set<AbstractNode>, path: Set<AbstractNode>): AbstractEdge | null => {
			if (!visited.has(node)) {
				visited.add(node);
				path.add(node);
	
				for (const target of node.targets) {
					if (!visited.has(target)) {
						const cycle = findCycle(target, visited, path);

						if (cycle != null) {
							return cycle;
						}

					} else if (path.has(target)) {
						return { source: node, target: target };
					}
				}
			}
	
			path.delete(node);
			return null;
		}

		// Find cycles
		const visited = new Set<AbstractNode>();
		const path = new Set<AbstractNode>();
		const cycles: AbstractEdge[] = [];

		for (const root of roots) {
			if (root.targets.length === 0) continue;

			const cycle = findCycle(root, visited, path);
			if (cycle != null) {
				cycles.push(cycle);
			}
		}

		return cycles;
	}

	/**
	 * Precomputes reachability for all nodes in a graph using BFS @ O(V * (V + E))
	 * @param subgraphs Precomputed subgraphs for the graph.
	 * @returns The reachability for all nodes in the graph.
	 */

	private computeReachability(subgraphs: Set<AbstractNode>[]): Map<AbstractNode, Set<AbstractNode>> {
		const reachability = new Map<AbstractNode, Set<AbstractNode>>();

  		for (const subgraph of subgraphs) {
			for (const node of subgraph) {
				const reachable = new Set<AbstractNode>();
				const queue: AbstractNode[] = [node];
				reachable.add(node);
	
				while (queue.length > 0) {
					const node = queue.shift()!;
					for (const target of node.targets) {
						if (!reachable.has(target) && subgraph.has(target)) {
							reachable.add(target);
							queue.push(target);
						}
					}
				}

				reachability.set(node, reachable);
			}
		}

		return reachability;
	}

	/**
	 * Finds conflicting edges in Graph B that do not align with Graph A's inheritance rules @ O(E)
	 * @param graph Graph B, to find conflicts in.
	 * @param mapping The mapping between nodes from Graph B to Graph A.
	 * @param reachability Precomputed reachability for Graph A.
	 * @returns The conflicting edges in Graph B.
 	 */

	private findConflicts(
		graph: AbstractGraph, 
		mapping: Map<AbstractNode, AbstractNode>,
		reachability: Map<AbstractNode, Set<AbstractNode>>
	): AbstractEdge[] {
		const conflicts: AbstractEdge[] = [];

   		for (const sourceB of graph.values()) {
			for (const targetB of sourceB.targets) {
				const sourceA = mapping.get(sourceB);
				const targetA = mapping.get(targetB);
		   		if (!sourceA || !targetA) continue;

				// Using precomputed reachability for O(1) check
				const reachableFromSource = reachability.get(sourceA);
				if (!reachableFromSource || !reachableFromSource.has(targetA)) {
					conflicts.push({ source: sourceB, target: targetB });
				}
			}
		}

		return conflicts;
	}
}