import * as settings from '$lib/settings';
import * as d3 from 'd3';

import { BackgroundToolbox } from './BackgroundToolbox';
import { CameraToolbox } from './CameraToolbox';
import { EdgeToolbox } from './EdgeToolbox';
import { NodeToolbox } from './NodeToolbox';
import { OverlayToolbox } from './OverlayToolbox';
import { TransitionToolbox } from './TransitionToolbox';

import { graphState } from './GraphD3State.svelte';
import { graphView, GraphView } from './GraphD3View.svelte';

import type {
	DefsSelection,
	EdgeData,
	GraphCanvas,
	GraphData,
	GroupSelection,
	LectureData,
	NodeData,
	SavePositions,
	SVGSelection
} from './types';

/**
 * Orchestrates the interactive D3 graph canvas: owns the SVG selections, the force simulation,
 * zoom/pan behavior, and the current graph data, and delegates rendering/interaction concerns to
 * the various Toolbox modules (BackgroundToolbox, NodeToolbox, EdgeToolbox, OverlayToolbox,
 * CameraToolbox, TransitionToolbox). One instance is created per mounted graph canvas; the
 * Svelte 5 bridge in GraphD3State.svelte.ts / graphD3.svelte.ts exposes it to component code.
 *
 * The canvas does not own its data. The graph store builds every GraphData it renders (see
 * projectGraphData) and pushes a new one through `applyData` whenever the graph changes, and the
 * positions this canvas moves go back to the store through `positionSink`.
 */
export class GraphD3 implements GraphCanvas {
	data: GraphData;
	editable: boolean;

	/** Called with the nodes that moved, whenever a drag or the force simulation settles them
	 *  somewhere new. Supplied by whoever mounts the canvas; undefined in the read-only viewer. */
	savePositions?: SavePositions;

	svg: SVGSelection;
	background: GroupSelection;
	content: GroupSelection;
	overlay: GroupSelection;
	definitions: DefsSelection;

	simulation: d3.Simulation<NodeData, EdgeData>;
	zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;

	zoom_lock = true;
	lecture: LectureData | null = null;
	keys: Record<string, boolean> = {};

	/** Node positions from before the simulation started, so resetSimulation can put them back.
	 *  Keyed by node uuid: a snapshot of positions, not a copy of the graph, so the reference
	 *  identity the renderers depend on is never at stake. */
	private position_backup: Map<string, { x: number; y: number }> | null = null;

	/** A projection that arrived while a view transition was running, applied once it finishes. */
	private pending_data: { data: GraphData; recenter: boolean } | null = null;

