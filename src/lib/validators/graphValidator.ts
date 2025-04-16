/* Glossary

Directed acyclic graph (DAG):		A directed graph with no cycles
Strongly connected component (SCC): A maximal set of nodes where each node can reach every other node
Depth first search (DFS):			An algorithm that explores as far as possible along each branch before backtracking
Reachability matrix:				A matrix where intersection [i][j] is true if node i can reach node j
Inheritance map: 					A map linking nodes in the subject graph to nodes in the domain graph
Simple cycle: 						A unique cycle that starts and ends at the same node, and does not contain repeating nodes or edges
Conflicting edge: 					An edge in the subject graph that conflicts with an edge in the domain graph
		
*/

/* Algorithm breakdown

So we want to achieve two things:
  1) Find every simple cycle in both domains and subjects
  2) Find all edges in subjects that conflict with edges in domains

Abstraction
  As most algorithms we use have to be applied to both domains and subjects, and as their schemas are not
  compatible, we first parse the input into an abstract representation that can be used by both algorithms.

Simple cycles
  To detect simple cycles, we use Johnson's algorithm. This algorithm uses Tarjan's algorithm to find strongly
  connected components, and then searches for cycles within each SCC. As each node in an SCC can reach each other node,
  any cycle must be entirely contained within the SCC (A cycle leaving the SCC would by definition not be able to return). 
  By extension, if our graph only contains trivial SCCs of size 1, it is acyclic. Johnson's algorithm is O((V + E)(C + 1)), 
  where C is the number of cycles in the graph. This is worse than the original implementation of O(V + E), 
  but it finds the entire cycle, not just its backedge. This is useful to better communicate the issue to the user.

Conflicting edges
  To detect conflicting edges, we use the reachability matrix of the domain graph. We first precompute the reachability
  matrix of the domain graph using a DFS from each node, which is O(V * (V + E)). Floyd-Warshall is better for dense graphs (O(V^3)).
  We then iterate over all edges in the subject graph, and check if the source can reach the target in the domain graph.

  There is an optimization available. We could reuse the SCCs calculated during Johnson's algorithm to build a smaller
  directed acyclic graph. As all nodes within an SCC can reach each other, we only need to consider the edges between
  SCCs when calculating reachability. However, I remind you that this would ONLY be an optimization if the graph contains cycles. 
  If the graph is acyclic, all SCCs contain only one node, and the optimization is useless. Because our graphs are relatively small,
  and should not contain many cycles, I have chosen not to implement this optimization.

*/

import type { PrismaGraphPayload, Issues, Issue } from './types';

// Abstract graph representation
type AbstractGraph = Map<number, AbstractNode>;
type AbstractNode = {
	id: number;
	neighbors: AbstractNode[];
};

// Data structures for graph algorithms
type ReachabilityMatrix = Map<AbstractNode, Map<AbstractNode, boolean>>;
type InheritanceMap = Map<AbstractNode, AbstractNode>;
type SCC = Set<AbstractNode>;

// Graph validator class
export class GraphValidator {
	graph: PrismaGraphPayload; // Raw graph data
	domains: AbstractGraph; // Abstract representation of the domain graph
	subjects: AbstractGraph; // Abstract representation of the subject graph
	inheritanceMap: InheritanceMap; // Map linking subjects to domains

	constructor(graph: PrismaGraphPayload) {
		this.graph = graph;
		this.domains = new Map();
		this.subjects = new Map();
		this.inheritanceMap = new Map();

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

		// Construct inheritance map
		for (const subject of graph.subjects) {
			if (!subject.domainId) continue;
			const domainNode = this.domains.get(subject.domainId);
			const subjectNode = this.subjects.get(subject.id);

			if (domainNode && subjectNode) {
				this.inheritanceMap.set(subjectNode, domainNode);
			}
		}
	}

	/**
	 * Validates the graph and returns a list of issues. Issues are indexable by domain/subject id.
	 * @returns A list of issues
	 */

	validate(): Issues {
		return {
			...this.findNodeIssues(),
			...this.findRelationIssues()
		} as Issues;
	}

