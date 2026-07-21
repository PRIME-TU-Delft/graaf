import * as d3 from 'd3';
import * as settings from '$lib/settings';
import { BackgroundToolbox } from './BackgroundToolbox';
import { CameraToolbox } from './CameraToolbox';
import { GraphD3 } from './GraphD3';
import { EdgeToolbox } from './EdgeToolbox';
import { NodeToolbox } from './NodeToolbox';
import { graphState } from './GraphD3State.svelte';
import { graphView } from './GraphD3View.svelte';

import type { EdgeData, NodeData } from './types';

// -----------------------------> Classes

/**
 * Drives every animated move between the graph's three views (domains, subjects, lectures):
 * fading nodes/edges in and out as the visible dataset changes, moving nodes between their
 * domain-grouped and lecture-table positions, and panning/zooming the camera to match. The
 * private helpers (clearContent/setContent/moveContent/restoreContentPosition and the two
 * transform builders) are the building blocks; the public snapToX and XToY methods compose them
 * into the actual transitions used by GraphD3.setView and the initial view on construction.
 *
 * Every public transition sets graphState to 'transitioning' at the start and back to 'idle'
 * once its animation (or chain of animations) completes, so GraphD3 and the Toolboxes can tell
 * when it's safe to start another transition or interaction.
 */
export class TransitionToolbox {
	/**
	 * Fade out and remove all current content (nodes and edges), used as the base case when a
	 * view has nothing to show (e.g. an empty lecture) and as the final step of setContent when
	 * a data update leaves no nodes or edges.
	 *
	 * @param graph - The graph instance to clear content from
	 * @param callback - If provided, animates the fade and calls this once it completes; if
	 * omitted, content is removed instantly and no callback is scheduled
	 */
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

