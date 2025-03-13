
import * as d3 from 'd3';
import * as settings from '$lib/settings';
import { BackgroundToolbox } from './BackgroundToolbox';
import { CameraToolbox } from './CameraToolbox';
import { GraphD3 } from './GraphD3';
import { EdgeToolbox } from './EdgeToolbox';
import { NodeToolbox } from './NodeToolbox';
import { graphState } from './GraphD3State.svelte';
import { graphView } from './GraphD3View.svelte';

import type {
	EdgeData,
	NodeData,
} from './types';

// -----------------------------> Classes

export class TransitionToolbox {
	private static clearContent(graph: GraphD3, callback?: () => void) {
		graph.content
			.selectAll('*')
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.ease(d3.easeSinInOut)
			.on('end', function () {
				d3.select(this).remove();
			}) // Use this instead of .remove() to circumvent pending transitions
			.style('opacity', 0);

		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	private static setContent(graph: GraphD3, nodes: NodeData[], edges: EdgeData[], callback?: () => void) {
		if (nodes.length + edges.length === 0) return this.clearContent(graph, callback);

		// Update Nodes
		graph.content
			.selectAll<SVGGElement, NodeData>('.node')
			.data(nodes, (node) => node.id)
			.join(
				function (enter) {
					return enter
						.append('g')
						.call(NodeToolbox.create, graph)
						.call(NodeToolbox.updateHighlight, graph)
						.style('opacity', 0);
				},

				function (update) {
					return update.call(NodeToolbox.updateHighlight, graph);
				},

				function (exit) {
					return exit
						.transition()
						.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
						.on('end', function () {
							d3.select(this).remove();
						}) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0);
				}
			)
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.style('opacity', 1);

		// Update relations
		graph.content
			.selectAll<SVGGElement, EdgeData>('.edge')
			.data(edges, (edge) => edge.id)
			.join(
				function (enter) {
					return enter
						.append('line')
						.call(EdgeToolbox.create)
							.style('opacity', 0);
				},

				function (update) {
					return update;
				},

				function (exit) {
					return exit
						.transition()
						.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
						.on('end', function () {
							d3.select(this).remove();
						}) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0);
				}
			)
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.style('opacity', 1);