	validateDomainEdgeChange(
		oldSource: number,
		oldTarget: number,
		newSource: number,
		newTarget: number
	): Partial<Issues> {
		const oldSourceNode = this.domains.get(oldSource);
		const oldTargetNode = this.domains.get(oldTarget);
		const newSourceNode = this.domains.get(newSource);
		const newTargetNode = this.domains.get(newTarget);

		if (!oldSourceNode || !oldTargetNode || !newSourceNode || !newTargetNode) {
			return {}; // Maybe should raise error?
		}

		// Enact change
		oldSourceNode.neighbors.filter((node) => node.id !== oldTarget);
		newSourceNode.neighbors.push(newTargetNode);

		// Check for issues
		const issues = this.findRelationIssues();

		// Undo change
		oldSourceNode.neighbors.push(oldTargetNode);
		newSourceNode.neighbors.filter((node) => node.id !== newTarget);

		return issues;
	}

	private findNodeIssues(): Partial<Issues> {
		const domainIssues: { [key: number]: Issue[] } = {};
		const subjectIssues: { [key: number]: Issue[] } = {};

		/* Domain issues
			Domain without name			(Error)
			Domain without style		(Error)
			Domain with duplicate name	(Warning)
			Domain with duplicate style	(Warning)
			Domain without subjects		(Warning)

			Domain with invalid name/style should be caught by zod
		*/

		for (const domain of this.graph.domains) {
			const issues: Issue[] = [];

			const name = domain.name.trim();
			if (!domain.name)
				issues.push({
					title: 'Domain without name',
					message: 'Domains must have a name',
					severity: 'error'
				});

			if (!domain.style)
				issues.push({
					title: 'Domain without style',
					message: 'Domains must have a style',
					severity: 'error'
				});

			if (this.graph.domains.find((other) => other.name === name && other.id !== domain.id))
				issues.push({
					title: 'Domain with duplicate name',
					message: 'Domains must have unique names',
					severity: 'warning'
				});

			if (
				this.graph.domains.find((other) => other.style === domain.style && other.id !== domain.id)
			)
				issues.push({
					title: 'Domain with duplicate style',
					message: 'Domains must have unique styles',
					severity: 'warning'
				});

			if (!this.graph.subjects.find((subject) => subject.domainId === domain.id))
				issues.push({
					title: 'Domain without subjects',
					message: 'Domains must have at least one subject',
					severity: 'warning'
				});

			domainIssues[domain.id] = issues;
		}

		/* Subject issues
			Subject without name			(Error)
			Subject without domain			(Error)
			Subject with duplicate name		(Warning)

			Subject with invalid name should be caught by zod
		*/

		for (const subject of this.graph.subjects) {
			const issues: Issue[] = [];

			if (!subject.name)
				issues.push({
					title: 'Subject without name',
					message: 'Subjects must have a name',
					severity: 'error'
				});

			if (!subject.domainId)
				issues.push({
					title: 'Subject without domain',
					message: 'Subjects must have a domain',
					severity: 'error'
				});

			if (
				this.graph.subjects.find((other) => other.name === subject.name && other.id !== subject.id)
			)
				issues.push({
					title: 'Subject with duplicate name',
					message: 'Subjects must have unique names',
					severity: 'warning'
				});

			subjectIssues[subject.id] = issues;
		}

		return { domainIssues, subjectIssues };
	}

