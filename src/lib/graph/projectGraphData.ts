import { NodeType } from '$lib/d3/types';
import { edgeEnds } from './model';

import type { EdgeData, GraphData, LectureData, NodeData } from '$lib/d3/types';
import type { GraphModel } from './model';

/**
 * Project the store's model into the flat, simulation-ready GraphData the D3 canvas renders:
 * domain and subject nodes get a `uuid` (prefixed so domain and subject ids cannot collide), the
 * model's id-pair relations become edge objects, and each lecture gets its subjects partitioned
 * into past/present/future by walking the subject edge graph one hop outward from that lecture's
 * own subjects.
 *
 * INVARIANT: this is the only place object references between nodes are created. Within the
 * returned GraphData, every `edge.source` / `edge.target`, every `node.parent`, and every entry of
 * `lecture.past_nodes` / `present_nodes` / `future_nodes` / `nodes` / `domains` is reference-equal
 * to the matching entry of `domain_nodes` / `subject_nodes`. Four consumers depend on it:
 *
 * - `NodeToolbox.updateHighlight` tests membership with `lecture.domains.includes(node)`
 * - `TransitionToolbox.lectureTransform` tests membership and position with `includes` / `indexOf`
 * - `EdgeToolbox.updatePosition` reads `edge.source.x`, which is only current because the
 *   simulation and the drag handler mutate that same node object
 * - `d3.forceLink` only skips id resolution when `source` / `target` are already objects
 *
 * So never rebuild, clone, or serialise a GraphData to get a second copy of it: ask for a fresh
 * projection instead. Everything returned here is a plain object (never a Svelte `$state` proxy),
 * which is what keeps a GraphData structuredClone-able.
 *
 * @param model - The plain model snapshot to project, with collections already in display order
 * @returns The formatted GraphData
 * @throws If a relation or lecture references a domain/subject id that is not in `model`, which
 * means the model was built from incomplete data
 */
export function projectGraphData(model: GraphModel): GraphData {
	const graph: GraphData = {
		domain_nodes: [],
		domain_edges: [],
		subject_nodes: [],
		subject_edges: [],
		lectures: []
	};

	// Domain nodes
	const domain_map = new Map<number, NodeData>();
	for (const domain of model.domains) {
		const node_data: NodeData = {
			id: domain.id,
			uuid: 'domain-' + domain.id, // Prefix to avoid id conflicts between domains and subjects
			type: NodeType.DOMAIN,
			style: domain.style,
			text: domain.name,
			x: domain.x,
			y: domain.y,
			fx: domain.x,
			fy: domain.y
		};

		domain_map.set(domain.id, node_data);
		graph.domain_nodes.push(node_data);
	}

	// Domain edges
	for (const key of model.domainEdges) {
		const { sourceId, targetId } = edgeEnds(key);
		const source_node = domain_map.get(sourceId);
		const target_node = domain_map.get(targetId);
		if (source_node === undefined || target_node === undefined) {
			throw new Error(`Invalid graph data: domain relation ${key} references a missing domain`);
		}

		graph.domain_edges.push({
			uuid: `domain-${sourceId}-${targetId}`, // Unique edge id from source and target ids
			source: source_node,
			target: target_node
		});
	}

	// Subject nodes
	const subject_map = new Map<number, NodeData>();
	for (const subject of model.subjects) {
		let domain_node = undefined;
		if (subject.domainId !== null) {
			domain_node = domain_map.get(subject.domainId);
			if (domain_node === undefined) {
				throw new Error(
					`Invalid graph data: subject ${subject.id} references missing domain ${subject.domainId}`
				);
			}
		}

		const node_data: NodeData = {
			id: subject.id,
			uuid: 'subject-' + subject.id, // Prefix to avoid id conflicts between domains and subjects
			type: NodeType.SUBJECT,
			style: domain_node?.style ?? null,
			text: subject.name,
			parent: domain_node,
			x: subject.x,
			y: subject.y,
			fx: subject.x,
			fy: subject.y
		};

		subject_map.set(subject.id, node_data);
		graph.subject_nodes.push(node_data);
	}

	// Subject edges - forward and reverse edges are mapped so lectures can find past and future
	// subjects more easily
	const forward_edge_map = new Map<number, EdgeData[]>();
	const reverse_edge_map = new Map<number, EdgeData[]>();

	for (const key of model.subjectEdges) {
		const { sourceId, targetId } = edgeEnds(key);
		const source_node = subject_map.get(sourceId);
		const target_node = subject_map.get(targetId);
		if (source_node === undefined || target_node === undefined) {
			throw new Error(`Invalid graph data: subject relation ${key} references a missing subject`);
		}

		const edge: EdgeData = {
			uuid: `subject-${sourceId}-${targetId}`, // Unique edge id from source and target ids
			source: source_node,
			target: target_node
		};

		const forward_edges = forward_edge_map.get(sourceId) || [];
		forward_edges.push(edge);
		forward_edge_map.set(sourceId, forward_edges);

		const reverse_edges = reverse_edge_map.get(targetId) || [];
		reverse_edges.push(edge);
		reverse_edge_map.set(targetId, reverse_edges);

		graph.subject_edges.push(edge);
	}

	// Lectures
	for (const lecture of model.lectures) {
		const lecture_data: LectureData = {
			id: lecture.id,
			name: lecture.name,
			past_nodes: [],
			present_nodes: [],
			future_nodes: [],
			domains: [],
			nodes: [],
			edges: []
		};

		// Get present nodes
		for (const subjectId of lecture.subjectIds) {
			const subject_node = subject_map.get(subjectId);
			if (subject_node === undefined) {
				throw new Error(
					`Invalid graph data: lecture ${lecture.id} references missing subject ${subjectId}`
				);
			}

			lecture_data.present_nodes.push(subject_node);
			lecture_data.nodes.push(subject_node);

			// Get parent domain
			if (subject_node.parent) {
				lecture_data.domains.push(subject_node.parent);
			}
		}

		// Gather past and future nodes and edges
		for (const subjectId of lecture.subjectIds) {
			// Gather past nodes and edges
			const source_edges = reverse_edge_map.get(subjectId);
			if (source_edges) {
				for (const edge of source_edges.values()) {
					if (
						lecture_data.past_nodes.includes(edge.source) ||
						lecture_data.present_nodes.includes(edge.source) ||
						lecture_data.future_nodes.includes(edge.source)
					)
						continue; // Avoid duplicates

					lecture_data.past_nodes.push(edge.source);
					lecture_data.nodes.push(edge.source);
					lecture_data.edges.push(edge);
				}
			}

			// Gather future nodes and edges
			const target_edges = forward_edge_map.get(subjectId);
			if (target_edges) {
				for (const edge of target_edges.values()) {
					if (
						lecture_data.past_nodes.includes(edge.target) ||
						lecture_data.present_nodes.includes(edge.target) ||
						lecture_data.future_nodes.includes(edge.target)
					)
						continue; // Avoid duplicates

					lecture_data.future_nodes.push(edge.target);
					lecture_data.nodes.push(edge.target);
					lecture_data.edges.push(edge);
				}
			}
		}

		graph.lectures.push(lecture_data);
	}

	return graph;
}