		// Update simulation
		graph.simulation
			.nodes(nodes)
			.force('link', d3.forceLink(edges));

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	private static moveContent(graph: GraphD3, nodes: NodeData[], transform: (node: NodeData) => void, callback?: () => void) {

		// Buffer node positions
		const buffers = nodes.map((node) => ({ node, x: node.x, y: node.y }));

		// Set node positions
		nodes.forEach(transform);

		// Update nodes
		graph.content
			.selectAll<SVGGElement, NodeData>('.node')
			.call(NodeToolbox.updatePosition, graph, callback !== undefined);

		// Restore node positions
		for (const buffer of buffers) {
			buffer.node.x = buffer.x;
			buffer.node.y = buffer.y;
		}

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	private static restoreContentPosition(graph: GraphD3, callback?: () => void) {
		// Update nodes
		graph.content
			.selectAll<SVGGElement, NodeData>('.node')
			.call(NodeToolbox.updatePosition, graph, callback !== undefined);

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	// -----------------------------> Transformations

	private static domainTransform(node: NodeData): void {
		node.x = node.parent ? node.parent.x : node.x;
		node.y = node.parent ? node.parent.y : node.y;
	}

	private static lectureTransform(graph: GraphD3, x: number, y: number): (node: NodeData) => void {
		const past = graph.lecture ? graph.lecture.past_nodes : [];
		const present = graph.lecture ? graph.lecture.present_nodes : [];
		const future = graph.lecture ? graph.lecture.future_nodes : [];

		const height = Math.max(past.length, present.length, future.length);
		const dx = x - (3 * settings.LECTURE_COLUMN_WIDTH) / 2;
		const dy = y - (
				settings.LECTURE_HEADER_HEIGHT +
				height * settings.NODE_HEIGHT +
				(height + 1) * settings.LECTURE_PADDING
			) / 2;

		return (node: NodeData) => {

			// Set past node positions to the right column
			if (past?.includes(node)) {
				const index = past.indexOf(node);
				node.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_PADDING;
				node.y =
					dy +
					settings.LECTURE_HEADER_HEIGHT +
					settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) +
					(index + 1) * settings.LECTURE_PADDING +
					index * settings.NODE_HEIGHT;
				return;
			}

			// Set present node positions to the middle column
			if (present?.includes(node)) {
				const index = present.indexOf(node);
				node.x =
					dx +
					settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) +
					settings.LECTURE_COLUMN_WIDTH +
					settings.LECTURE_PADDING;
				node.y =
					dy +
					settings.LECTURE_HEADER_HEIGHT +
					settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) +
					(index + 1) * settings.LECTURE_PADDING +
					index * settings.NODE_HEIGHT;
				return;
			}

			// Set future node positions to the left column
			if (future?.includes(node)) {
				const index = future.indexOf(node);
				node.x =
					dx +
					settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) +
					2 * settings.LECTURE_COLUMN_WIDTH +
					settings.LECTURE_PADDING;
				node.y =
					dy +
					settings.LECTURE_HEADER_HEIGHT +
					settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) +
					(index + 1) * settings.LECTURE_PADDING +
					index * settings.NODE_HEIGHT;
				return;
			}
		};
	}

	// -----------------------------> Transitions

	static snapToDomains(graph: GraphD3) {
		graphState.toTransitioning();

		// Set camera pov and background
		const transform = CameraToolbox.centralTransform(graph, graph.data.domain_nodes);
		CameraToolbox.moveCamera(graph, transform);
		BackgroundToolbox.grid(graph);

		// Set content
		this.setContent(graph, graph.data.domain_nodes, graph.data.domain_edges);
		this.restoreContentPosition(graph);

		// Cleanup
		graphState.toIdle();
		graphView.toDomains();
	}

	static snapToSubjects(graph: GraphD3) {
		graphState.toTransitioning();

		// Set camera pov and background
		const transform = CameraToolbox.centralTransform(graph, graph.data.subject_nodes);
		CameraToolbox.moveCamera(graph, transform);
		BackgroundToolbox.grid(graph);

		// Set content
		this.setContent(graph, graph.data.subject_nodes, graph.data.subject_edges);
		this.restoreContentPosition(graph);

		// Cleanup
		graphState.toIdle();
		graphView.toSubjects();
	}

	static snapToLectures(graph: GraphD3) {
		graphState.toTransitioning();

		// Set camera pov and background
		CameraToolbox.moveCamera(graph, { x: 0, y: 0, k: 1 });
		BackgroundToolbox.lecture(graph);

		// Set content
		const nodes = graph.lecture ? graph.lecture.nodes : [];
		const edges = graph.lecture ? graph.lecture.edges : [];
		this.setContent(graph, nodes, edges);
		this.moveContent(graph, nodes, this.lectureTransform(graph, 0, 0));

		// Cleanup
		graphState.toIdle();
		graphView.toLectures();
	}

	static domainsToSubjects(graph: GraphD3) {
		graphState.toTransitioning();

		// Transition camera to new pov
		const transform = CameraToolbox.centralTransform(graph, graph.data.subject_nodes);
		CameraToolbox.moveCamera(graph, transform, () => {});

		// Set new content to domain positions
		this.setContent(graph, graph.data.subject_nodes, graph.data.subject_edges);
		this.moveContent(graph, graph.data.subject_nodes, this.domainTransform);

		// Transition content to original positions
		this.restoreContentPosition(graph, () => {
			// Cleanup
			graphState.toIdle();
			graphView.toSubjects();
		});
	}

	static domainsToLectures(graph: GraphD3) {
		// Validate lecture
		if (graph.lecture === null) {
			this.snapToLectures(graph);
			return;
		}

		graphState.toTransitioning();

		// Transition to new camera pov - centered on the current graph for minimal movement
		const transform = CameraToolbox.centralTransform(graph, graph.data.domain_nodes);
		CameraToolbox.moveCamera(graph, { ...transform, k: 1 }, () => {});

		// Set new content in domain positions
		this.setContent(graph, graph.lecture.nodes, graph.lecture.edges);
		this.moveContent(graph, graph.lecture.nodes, this.domainTransform);

		// Transition content to lecture positions, then update background
		this.moveContent(graph, graph.lecture.nodes, this.lectureTransform(graph, transform.x, transform.y), () => {
			BackgroundToolbox.lecture(graph);

			// Cleanup
			graphState.toIdle();
			graphView.toLectures();
		});
	}

	static subjectsToDomains(graph: GraphD3) {
		graphState.toTransitioning();

		// Transition to new camera pov
		const transform = CameraToolbox.centralTransform(graph, graph.data.domain_nodes);
		CameraToolbox.moveCamera(graph, transform);

		// Move content to domain positions, then fade in new content
		this.moveContent(graph, graph.data.subject_nodes, this.domainTransform, () => {
			this.setContent(graph, graph.data.domain_nodes, graph.data.domain_edges, () => {
				// Cleanup
				graphState.toIdle();
				graphView.toDomains();
			});
		});
	}

	static subjectsToLectures(graph: GraphD3) {
		// Validate lecture
		if (graph.lecture === null) {
			this.snapToLectures(graph);
			return;
		}

		graphState.toTransitioning();
		const lecture = graph.lecture; // Ref to lecture for future callbacks

		// Transition to new camera pov - centered on the current graph for minimal movement
		const transform = CameraToolbox.centralTransform(graph, graph.data.subject_nodes);
		CameraToolbox.moveCamera(graph, { ...transform, k: 1 }, () => {});

		// Fade in new content, then move to lecture positions, then update background
		this.setContent(graph, lecture.nodes, lecture.edges, () => {
			this.moveContent(graph, lecture.nodes, this.lectureTransform(graph, transform.x, transform.y), () => {
				BackgroundToolbox.lecture(graph);

				// Cleanup
				graphState.toIdle();
				graphView.toLectures();
			});
		});
	}

	static lecturesToDomains(graph: GraphD3) {
		// Validate lecture
		if (graph.lecture === null) {
			this.snapToDomains(graph);
			return;
		}

		graphState.toTransitioning();

		// Snap camera and content to new pov - as the camera might be at (0, 0) at this time
		const transform = CameraToolbox.centralTransform(graph, graph.data.domain_nodes);
		CameraToolbox.panCamera(graph, transform.x, transform.y);
		this.moveContent(graph, graph.lecture.nodes, this.lectureTransform(graph, transform.x, transform.y));

		// Update background and zoom out to new pov
		BackgroundToolbox.grid(graph);
		CameraToolbox.zoomCamera(graph, transform.k, () => {});

		// Transition content to domain positions, then fade in new content
		this.moveContent(graph, graph.lecture.nodes, this.domainTransform, () => {
			this.setContent(graph, graph.data.domain_nodes, graph.data.domain_edges, () => {
				// Cleanup
				graphState.toIdle();
				graphView.toDomains();
			});
		});
	}

	static lecturesToSubjects(graph: GraphD3) {
		// Validate lecture
		if (graph.lecture === null) {
			this.snapToSubjects(graph);
			return;
		}

		graphState.toTransitioning();

		// Snap camera and content to new pov - as the camera might be at (0, 0) at this time
		const transform = CameraToolbox.centralTransform(graph, graph.data.subject_nodes);
		CameraToolbox.panCamera(graph, transform.x, transform.y);
		this.moveContent(graph, graph.lecture.nodes, this.lectureTransform(graph, transform.x, transform.y));

		// Set new background and zoom out to new pov
		BackgroundToolbox.grid(graph);
		CameraToolbox.zoomCamera(graph, transform.k, () => {});

		// Transition content to original positions, then fade in new content
		this.restoreContentPosition(graph, () => {
			this.setContent(graph, graph.data.subject_nodes, graph.data.subject_edges, () => {
				// Cleanup
				graphState.toIdle();
				graphView.toSubjects();
			});
		});
	}
}