	private findRelationIssues(): Partial<Issues> {
		const domainRelationIssues: { [key: number]: { [key: number]: Issue[] } } = {};
		const subjectRelationIssues: { [key: number]: { [key: number]: Issue[] } } = {};

		/* Domain relation issues
			Cyclic domain relation		(Error)
		*/

		const domainCycles = this.findCycles(this.domains);
		for (const cycle of domainCycles) {
			const temp = [];
			for (const edge of cycle) {
				const source = this.graph.domains.find((domain) => domain.id === edge.source);
				const target = this.graph.domains.find((domain) => domain.id === edge.target);
				temp.push(`${source?.name} -> ${target?.name}`);
			}

			const message = temp.join(' -> ');

			for (const edge of cycle) {
				const issues = domainRelationIssues[edge.source][edge.target] || [];
				issues.push({
					title: 'Cyclic domain relation',
					message: message,
					severity: 'error'
				});

				domainRelationIssues[edge.source][edge.target] = issues;
			}
		}

		/* Subject relation issues
			Cyclic subject relation			(Error)
			Conflicting subject relation	(Warning)
		*/

		const subjectCycles = this.findCycles(this.subjects);
		for (const cycle of subjectCycles) {
			const temp = [];
			for (const edge of cycle) {
				const source = this.graph.subjects.find((subject) => subject.id === edge.source);
				const target = this.graph.subjects.find((subject) => subject.id === edge.target);
				temp.push(`${source?.name} -> ${target?.name}`);
			}

			const message = temp.join(' -> ');

			for (const edge of cycle) {
				const issues = subjectRelationIssues[edge.source][edge.target] || [];
				issues.push({
					title: 'Cyclic subject relation',
					message: message,
					severity: 'error'
				});

				subjectRelationIssues[edge.source][edge.target] = issues;
			}
		}

		const conflictingEdges = this.findConflictingEdges(
			this.domains,
			this.subjects,
			this.inheritanceMap
		);
		for (const edge of conflictingEdges) {
			const source = this.graph.subjects.find((subject) => subject.id === edge.source);
			const target = this.graph.subjects.find((subject) => subject.id === edge.target);

			const issues = subjectRelationIssues[edge.source][edge.target] || [];
			issues.push({
				title: 'Conflicting subject relation',
				message: `${source?.name} -> ${target?.name} is not represented in the domain graph`,
				severity: 'warning'
			});

			subjectRelationIssues[edge.source][edge.target] = issues;
		}

		return { domainRelationIssues, subjectRelationIssues };
	}

	/**
	 * Finds all strongly connected components in a graph, ignoring trivial sscs of size 1.
	 * @param graph The graph to search
	 * @returns An array of sscs
	 */

	private findSCCs(graph: AbstractGraph): SCC[] {
		// Tarjan's algorithm - O(V + E)
		// https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm

		const sccs: SCC[] = [];

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
				const scc: SCC = new Set();
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
		};

		for (const node of graph.values()) {
			if (!indices.has(node)) {
				strongConnect(node);
			}
		}