	/**
	 * Build a new graph canvas: sets up the SVG layer structure (defs/background/content/overlay),
	 * the force simulation, and zoom/pan, then snaps the camera into the requested initial view.
	 * Clears any existing content in `element` first.
	 *
	 * @param element - The `<svg>` element to render into
	 * @param data - The graph data to render, as projected by the graph store
	 * @param editable - Whether the graph is being viewed in the authenticated editor (enables
	 * dragging/editing interactions) or the read-only public viewer
	 * @param view - Which of domains/subjects/lectures to open on
	 * @param lectureId - If provided, the lecture to focus when `view` is `lectures`
	 * @param savePositions - Called with the nodes that moved, whenever a drag or the force
	 * simulation settles them somewhere new. Omitted in the read-only public viewer.
	 */
	constructor(
		element: SVGSVGElement,
		data: GraphData,
		editable: boolean,
		view: GraphView = GraphView.domains,
		lectureId: number | null = null,
		savePositions?: SavePositions
	) {
		this.editable = editable;
		this.savePositions = savePositions;

		// Set zoom lock to false if editable
		if (this.editable) {
			this.zoom_lock = false;
		}

		this.data = data;

		switch (view) {
			case GraphView.domains:
				graphView.toDomains();
				break;
			case GraphView.subjects:
				graphView.toSubjects();
				break;
			case GraphView.lectures:
				graphView.toLectures();
				break;
		}

		if (lectureId !== null) {
			this.lecture = this.data.lectures.find((l) => l.id === lectureId) ?? null;
		}

		// SVG setup
		this.svg = d3
			.select<SVGSVGElement, unknown>(element)
			.attr('preserveAspectRatio', 'xMinYMin meet');

		this.svg.selectAll('*').remove(); // Clear SVG

		// Set up SVG components - order is important!
		this.definitions = this.svg.append('defs');
		this.background = this.svg.append('g').attr('id', 'background');
		this.content = this.svg.append('g').attr('id', 'content');
		this.overlay = this.svg.append('g').attr('id', 'overlay');

		// Simulation setup
		this.simulation = d3
			.forceSimulation<NodeData>()
			.force('x', d3.forceX(0).strength(settings.CENTER_FORCE))
			.force('y', d3.forceY(0).strength(settings.CENTER_FORCE))
			.force('charge', d3.forceManyBody().strength(settings.CHARGE_FORCE))
			.on('tick', () => {
				d3.select('#content')
					.selectAll<SVGGElement, NodeData>('.node')
					.call(NodeToolbox.updatePosition, this);
			});

		this.simulation.stop();

		// Zoom & pan setup
		this.zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([settings.MIN_ZOOM, settings.MAX_ZOOM])
			.filter((event) => CameraToolbox.allowZoomAndPan(this, event))
			.on('zoom', (event) => {
				this.svg.select('#origin').attr('transform', event.transform);
				this.content.attr('transform', event.transform);
				BackgroundToolbox.transformGrid(this, event.transform);
			});

		// Toolbox setup - mainly adds definitions
		BackgroundToolbox.init(this);
		NodeToolbox.init(this);
		EdgeToolbox.init(this);

		// Attach event listeners
		d3.select(document) // This has to be document, otherwise shiftscroll will not work
			.on('keydown', (event) => (this.keys[event.key] = true))
			.on('keyup', (event) => (this.keys[event.key] = false));

		this.svg
			.call(this.zoom)
			.on('dblclick.zoom', null)
			.on('wheel', () => {
				if (
					(graphView.isDomains() || graphView.isSubjects()) &&
					(graphState.isIdle() || graphState.isSimulating()) &&
					this.zoom_lock &&
					!this.keys.Shift
				) {
					OverlayToolbox.zoom(this);
				}
			});

		// Enter initial view
		if (graphView.isDomains()) TransitionToolbox.snapToDomains(this);
		else if (graphView.isSubjects()) TransitionToolbox.snapToSubjects(this);
		else if (graphView.isLectures()) TransitionToolbox.snapToLectures(this);
	}

	// -----------------------------> Public methods

	/** Remove all rendered content from the SVG and reset the in-memory graph data to empty. */
	clear() {
		this.svg.selectAll('*').remove(); // Clear SVG
		this.data = {
			domain_nodes: [],
			domain_edges: [],
			subject_nodes: [],
			subject_edges: [],
			lectures: []
		};
	}

	/**
	 * Render a new projection of the graph. The camera stays where the user left it and nodes that
	 * survive the update keep their on-screen position, so an edit elsewhere in the editor does not
	 * disturb what is on the canvas.
	 *
	 * Deferred while a view transition is running, since a transition animates the data it started
	 * with; the last projection to arrive is applied once the transition finishes.
	 *
	 * @param data - The projection to render, built by the graph store
	 * @param options - `recenter` animates the camera to frame the new data, for when the canvas is
	 * handed a different graph rather than an update of the one it is showing
	 */
	applyData(data: GraphData, { recenter = false }: { recenter?: boolean } = {}) {
		if (graphState.isTransitioning()) {
			this.pending_data = { data, recenter };
			setTimeout(() => this.applyPendingData(), settings.GRAPH_ANIMATION_DURATION);
			return;
		}

		this.carryOverPositions(data);
		this.data = data;

		// Every projection builds fresh LectureData objects, so the focused lecture has to be
		// looked up again: the renderers test lecture membership by reference
		const focused = this.lecture;
		if (focused) {
			this.lecture = data.lectures.find((lecture) => lecture.id === focused.id) ?? null;
		}

		if (recenter) {
			if (graphView.isDomains()) TransitionToolbox.snapToDomains(this, true);
			else if (graphView.isSubjects()) TransitionToolbox.snapToSubjects(this, true);
			else TransitionToolbox.snapToLectures(this);
			return;
		}

		TransitionToolbox.refreshContent(this);
	}

