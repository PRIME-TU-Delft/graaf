import * as settings from '$lib/settings';
import * as d3 from 'd3';

import { NodeType } from './types';
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
	GraphData,
	GroupSelection,
	LectureData,
	NodeData,
	PrismaGraphPayload,
	SVGSelection
} from './types';
import type { DomainStyle } from '@prisma/client';

/**
 * Orchestrates the interactive D3 graph canvas: owns the SVG selections, the force simulation,
 * zoom/pan behavior, and the current graph data, and delegates rendering/interaction concerns to
 * the various Toolbox modules (BackgroundToolbox, NodeToolbox, EdgeToolbox, OverlayToolbox,
 * CameraToolbox, TransitionToolbox). One instance is created per mounted graph canvas; the
 * Svelte 5 bridge in GraphD3State.svelte.ts / graphD3.svelte.ts exposes it to component code.
 */
export class GraphD3 {
	data: GraphData;
	editable: boolean;

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
	data_backup: GraphData | null = null;

	/**
	 * Build a new graph canvas: formats the Prisma payload into simulation-ready data, sets up
	 * the SVG layer structure (defs/background/content/overlay), the force simulation, and
	 * zoom/pan, then snaps the camera into the requested initial view. Clears any existing
	 * content in `element` first.
	 *
	 * @param element - The `<svg>` element to render into
	 * @param payload - The raw Prisma graph payload (domains, subjects, lectures and their
	 * relations) to format and render
	 * @param editable - Whether the graph is being viewed in the authenticated editor (enables
	 * dragging/editing interactions) or the read-only public viewer
	 * @param view - Which of domains/subjects/lectures to open on
	 * @param lectureId - If provided, the lecture to focus when `view` is `lectures`
	 */
	constructor(
		element: SVGSVGElement,
		payload: PrismaGraphPayload,
		editable: boolean,
		view: GraphView = GraphView.domains,
		lectureId: number | null = null
	) {
		this.editable = editable;

		// Set zoom lock to false if editable
		if (this.editable) {
			this.zoom_lock = false;
		}

		// Format data
		this.data = this.formatPayload(payload);

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
	 * Replace the current graph data and re-render the active view. No-op while a view
	 * transition is in progress; stops any running simulation first.
	 *
	 * @param data - The new graph data to render
	 * @param animateCamera - Whether the camera should animate to the new layout (domains/
	 * subjects views only) rather than snapping instantly
	 */
	setData(data: GraphData, animateCamera: boolean) {
		if (graphState.isTransitioning()) return;
		if (graphState.isSimulating()) this.stopSimulation();

		this.data = data;

		if (graphView.isDomains()) TransitionToolbox.snapToDomains(this, animateCamera);
		else if (graphView.isSubjects()) TransitionToolbox.snapToSubjects(this, animateCamera);
		else if (graphView.isLectures()) TransitionToolbox.snapToLectures(this);

		// Save new data
		this.content.selectAll<SVGGElement, NodeData>('.node').call(NodeToolbox.save);
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
	 * Update the rendered style of a single domain node in place, without a full data refresh.
	 * Matches on the node's DOM id (`#domain-{id}`), so this affects the currently rendered
	 * element directly rather than going through `data`.
	 *
	 * @param id - The domain's id
	 * @param style - The new style, or null to clear it
	 */
	setDomainStyle(id: number, style: DomainStyle | null) {
		this.content
			.selectAll<SVGGElement, NodeData>(`#domain-${id}`)
			.each(function (node) {
				node.style = style;
			})
			.call(NodeToolbox.updateStyle);
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
	 * unless the graph is currently idle. Backs up the current data first so resetSimulation
	 * can restore it.
	 */
	startSimulation() {
		if (!graphState.isIdle()) return;

		// Copy data
		this.data_backup = structuredClone(this.data); // Deeply clone graph date before simulating

		// Release all nodes
		this.content
			.selectAll<SVGGElement, NodeData>('.node.fixed')
			.call(NodeToolbox.setFixed, this, false);

		// Excite simulation
		this.simulation.alpha(1).restart();

		graphState.toSimulating();
	}

	/**
	 * Discard the in-progress simulation and restore the data captured by startSimulation.
	 * No-op unless the graph is currently simulating.
	 *
	 * @throws If no backup data exists (should not happen if startSimulation always ran first)
	 */
	resetSimulation() {
		if (!graphState.isSimulating()) return;

		// Restore data
		if (this.data_backup) {
			this.setData(this.data_backup, true);
			this.data_backup = null;
		} else {
			throw new Error('No backup data available to reset simulation');
		}
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
			.call(NodeToolbox.save);

		// Freeze simulation
		this.simulation.stop();

		// Cleanup
		this.data_backup = null;
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

	// -----------------------------> Private methods

	/**
	 * Convert a raw Prisma graph payload into the flat, id-linked GraphData shape the D3
	 * simulation and renderers work with: domain/subject nodes get a `uuid` (prefixed to keep
	 * domain and subject ids from colliding), relations become edge objects referencing the
	 * actual node objects (not just ids), and each lecture gets its subjects partitioned into
	 * past/present/future by walking the subject edge graph outward from that lecture's subjects.
	 *
	 * @param data - The raw payload, as loaded from Prisma with domains/subjects/lectures and
	 * their relations included
	 * @returns The formatted GraphData
	 * @throws If a relation or lecture references a domain/subject id that isn't present in
	 * `data` (indicates corrupt or incomplete input data)
	 */
	private formatPayload(data: PrismaGraphPayload): GraphData {
		// NOTE: This function is a bit of a mess, but it's the best way I could think of to format the data.
		//       It would be wonderful if the prisma schema would more closely match the required format.

		const graph: GraphData = {
			domain_nodes: [],
			domain_edges: [],
			subject_nodes: [],
			subject_edges: [],
			lectures: []
		};

		// Extract domain data
		const domain_map = new Map<number, NodeData>();
		for (const domain of data.domains) {
			const node_data = {
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

		// Extract domain edge data
		for (const source of data.domains) {
			for (const target of source.targetDomains) {
				// Get source and target nodes
				const source_node = domain_map.get(source.id);
				const target_node = domain_map.get(target.id);
				if (source_node === undefined || target_node === undefined) {
					throw new Error('Invalid graph data'); // Occurs when a domain has non-existent source/target domains
				}

				// Add edge to graph
				graph.domain_edges.push({
					uuid: `domain-${source.id}-${target.id}`, // Unique edge id from source and target ids
					source: source_node,
					target: target_node
				});
			}
		}

		// Extract subject data
		const subject_map = new Map<number, NodeData>();
		for (const subject of data.subjects) {
			let domain_node = undefined;
			if (subject.domainId) {
				domain_node = domain_map.get(subject.domainId);
				if (domain_node === undefined) {
					throw new Error('Invalid graph data'); // Occurs when a subject has a non-existent domain
				}
			}

			const node_data = {
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

		// Extract subject edge data
		const forward_edge_map = new Map<number, EdgeData[]>(); // Forward and reverse edges are mapped so lectures can find…
		const reverse_edge_map = new Map<number, EdgeData[]>(); // …past and future subjects more easily

		for (const source of data.subjects) {
			for (const target of source.targetSubjects) {
				// Get source and target nodes
				const source_node = subject_map.get(source.id);
				const target_node = subject_map.get(target.id);
				if (source_node === undefined || target_node === undefined) {
					throw new Error('Invalid graph data'); // Occurs when a subject has non-existent source/target subjects
				}

				// Create edge data
				const edge = {
					uuid: `subject-${source.id}-${target.id}`, // Unique edge id from source and target ids
					source: source_node,
					target: target_node
				};

				// Update subject edge map
				const forward_edges = forward_edge_map.get(source.id) || [];
				forward_edges.push(edge);
				forward_edge_map.set(source.id, forward_edges);

				// Update reverse subject edge map
				const reverse_edges = reverse_edge_map.get(target.id) || [];
				reverse_edges.push(edge);
				reverse_edge_map.set(target.id, reverse_edges);

				// Add edge to graph and edge map
				graph.subject_edges.push(edge);
			}
		}

		// Extract lecture data
		for (const lecture of data.lectures) {
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
			for (const subject of lecture.subjects) {
				const subject_node = subject_map.get(subject.id);
				if (subject_node === undefined) throw new Error('Invalid graph data'); // Occurs when a lecture has non-existent subjects
				lecture_data.present_nodes.push(subject_node);
				lecture_data.nodes.push(subject_node);

				// Get parent domain
				if (subject_node.parent) {
					lecture_data.domains.push(subject_node.parent);
				}
			}

			// Gather past and future nodes and edges
			for (const subject of lecture.subjects) {
				// Gather past nodes and edges
				const source_edges = reverse_edge_map.get(subject.id);
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
				const target_edges = forward_edge_map.get(subject.id);
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
}