		return sccs;
	}

	/**
	 * Finds the node with the smallest id in an array of SCCs.
	 * @param sccs The array of SCCs to search
	 * @returns The smallest node and its SCC
	 */

	private findSmallestIndex(sccs: SCC[]): [SCC | null, AbstractNode | null] {
		let smallestIndex = Infinity;
		let smallestNode = null;
		let smallestSCC = null;

		for (const scc of sccs) {
			for (const node of scc) {
				if (node.id < smallestIndex) {
					smallestIndex = node.id;
					smallestNode = node;
					smallestSCC = scc;
				}
			}
		}

		return [smallestSCC, smallestNode];
	}

	/**
	 * Creates a new graph from a strongly connected component, only including edges within the SCC.
	 * @param scc The strongly connected component to convert
	 * @returns A new abstract graph
	 */

	private buildGraphFromSCC(scc: SCC): AbstractGraph {
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

	findCycles(graph: AbstractGraph): { source: number; target: number }[][] {
		// Johnson's algorithm - O((V + E)(C + 1))
		// https://en.wikipedia.org/wiki/Johnson%27s_algorithm

		const cycles: { source: number; target: number }[][] = [];
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
		};

		// Recursive function to find cycles in an SCC
		const johnson = (node: AbstractNode): boolean => {
			let foundCycle = false;
			blockedSet.add(node);
			stack.push(node);

			for (const target of node.neighbors) {
				if (target == stack[0]) {
					// If the target is the start node, the stack contains a cycle
					const cycle: { source: number; target: number }[] = [];
					for (let i = 0; i < stack.length - 1; i++)
						cycle.push({ source: stack[i].id, target: stack[i + 1].id });
					cycle.push({ source: stack[stack.length - 1].id, target: stack[0].id });
					cycles.push(cycle);
					foundCycle = true;
				} else if (!blockedSet.has(target)) {
					// If the target is not blocked, explore it
					const gotCycle = johnson(target);
					foundCycle = foundCycle || gotCycle;
				}
			}

			if (foundCycle) {
				// If a cycle was found containing this node, recursively unblock it and its dependencies
				unblock(node);
			} else {
				// If no cycle was found, dont unblock it, but add it to the blockedMap of all its targets
				for (const target of node.neighbors) {
					const blocked = blockedMap.get(target) || new Set();
					blocked.add(node);
					blockedMap.set(target, blocked);
				}
			}

			stack.pop();
			return foundCycle;
		};

		let subgraph = graph;
		while (subgraph.size > 0) {
			// Find the strongly connected component containing the smallest node
			const sccs = this.findSCCs(subgraph);
			const [smallestSCC, smallestNode] = this.findSmallestIndex(sccs);
			if (!smallestSCC || !smallestNode) break; // No more SCCs

			// Convert the SCC to a graph
			const sccGraph = this.buildGraphFromSCC(smallestSCC);
			const startNode = sccGraph.get(smallestNode.id)!;
			blockedMap.clear();
			blockedSet.clear();
			johnson(startNode);

			// Remove the smallest node and its edges from the graph
			subgraph = this.buildGraphWithoutNode(subgraph, smallestNode);
		}

		return cycles;
	}

	/**
	 * Computes the reachability matrix of a graph. This is **expensive** and should be used sparingly.
	 * @param graph The graph to analyze
	 * @returns A reachability matrix, where intersection [i][j] is true if node i can reach node j
	 */

	private computeReachabilityMatrix(graph: AbstractGraph): ReachabilityMatrix {

		// Initialize reachability matrix
		const reachabilityMatrix = new Map<AbstractNode, Map<AbstractNode, boolean>>();
		for (const node of graph.values()) {
			const row = new Map<AbstractNode, boolean>();
			for (const other of graph.values()) {
				row.set(other, other === node);
			}

			reachabilityMatrix.set(node, row);
		}

		// Trivial edges
		for (const node of graph.values()) {
			const row = reachabilityMatrix.get(node)!;
			for (const neighbor of node.neighbors) {
				row.set(neighbor, true);
			}
		}

		// DFS from each node
		for (const node of graph.values()) {
			const visited = new Set<AbstractNode>();
			const stack: AbstractNode[] = [node];

			while (stack.length > 0) {
				const current = stack.pop()!;
				if (visited.has(current)) continue;
				visited.add(current);

				const row = reachabilityMatrix.get(node)!;
				row.set(current, true);

				for (const neighbor of current.neighbors) {
					if (!visited.has(neighbor)) {
						stack.push(neighbor);
					}
				}
			}
		}

		return reachabilityMatrix;
	}

	/**
	 * Finds all edges in graphB that conflict with edges in graphA.
	 * @param graphA The first graph
	 * @param graphB The second graph
	 * @param inheritance The inheritance map linking nodes in graphB to nodes in graphA
	 * @returns An array of conflicting edges
	 */

	findConflictingEdges(
		graphA: AbstractGraph,
		graphB: AbstractGraph,
		inheritance: InheritanceMap
	): { source: number; target: number }[] {
		const reachabilityMatrix = this.computeReachabilityMatrix(graphA);
		const conflictingEdges: { source: number; target: number }[] = [];

		for (const sourceB of graphB.values()) {
			const sourceA = inheritance.get(sourceB);
			if (!sourceA) continue;

			for (const targetB of sourceB.neighbors) {
				const targetA = inheritance.get(targetB);
				if (!targetA) continue;

				const reachable = reachabilityMatrix.get(sourceA)!.get(targetA)!;
				if (reachable) continue;
				conflictingEdges.push({ source: sourceB.id, target: targetB.id });
			}
		}

		return conflictingEdges;
	}
}
