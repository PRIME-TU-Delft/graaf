
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
		const domainCycles = this.findCycles(this.domains)
			.map(cycle => Array.from(cycle)
				.map(
					edge => ({ source: edge.source.id, target: edge.target.id })
				)
			);
		
		const subjectCycles = this.findCycles(this.subjects)
			.map(cycle => Array.from(cycle)
				.map(
					edge => ({ source: edge.source.id, target: edge.target.id })
				)
			);

		const conflictingEdges: { source: number, target: number }[] = [];

		return {
			domainCycles,
			subjectCycles,
			conflictingEdges
		}
	}

	/**
	 * Finds all strongly connected components in a graph, ignoring trivial sscs of size 1.
	 * @param graph The graph to search
	 * @returns An array of sscs - not deeply cloned
	 */
	
	private findSCCs(graph: AbstractGraph): Set<AbstractNode>[] {

		// Tarjan's algorithm - O(V + E)
		// https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
		
		const sccs: Set<AbstractNode>[] = [];

		let index = 0;
		const indices = new Map<AbstractNode, number>();
		const lowlinks = new Map<AbstractNode, number>();

		const stack: AbstractNode[] = [];
		const onStack = new Set<AbstractNode>();
		
		const strongConnect = (node: AbstractNode) => {
			indices.set(node, index);
			lowlinks.set(node, index);
			index++;

			stack.push(node);
			onStack.add(node);

			for (const other of node.targets) {
				if (!indices.has(other)) {
					strongConnect(other);
					lowlinks.set(node, Math.min(lowlinks.get(node)!, lowlinks.get(other)!));
				} else if (onStack.has(other)) {
					lowlinks.set(node, Math.min(lowlinks.get(node)!, indices.get(other)!));
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
	 * Creates a new graph from a strongly connected component. 
	 * Only edges within the SCC are included.
	 * @param scc Strongly Connected Component
	 * @returns A new abstract graph - deeply cloned
	 */

	private graphFromSCC(scc: Set<AbstractNode>): AbstractGraph {
		const graph = new Map();
		for (const node of scc) {
			graph.set(node.id, { id: node.id, sources: [], targets: [] });
		}

		for (const source of scc) {
			for (const target of source.targets) {
				if (scc.has(target)) {
					const sourceNode = graph.get(source.id)!;
					const targetNode = graph.get(target.id)!;
					sourceNode.targets.push(targetNode);
					targetNode.sources.push(sourceNode);
				}
			}
		}

		return graph;
	}

	/**
	 * Finds the node with the smallest id in a graph.
	 * @param graph The graph to search
	 * @returns The node with the smallest id, or null if the graph is empty
	 */

	private smallestIndexNode(graph: AbstractGraph): AbstractNode | null {
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
	 * Finds the strongly connected component with the provided node.
	 * @param sccs An array of strongly connected components
	 * @param node The node to search for
	 * @returns The strongly connected component containing the node, or null if not found
	 */

	private sccWithNode(sccs: Set<AbstractNode>[], node: AbstractNode): Set<AbstractNode> | null {
		for (const scc of sccs) {
			if (scc.has(node)) {
				return scc;
			}
		}

		return null;
	}

	/**
	 * Creates a new graph without the provided node or any edges to/from that node.
	 * @param graph The graph to modify
	 * @param node The node to remove
	 * @returns A new abstract graph - deeply cloned
	 */

	private graphWithoutNode(graph: AbstractGraph, node: AbstractNode): AbstractGraph {

		// Make a new graph without the smallest node, or its edges
		const newGraph = new Map(graph);
		for (const copy of newGraph.values()) {
			if (copy === node) {
				newGraph.delete(copy.id);
			} else {
				copy.sources = copy.sources.filter(n => n !== node);
				copy.targets = copy.targets.filter(n => n !== node);
			}
		}

		return newGraph;
	}

	/**
	 * Finds all cycles in a graph.
	 * @returns An array of cycles, each containing a set of edges that form the cycle
	 */

	private findCycles(graph: AbstractGraph): Set<AbstractEdge>[] {

		// Johnson's algorithm - O((V + E)(C + 1))
		// https://en.wikipedia.org/wiki/Johnson%27s_algorithm

		const cycles: Set<AbstractEdge>[] = [];
		const blockedMap = new Map<AbstractNode, Set<AbstractNode>>();
		const blockedSet = new Set<AbstractNode>();
		const stack: AbstractNode[] = [];

		// Recursive function to unblock a node and its dependencies
		const unblock = (node: AbstractNode) => {
			blockedSet.delete(node);
			
			const blocked = blockedMap.get(node) || new Set();
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

			for (const target of node.targets) {
				if (target == stack[0]) {

					// If the target is the start node, the stack contains a cycle
					const cycle = new Set<AbstractEdge>();
					for (let i = 0; i < stack.length - 1; i++)
						cycle.add({ source: stack[i], target: stack[i + 1] });
					cycle.add({ source: stack[stack.length - 1], target: stack[0] });
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
				for (const target of node.targets) {
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
			const smallestNode = this.smallestIndexNode(subgraph);
			if (!smallestNode) break; // No more nodes

			// Find the strongly connected component containing the smallest node
			const sccs = this.findSCCs(subgraph);
			const smallestSCC = this.sccWithNode(sccs, smallestNode);
			if (!smallestSCC) break; // No more SCCs

			// Convert the SCC to a graph
			const sccGraph = this.graphFromSCC(smallestSCC);
			const startNode = this.smallestIndexNode(sccGraph); // NOT the same as smallestNode, as sccGraph deeply copies nodes
			if (!startNode) break; // Should never happen

			// Find cycles in the SCC
			blockedMap.clear();
			blockedSet.clear();
			johnson(startNode);

			// Remove the smallest node and its edges from the graph
			subgraph = this.graphWithoutNode(subgraph, smallestNode);
		}

		return cycles;
	}
}