	/**
	 * Transition the canvas from the current view (domains/subjects/lectures) to `targetView`,
	 * using the matching TransitionToolbox animation for that pair. No-op while a view
	 * transition is already in progress; stops any running simulation first. Transitioning to
	 * the current view (a same-to-same target) is a no-op, since no case matches.
	 *
	 * @param targetView - The view to transition to
	 */
	setView(targetView: GraphView) {
		if (graphState.isTransitioning()) return;
		if (graphState.isSimulating()) this.stopSimulation();

		switch (graphView.state) {
			case GraphView.domains:
				if (targetView === GraphView.subjects) {
					TransitionToolbox.domainsToSubjects(this);
				} else if (targetView === GraphView.lectures) {
					TransitionToolbox.domainsToLectures(this);
				}
				break;

			case GraphView.subjects:
				if (targetView === GraphView.domains) {
					TransitionToolbox.subjectsToDomains(this);
				} else if (targetView === GraphView.lectures) {
					TransitionToolbox.subjectsToLectures(this);
				}
				break;

			case GraphView.lectures:
				if (targetView === GraphView.domains) {
					TransitionToolbox.lecturesToDomains(this);
				} else if (targetView === GraphView.subjects) {
					TransitionToolbox.lecturesToSubjects(this);
				}
				break;
		}
	}

	/**
	 * Set (or clear) the focused lecture. When the lectures view is active, re-snaps to reflect
	 * the new lecture's past/present/future node grouping. Always refreshes node highlighting
	 * regardless of the active view.
	 *
	 * @param lecture - The lecture to focus, or null to clear the focused lecture
	 */
	setLecture(lecture: LectureData | null) {
		this.lecture = lecture;

		// Update lecture view
		if (graphView.isLectures()) TransitionToolbox.snapToLectures(this);

		// Update highlights
		this.content.selectAll<SVGGElement, NodeData>('.node').call(NodeToolbox.updateHighlight, this);
	}

	/**
	 * Focus the lecture with the given id, or clear the focus. Takes an id rather than a
	 * LectureData because callers know the id (it lives in the URL) while the LectureData objects
	 * belong to whichever projection is currently rendered. No-op if that lecture is already
	 * focused.
	 *
	 * @param id - The lecture to focus, or null to clear the focused lecture
	 */
	setLectureById(id: number | null) {
		if ((this.lecture?.id ?? null) === id) return;

		const lecture = id === null ? null : (this.data.lectures.find((l) => l.id === id) ?? null);
		this.setLecture(lecture);
	}

	/**
	 * Animate the camera one zoom step in (by `settings.ZOOM_STEP`). No-op if zoom/pan is
	 * currently disallowed.
	 */
	zoomIn() {
		if (!CameraToolbox.allowZoomAndPan(this)) {
			return;
		}

		this.svg
			.transition()
			.duration(settings.GRAPH_ANIMATION_DURATION)
			.ease(d3.easeSinInOut)
			.call(this.zoom.scaleBy, settings.ZOOM_STEP);
	}

	/**
	 * Animate the camera one zoom step out (the inverse of `settings.ZOOM_STEP`). No-op if
	 * zoom/pan is currently disallowed.
	 */
	zoomOut() {
		if (!CameraToolbox.allowZoomAndPan(this)) {
			return;
		}

		this.svg
			.transition()
			.duration(settings.GRAPH_ANIMATION_DURATION)
			.ease(d3.easeSinInOut)
			.call(this.zoom.scaleBy, 1 / settings.ZOOM_STEP);
	}

	/**
	 * Start the force simulation, releasing all fixed nodes so they can move freely. No-op
	 * unless the graph is currently idle. Snapshots the current node positions first, so
	 * resetSimulation can put them back.
	 */
	startSimulation() {
		if (!graphState.isIdle()) return;

		// Remember where every node was, so an abandoned simulation can be undone
		this.position_backup = new Map(
			this.nodes().map((node) => [node.uuid, { x: node.x, y: node.y }])
		);

		// Release all nodes
		this.content
			.selectAll<SVGGElement, NodeData>('.node.fixed')
			.call(NodeToolbox.setFixed, this, false);

		// Excite simulation
		this.simulation.alpha(1).restart();

		graphState.toSimulating();
	}

