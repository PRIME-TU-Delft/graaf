
import type {
	PrismaGraphPayload,
	AbstractGraph,
	AbstractNode,
	Issues
} from "./types";

export class GraphValidator {
	domains: AbstractGraph;
	subjects: AbstractGraph;

	constructor (graph: PrismaGraphPayload) {
		this.domains = new Map();
		this.subjects = new Map();

		// Construct domain graph
		for (const domain of graph.domains) {
			this.domains.set(domain.id, { id: domain.id, neighbors: [] });
		}

		for (const domain of graph.domains) {
			const sourceNode = this.domains.get(domain.id);
			for (const target of domain.targetDomains) {
				const targetNode = this.domains.get(target.id);

				if (sourceNode && targetNode) {
					sourceNode.neighbors.push(targetNode);
				}
			}
		}

		// Construct subject graph
		for (const subject of graph.subjects) {
			this.subjects.set(subject.id, { id: subject.id, neighbors: [] });
		}

		for (const subject of graph.subjects) {
			const sourceNode = this.subjects.get(subject.id);
			for (const target of subject.targetSubjects) {
				const targetNode = this.subjects.get(target.id);

				if (sourceNode && targetNode) {
					sourceNode.neighbors.push(targetNode);
				}
			}
		}
	}

	validate(): Issues {
		return {
			domainCycles: this.findCycles(this.domains),
			subjectCycles: this.findCycles(this.subjects),
			conflictingEdges: []
		}
	}

	
	/**
	 * Finds the node with the smallest id in a graph.
	 * @param graph The graph to search
	 * @returns The node with the smallest id, or null if the graph is empty
	 */

	private findSmallestIndexNode(graph: AbstractGraph): AbstractNode | null {
		let smallestIndex = Infinity;
		let smallestNode = null;

		for (const node of graph.values()) {
			if (node.id < smallestIndex) {
				smallestIndex = node.id;
				smallestNode = node;
			}
		}

		return smallestNode;
	}

	/**
	 * Finds all strongly connected components in a graph, ignoring trivial sscs of size 1.
	 * @param graph The graph to search
	 * @returns An array of sscs
	 */

	private findSCCs(graph: AbstractGraph): Set<AbstractNode>[] {

		// Tarjan's algorithm - O(V + E)
		// https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm

		const sccs: Set<AbstractNode>[] = [];

		const stack: AbstractNode[] = [];
		const onStack = new Set<AbstractNode>();
		const indices = new Map<AbstractNode, number>();
		const lowlinks = new Map<AbstractNode, number>();
		let index = 0;

		const strongConnect = (node: AbstractNode) => {
			stack.push(node);
			onStack.add(node);
			indices.set(node, index);
			lowlinks.set(node, index);
			index++;

			for (const neighbor of node.neighbors) {
				if (!indices.has(neighbor)) {
					strongConnect(neighbor);
					lowlinks.set(node, Math.min(lowlinks.get(node)!, lowlinks.get(neighbor)!));
				} else if (onStack.has(neighbor)) {
					lowlinks.set(node, Math.min(lowlinks.get(node)!, indices.get(neighbor)!));
				}
			}

			if (lowlinks.get(node) === indices.get(node)) {
				const scc = new Set<AbstractNode>();
				let other: AbstractNode;

				do {
					other = stack.pop()!;
					onStack.delete(other);
					scc.add(other);
				} while (other !== node);

				if (scc.size > 1) {
					sccs.push(scc);
				}
			}
		}

		for (const node of graph.values()) {
			if (!indices.has(node)) {
				strongConnect(node);
			}
		}

		return sccs;
	}

	/**
	 * Finds the strongly connected component with the provided node.
	 * @param sccs An array of strongly connected components
	 * @param node The node to search for
	 * @returns The strongly connected component containing the node, or null if not found
	 */

	private findSCCWithNode(sccs: Set<AbstractNode>[], node: AbstractNode): Set<AbstractNode> | null {
		for (const scc of sccs) {
			if (scc.has(node)) {
				return scc;
			}
		}

		return null;
	}

	/**
	 * Creates a new graph from a strongly connected component, only including edges within the SCC.
	 * @param scc The strongly connected component to convert
	 * @returns A new abstract graph
	 */