	/**
	 * Reconcile the rendered nodes/edges with a new target set, using D3's data join: entering
	 * nodes/edges are created and faded in, updating ones are repositioned/restyled in place,
	 * and exiting ones are faded out and removed. Also rebinds the force simulation to the new
	 * node/edge arrays. Delegates to clearContent if the target set is empty.
	 *
	 * @param graph - The graph instance to update content for
	 * @param nodes - The full set of nodes that should be rendered after this call
	 * @param edges - The full set of edges that should be rendered after this call
	 * @param callback - If provided, animates the join and calls this once it completes; if
	 * omitted, the join is instant and no callback is scheduled
	 */
	private static setContent(
		graph: GraphD3,
		nodes: NodeData[],
		edges: EdgeData[],
		callback?: () => void
	) {
		if (nodes.length + edges.length === 0) return this.clearContent(graph, callback);

		// Update Nodes
		graph.content
			.selectAll<SVGGElement, NodeData>('.node')
			.data(nodes, (node) => node.uuid)
			.join(
				function (enter) {
					return enter
						.append('g')
						.call(NodeToolbox.create, graph)
						.call(NodeToolbox.updateHighlight, graph)
						.style('opacity', 0);
				},

				function (update) {
					return update
						.call(NodeToolbox.updatePosition, graph, callback !== undefined)
						.call(NodeToolbox.updateHighlight, graph)
						.call(NodeToolbox.updateStyle)
						.call(NodeToolbox.updateText);
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
			.selectAll<SVGLineElement, EdgeData>('.edge')
			.data(edges, (edge) => edge.uuid)
			.join(
				function (enter) {
					return enter.append('line').call(EdgeToolbox.create).style('opacity', 0);
				},

				function (update) {
					return update
						.call(EdgeToolbox.updatePosition, callback !== undefined)
						.call(EdgeToolbox.updateStyle);
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
		graph.simulation.nodes(nodes).force('link', d3.forceLink(edges));

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	/**
	 * Animate the given nodes to new positions computed by `transform`, then restore each node's
	 * `x`/`y` back to what it was before the call. The restore means this only affects the
	 * rendered position, not the underlying data, which is intentional: it's used to animate a
	 * node visually into a domain-grouped or lecture-table layout without mutating the graph's
	 * actual stored positions.
	 *
	 * @param graph - The graph instance to move content for
	 * @param nodes - The nodes to move; mutated in place during the call, then restored
	 * @param transform - Sets a node's `x`/`y` to its target position; called once per node
	 * @param callback - If provided, animates the move and calls this once it completes; if
	 * omitted, the move is instant and no callback is scheduled
	 */
	private static moveContent(
		graph: GraphD3,
		nodes: NodeData[],
		transform: (node: NodeData) => void,
		callback?: () => void
	) {
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

	/**
	 * Animate the rendered nodes back to their actual stored (data) positions, undoing a prior
	 * moveContent call. Used to transition out of a domain-grouped or lecture-table layout back
	 * to each node's real position.
	 *
	 * @param graph - The graph instance to restore content positions for
	 * @param callback - If provided, animates the move and calls this once it completes; if
	 * omitted, the move is instant and no callback is scheduled
	 */
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

	/**
	 * A moveContent transform that collapses a subject node onto its parent domain's position
	 * (used when transitioning into the domains view or grouping subjects by domain), leaving
	 * nodes without a parent domain where they are.
	 *
	 * @param node - The node to reposition in place
	 */
	private static domainTransform(node: NodeData): void {
		node.x = node.parent ? node.parent.x : node.x;
		node.y = node.parent ? node.parent.y : node.y;
	}

	/**
	 * Build a moveContent transform that places each of a lecture's nodes into its
	 * past/present/future column of the lecture table background, centered at (x, y). Nodes not
	 * in any of the lecture's past/present/future lists are left untouched.
	 *
	 * @param graph - The graph instance, used to read the focused lecture's node groupings
	 * @param x - The horizontal center to lay the three columns out around
	 * @param y - The vertical center to lay the columns out around
	 * @returns A transform function suitable for passing to moveContent
	 */
	private static lectureTransform(graph: GraphD3, x: number, y: number): (node: NodeData) => void {
		const past = graph.lecture ? graph.lecture.past_nodes : [];
		const present = graph.lecture ? graph.lecture.present_nodes : [];
		const future = graph.lecture ? graph.lecture.future_nodes : [];

		const height = Math.max(past.length, present.length, future.length);
		const dx = x - (3 * settings.LECTURE_COLUMN_WIDTH) / 2;
		const dy =
			y -
			(settings.LECTURE_HEADER_HEIGHT +
				height * settings.NODE_HEIGHT +
				(height + 1) * settings.LECTURE_PADDING) /
				2;

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

	/**
	 * Switch directly to the domains view, instantly, without an entry/exit animation for the
	 * content (only the camera move optionally animates). Used for the initial view on
	 * construction and by GraphD3.setData.
	 *
	 * @param graph - The graph instance to transition
	 * @param animateCamera - Whether the camera move should animate, or snap instantly
	 */
	static snapToDomains(graph: GraphD3, animateCamera = false) {
		graphState.toTransitioning();

		// Set camera pov and background - Background must be set before moving camera
		BackgroundToolbox.grid(graph);
		const transform = CameraToolbox.centralTransform(graph, graph.data.domain_nodes);
		CameraToolbox.moveCamera(graph, transform, animateCamera ? () => {} : undefined);

		// Set content
		this.setContent(graph, graph.data.domain_nodes, graph.data.domain_edges);
		this.restoreContentPosition(graph);

		// Cleanup
		graphState.toIdle();
		graphView.toDomains();
	}

	/**
	 * Switch directly to the subjects view, instantly, without an entry/exit animation for the
	 * content (only the camera move optionally animates). Used for the initial view on
	 * construction and by GraphD3.setData.
	 *
	 * @param graph - The graph instance to transition
	 * @param animateCamera - Whether the camera move should animate, or snap instantly
	 */
	static snapToSubjects(graph: GraphD3, animateCamera = false) {
		graphState.toTransitioning();

		// Set camera pov and background - Background must be set before moving camera
		BackgroundToolbox.grid(graph);
		const transform = CameraToolbox.centralTransform(graph, graph.data.subject_nodes);
		CameraToolbox.moveCamera(graph, transform, animateCamera ? () => {} : undefined);

		// Set content
		this.setContent(graph, graph.data.subject_nodes, graph.data.subject_edges);
		this.restoreContentPosition(graph);

		// Cleanup
		graphState.toIdle();
		graphView.toSubjects();
	}

	/**
	 * Switch directly to the lectures view, instantly, showing the currently focused lecture (or
	 * nothing, if none is focused). Used for the initial view on construction, by
	 * GraphD3.setLecture, and by GraphD3.setData.
	 *
	 * @param graph - The graph instance to transition, using `graph.lecture` as the lecture to show
	 */
	static snapToLectures(graph: GraphD3) {
		graphState.toTransitioning();

		// Set camera pov and background - Background must be set before moving camera
		BackgroundToolbox.lecture(graph);
		CameraToolbox.moveCamera(graph, { x: 0, y: 0, k: 1 });

		// Set content
		const nodes = graph.lecture ? graph.lecture.nodes : [];
		const edges = graph.lecture ? graph.lecture.edges : [];
		this.setContent(graph, nodes, edges);
		this.moveContent(graph, nodes, this.lectureTransform(graph, 0, 0));

		// Cleanup
		graphState.toIdle();
		graphView.toLectures();
	}

	/**
	 * Animate from the domains view to the subjects view: pans/zooms the camera to frame the
	 * subject nodes, fades in the subject content collapsed onto domain positions, then animates
	 * it out to each subject's real position.
	 *
	 * @param graph - The graph instance to transition
	 */
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
			graphState.toIdle();
			graphView.toSubjects();
		});
	}

	/**
	 * Animate from the domains view to the lectures view: pans/zooms the camera toward the
	 * lecture table's scale while staying centered on the domain nodes for minimal movement,
	 * fades in the focused lecture's content at domain positions, then animates it into the
	 * lecture table layout. Falls back to snapToLectures if no lecture is focused.
	 *
	 * @param graph - The graph instance to transition, using `graph.lecture` as the lecture to show
	 */
	static domainsToLectures(graph: GraphD3) {
		// Validate lecture
		if (graph.lecture === null) {
			this.snapToLectures(graph);
			return;
		}

		graphState.toTransitioning();

		// Transition to new camera pov - centered on the current graph for minimal movement
		const client = CameraToolbox.clientTransform(graph, 'lecture'); // Zoom out to fit into scaled lecture background
		const central = CameraToolbox.centralTransform(graph, graph.data.domain_nodes); // Pan to the center of the domain nodes
		CameraToolbox.moveCamera(graph, { ...central, k: client.k }, () => {});

		// Set new content in domain positions
		this.setContent(graph, graph.lecture.nodes, graph.lecture.edges);
		this.moveContent(graph, graph.lecture.nodes, this.domainTransform);

		// Transition content to lecture positions, then update background
		this.moveContent(
			graph,
			graph.lecture.nodes,
			this.lectureTransform(graph, central.x, central.y),
			() => {
				graphState.toIdle();
				graphView.toLectures();
			}
		);
	}

	/**
	 * Animate from the subjects view to the domains view: pans/zooms the camera to frame the
	 * domain nodes, animates the current subject content collapsed onto domain positions, then
	 * fades it out and fades in the domain content.
	 *
	 * @param graph - The graph instance to transition
	 */
	static subjectsToDomains(graph: GraphD3) {
		graphState.toTransitioning();

		// Transition to new camera pov
		const transform = CameraToolbox.centralTransform(graph, graph.data.domain_nodes);
		CameraToolbox.moveCamera(graph, transform, () => {});

		// Move content to domain positions, then fade in new content
		this.moveContent(graph, graph.data.subject_nodes, this.domainTransform, () => {
			this.setContent(graph, graph.data.domain_nodes, graph.data.domain_edges, () => {
				graphState.toIdle();
				graphView.toDomains();
			});
		});
	}

	/**
	 * Animate from the subjects view to the lectures view: pans/zooms the camera toward the
	 * lecture table's scale while staying centered on the subject nodes for minimal movement,
	 * fades in the focused lecture's content at its subject positions, then animates it into the
	 * lecture table layout. Falls back to snapToLectures if no lecture is focused.
	 *
	 * @param graph - The graph instance to transition, using `graph.lecture` as the lecture to show
	 */
	static subjectsToLectures(graph: GraphD3) {
		// Validate lecture
		if (graph.lecture === null) {
			this.snapToLectures(graph);
			return;
		}

		graphState.toTransitioning();
		const lecture = graph.lecture; // Ref to lecture for future callbacks

		// Transition to new camera pov - centered on the current graph for minimal movement
		const client = CameraToolbox.clientTransform(graph, 'lecture'); // Zoom out to fit into scaled lecture background
		const central = CameraToolbox.centralTransform(graph, graph.data.subject_nodes); // Pan to the center of the subject nodes
		CameraToolbox.moveCamera(graph, { ...central, k: client.k }, () => {});

		// Fade in new content, then move to lecture positions, then update background
		this.setContent(graph, lecture.nodes, lecture.edges, () => {
			this.moveContent(
				graph,
				lecture.nodes,
				this.lectureTransform(graph, central.x, central.y),
				() => {
					graphState.toIdle();
					graphView.toLectures();
				}
			);
		});
	}

	/**
	 * Animate from the lectures view to the domains view: switches the background to the grid
	 * ahead of time, snaps the camera/content to the lecture-table pov for the domains-node
	 * framing, zooms out to that framing, animates the lecture's content into domain positions,
	 * then fades it out and fades in the domain content. Falls back to snapToDomains if no
	 * lecture is focused.
	 *
	 * @param graph - The graph instance to transition, using `graph.lecture` as the lecture
	 * being left
	 */
	static lecturesToDomains(graph: GraphD3) {
		// Validate lecture
		if (graph.lecture === null) {
			this.snapToDomains(graph);
			return;
		}

		graphState.toTransitioning();

		// Update background - Background must be set before moving camera/calculating central transform
		BackgroundToolbox.grid(graph);

		// Snap camera and content to correct pov
		const client = CameraToolbox.clientTransform(graph, 'lecture'); // Zoom out to fit into scaled lecture background
		const central = CameraToolbox.centralTransform(graph, graph.data.domain_nodes); // Pan to the center of the domain nodes
		CameraToolbox.moveCamera(graph, { ...central, k: client.k });
		this.moveContent(
			graph,
			graph.lecture.nodes,
			this.lectureTransform(graph, central.x, central.y)
		);

		// Zoom out to new pov
		CameraToolbox.zoomCamera(graph, central.k, () => {});

		// Transition content to domain positions, then fade in new content
		this.moveContent(graph, graph.lecture.nodes, this.domainTransform, () => {
			this.setContent(graph, graph.data.domain_nodes, graph.data.domain_edges, () => {
				graphState.toIdle();
				graphView.toDomains();
			});
		});
	}

	/**
	 * Animate from the lectures view to the subjects view: switches the background to the grid
	 * ahead of time, snaps the camera/content to the lecture-table pov for the subject-node
	 * framing, zooms out to that framing, animates the lecture's content back to its real
	 * positions, then fades it out and fades in the subject content. Falls back to
	 * snapToSubjects if no lecture is focused.
	 *
	 * @param graph - The graph instance to transition, using `graph.lecture` as the lecture
	 * being left
	 */
	static lecturesToSubjects(graph: GraphD3) {
		// Validate lecture
		if (graph.lecture === null) {
			this.snapToSubjects(graph);
			return;
		}

		graphState.toTransitioning();

		// Update background
		BackgroundToolbox.grid(graph);

		// Snap camera and content to correct pov
		const client = CameraToolbox.clientTransform(graph, 'lecture'); // Zoom out to fit into scaled lecture background
		const central = CameraToolbox.centralTransform(graph, graph.data.subject_nodes); // Pan to the center of the subject nodes
		CameraToolbox.moveCamera(graph, { ...central, k: client.k });
		this.moveContent(
			graph,
			graph.lecture.nodes,
			this.lectureTransform(graph, central.x, central.y)
		);

		// Zoom out to fit subject nodes
		CameraToolbox.zoomCamera(graph, central.k, () => {});

		// Transition content to original positions, then fade in new content
		this.restoreContentPosition(graph, () => {
			this.setContent(graph, graph.data.subject_nodes, graph.data.subject_edges, () => {
				graphState.toIdle();
				graphView.toSubjects();
			});
		});
	}
}