	/**
	 * Discard the in-progress simulation, move every node back to where it was when
	 * startSimulation ran, and persist that so the database matches what is on screen. No-op
	 * unless the graph is currently simulating.
	 *
	 * @throws If no snapshot exists (should not happen if startSimulation always ran first)
	 */
	resetSimulation() {
		if (!graphState.isSimulating()) return;

		const backup = this.position_backup;
		if (!backup) {
			throw new Error('No backup positions available to reset simulation');
		}

		// Restore positions on the node objects the nodes and edges are rendered from
		for (const node of this.nodes()) {
			const position = backup.get(node.uuid);
			if (!position) continue;

			node.x = position.x;
			node.y = position.y;
			node.fx = position.x;
			node.fy = position.y;
		}

		this.simulation.stop();
		this.position_backup = null;
		graphState.toIdle();

		// Pin every node at its restored position and save that. Going through stopSimulation here
		// would instead save the positions the abandoned simulation had reached.
		const nodes = this.content.selectAll<SVGGElement, NodeData>('.node');
		nodes.call(NodeToolbox.setFixed, this, true);
		NodeToolbox.updatePosition(nodes, this, true);
		NodeToolbox.save(nodes, this);

		this.centerOnGraph();
	}

	/**
	 * Stop the force simulation, fixing every node at its current position and persisting the
	 * result. No-op unless the graph is currently simulating.
	 */
	stopSimulation() {
		if (!graphState.isSimulating()) return;

		// Fix all nodes
		this.content
			.selectAll<SVGGElement, NodeData>('.node:not(.fixed)')
			.call(NodeToolbox.setFixed, this, true)
			.call(NodeToolbox.save, this);

		// Freeze simulation
		this.simulation.stop();

		// Cleanup
		this.position_backup = null;
		this.centerOnGraph();
		graphState.toIdle();
	}

	/** Whether any rendered node is currently unfixed (free to move in the simulation). */
	hasFreeNodes() {
		return this.content.selectAll<SVGGElement, NodeData>('.node:not(.fixed)').size() > 0;
	}

	/**
	 * Animate the camera to frame every currently rendered node. No-op if zoom/pan is currently
	 * disallowed.
	 */
	centerOnGraph() {
		if (!CameraToolbox.allowZoomAndPan(this)) {
			return;
		}

		const nodes = this.content.selectAll<SVGGElement, NodeData>('.node').data();
		const transform = CameraToolbox.centralTransform(this, nodes);
		CameraToolbox.moveCamera(this, transform, () => {});
	}

	/**
	 * The DOM element to hand to the Fullscreen API when toggling fullscreen. Walks up from the
	 * `<svg>` node past its wrapping elements. Owning this here (rather than at call sites) keeps
	 * `GraphRenderer.svelte`'s markup nesting an implementation detail of GraphD3.
	 */
	getFullscreenTarget() {
		return this.svg.node()?.parentElement?.parentElement ?? null;
	}

	// -----------------------------> Private methods

	/** Every node in the current data, domains and subjects together. */
	private nodes(): NodeData[] {
		return [...this.data.domain_nodes, ...this.data.subject_nodes];
	}

	/**
	 * Copy the live position of every rendered node onto its counterpart in `data`, so applying a
	 * new projection does not yank nodes back to whatever positions the last load carried. Nodes
	 * that are not currently rendered keep the projection's positions, which the store holds
	 * current through persistPositions.
	 *
	 * @param data - The incoming projection, mutated in place
	 */
	private carryOverPositions(data: GraphData) {
		const rendered = new Map<string, NodeData>();
		this.content.selectAll<SVGGElement, NodeData>('.node').each(function (node) {
			rendered.set(node.uuid, node);
		});

		for (const node of [...data.domain_nodes, ...data.subject_nodes]) {
			const current = rendered.get(node.uuid);
			if (current === undefined) continue;

			node.x = current.x;
			node.y = current.y;
			node.fx = current.fx;
			node.fy = current.fy;
		}
	}

	/**
	 * Apply the projection that arrived mid-transition, or wait one more animation out if the
	 * canvas is still transitioning.
	 */
	private applyPendingData() {
		const pending = this.pending_data;
		if (pending === null) return;

		if (graphState.isTransitioning()) {
			setTimeout(() => this.applyPendingData(), settings.GRAPH_ANIMATION_DURATION);
			return;
		}

		this.pending_data = null;
		this.applyData(pending.data, { recenter: pending.recenter });
	}
}