	private buildGraphFromSCC(scc: Set<AbstractNode>): AbstractGraph {
		const newGraph = new Map<number, AbstractNode>();
		for (const oldNode of scc) {
			newGraph.set(oldNode.id, { id: oldNode.id, neighbors: [] });
		}

		for (const oldNode of scc) {
			const newNode = newGraph.get(oldNode.id);
			for (const oldNeighbor of oldNode.neighbors) {
				const newNeighbor = newGraph.get(oldNeighbor.id);

				if (newNode && newNeighbor) {
					newNode.neighbors.push(newNeighbor);
				}
			}
		}

		return newGraph;
	}

	/**
	 * Builds a new graph without the provided node or any edges to/from that node.
	 * @param graph The graph to modify
	 * @param excludedNode The node to remove
	 * @returns A new abstract graph
	 */

	private buildGraphWithoutNode(graph: AbstractGraph, excludedNode: AbstractNode): AbstractGraph {
		const newGraph = new Map<number, AbstractNode>();
		for (const oldNode of graph.values()) {
			if (oldNode.id === excludedNode.id) continue;
			newGraph.set(oldNode.id, { id: oldNode.id, neighbors: [] });
		}

		for (const oldNode of graph.values()) {
			const newNode = newGraph.get(oldNode.id);
			for (const oldNeighbor of oldNode.neighbors) {
				const newNeighbor = newGraph.get(oldNeighbor.id);

				if (newNode && newNeighbor) {
					newNode.neighbors.push(newNeighbor);
				}
			}
		}

		return newGraph;
	}

	/**
	 * Finds all cycles in a graph.
	 * @returns An array of cycles, each containing a set of edges that form the cycle
	 */

	private findCycles(graph: AbstractGraph): { source: number, target: number }[][] {

		// Johnson's algorithm - O((V + E)(C + 1))
		// https://en.wikipedia.org/wiki/Johnson%27s_algorithm

		const cycles: { source: number, target: number }[][] = [];
		const blockedMap = new Map<AbstractNode, Set<AbstractNode>>();
		const blockedSet = new Set<AbstractNode>();
		const stack: AbstractNode[] = [];

		// Recursive function to unblock a node and its dependencies
		const unblock = (node: AbstractNode) => {
			blockedSet.delete(node);

			const blocked = blockedMap.get(node);
			if (!blocked) return;

			for (const target of blocked) {
				blocked.delete(target);
				if (blockedSet.has(target)) {
					unblock(target);
				}
			}

			blockedMap.delete(node);
		}

		// Recursive function to find cycles in an SCC
		const johnson = (node: AbstractNode): boolean => {
			let foundCycle = false;
			blockedSet.add(node);
			stack.push(node);

			for (const target of node.neighbors) {
				if (target == stack[0]) {

					// If the target is the start node, the stack contains a cycle
					const cycle: { source: number, target: number }[] = [];
					for (let i = 0; i < stack.length - 1; i++)
						cycle.push({ source: stack[i].id, target: stack[i + 1].id });
					cycle.push({ source: stack[stack.length - 1].id, target: stack[0].id });
					cycles.push(cycle);
					foundCycle = true;

				} else if (!blockedSet.has(target)) {

					// If the target is not blocked, explore it
					let gotCycle = johnson(target);
					foundCycle = foundCycle || gotCycle;

				}
			}

			if (foundCycle) {

				// If a cycle was found containing this node, recursively unblock it and its dependencies
				unblock(node);

			} else {

				// If no cycle was found, dont unblock it, but add it to the blockedMap of all its targets
				for (const target of node.neighbors) {
					let blocked = blockedMap.get(target) || new Set();
					blocked.add(node);
					blockedMap.set(target, blocked);
				}
			}

			stack.pop();
			return foundCycle;
		}

		let subgraph = graph;
		while (subgraph.size > 0) {

			// Find the smallest node in the graph
			const smallestNode = this.findSmallestIndexNode(subgraph);
			if (!smallestNode) break; // No more nodes

			// Find the strongly connected component containing the smallest node
			const sccs = this.findSCCs(subgraph);
			const smallestSCC = this.findSCCWithNode(sccs, smallestNode);
			if (!smallestSCC) break; // No more SCCs

			// Convert the SCC to a graph
			const sccGraph = this.buildGraphFromSCC(smallestSCC);
			const startNode = this.findSmallestIndexNode(sccGraph); // NOT the same as smallestNode, as sccGraph deeply copies nodes
			if (!startNode) break; // Should never happen

			// Find cycles in the SCC
			blockedMap.clear();
			blockedSet.clear();
			johnson(startNode);

			// Remove the smallest node and its edges from the graph
			subgraph = this.buildGraphWithoutNode(subgraph, smallestNode);
		}

		return cycles;
	}
}