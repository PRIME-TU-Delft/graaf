import * as d3 from 'd3';

import * as settings from '$lib/settings';
import { BackgroundToolbox } from './BackgroundToolbox';
import { CameraToolbox } from './CameraToolbox';
import { EdgeToolbox } from './EdgeToolbox';
import { NodeToolbox } from './NodeToolbox';
import { OverlayToolbox } from './OverlayToolbox';

import type {
	GraphData,
	NodeData,
	EdgeData,
	LectureData,
	PrismaGraphPayload,
	PrismaSubjectPayload,
	SVGSelection,
	GroupSelection,
	DefsSelection
} from './types';

export { GraphD3, GraphState, GraphView };

// -----------------------------> Enums

enum GraphState {
	detached,
	transitioning,
	simulating,
	idle
}

enum GraphView {
	domains,
	subjects,
	lectures
}

// -----------------------------> Classes

class GraphD3 {
	public graph_data: GraphData;
	public editable: boolean;
	public zoom_lock: boolean = true;	

	// Internal state
	private _state: GraphState = GraphState.detached;
	private _view: GraphView = GraphView.domains;
	private _lecture: LectureData | null = null;
	private _keys: { [key: string]: boolean } = {};

	// D3
	private _svg?: SVGSelection;
	private _background?: GroupSelection;
	private _content?: GroupSelection;
	private _overlay?: GroupSelection;
	private _definitions?: DefsSelection;

	private _simulation?: d3.Simulation<NodeData, EdgeData>;
	private _zoom?: d3.ZoomBehavior<SVGSVGElement, unknown>;

	constructor(data: PrismaGraphPayload, editable: boolean) {
		this.graph_data = this.formatPayload(data);
		this.editable = editable;
	}

	// -----------------------------> Getters & Setters

	get state() {
		return this._state;
	}
	private set state(value) {
		this._state = value;
	}

	get view() {
		return this._view;
	}
	private set view(value) {
		this._view = value;
	}

	get lecture() {
		return this._lecture;
	}
	private set lecture(value) {
		this._lecture = value;
	}

	get keys() {
		return this._keys;
	}
	private set keys(value) {
		this._keys = value;
	}

	get svg() {
		if (this._svg === undefined) throw new Error('GraphD3 is detached from dom');
		return this._svg;
	}

	private set svg(value) {
		this._svg = value;
	}

	get definitions() {
		if (this._definitions === undefined) throw new Error('GraphD3 is detached from dom');
		return this._definitions;
	}

	private set definitions(value) {
		this._definitions = value;
	}

	get background() {
		if (this._background === undefined) throw new Error('GraphD3 is detached from dom');
		return this._background;
	}

	private set background(value) {
		this._background = value;
	}

	get content() {
		if (this._content === undefined) throw new Error('GraphD3 is detached from dom');
		return this._content;
	}

	private set content(value) {
		this._content = value;
	}

	get overlay() {
		if (this._overlay === undefined) throw new Error('GraphD3 is detached from dom');
		return this._overlay;
	}

	private set overlay(value) {
		this._overlay = value;
	}

	get simulation() {
		if (this._simulation === undefined) throw new Error('GraphD3 is detached from dom');
		return this._simulation;
	}

	private set simulation(value) {
		this._simulation = value;
	}

	get zoom() {
		if (this._zoom === undefined) throw new Error('GraphD3 is detached from dom');
		return this._zoom;
	}

	private set zoom(value) {
		this._zoom = value;
	}

	// -----------------------------> Public methods

	attach(element: SVGSVGElement) {
		// Check if already attached
		if (this.state !== GraphState.detached) {
			throw new Error('GraphD3 already attached to DOM');
		}

		// SVG setup
		this.svg = d3.select<SVGSVGElement, unknown>(element).attr('display', 'block');

		// Clear SVG
		this.svg.selectAll('*').remove();

		// Set up SVG components - order is important!
		this.background = this.svg.append('g').attr('id', 'background');
		this.content = this.svg.append('g').attr('id', 'content');
		this.overlay = this.svg.append('g').attr('id', 'overlay');
		this.definitions = this.svg.append('defs');

		// Toolbox setup - mainly adds definitions
		BackgroundToolbox.init(this);
		NodeToolbox.init(this);
		EdgeToolbox.init(this);

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
				this.content.attr('transform', event.transform);
				BackgroundToolbox.transformGrid(this, event.transform);
			});

		// Attach event listeners
		d3.select(document)
			.on('keydown', (event) => (this.keys[event.key] = true))
			.on('keyup', (event) => (this.keys[event.key] = false))

		this.svg
			.call(this.zoom)
			.on('dblclick.zoom', null)
			.on('wheel', () => {
				if (
					(this.view === GraphView.domains || this.view === GraphView.subjects) &&
					(this.state === GraphState.idle || this.state === GraphState.simulating) &&
					this.zoom_lock &&
					!this.keys.Shift
				) {
					OverlayToolbox.zoom(this);
				}
			});

		// Enter initial view
		switch (this.view) {
			case GraphView.domains:
				this.snapToDomains();
				break;
			case GraphView.subjects:
				this.snapToSubjects();
				break;
			case GraphView.lectures:
				this.snapToLectures();
				break;
		}
	}

	detach() {
		// Check if already detached
		if (this.state === GraphState.detached) {
			throw new Error('GraphD3 already detached from DOM');
		}

		// Clear SVG
		this.svg.selectAll('*').remove();

		// Reset properties
		this._svg = undefined;
		this._definitions = undefined;
		this._background = undefined;
		this._content = undefined;
		this._overlay = undefined;
		this._simulation = undefined;
		this._zoom = undefined;

		// Update state
		this.state = GraphState.detached;
	}

	setView(view: GraphView) {
		switch (this.state) {
			case GraphState.idle:
				break;

			case GraphState.simulating:
				this.stopSimulation();
				break;

			case GraphState.transitioning:
				return;

			case GraphState.detached:
				this.view = view;
				return;
		}

		switch (this.view) {
			case GraphView.domains:
				if (view === GraphView.subjects) {
					this.domainsToSubjects();
				} else if (view === GraphView.lectures) {
					this.domainsToLectures();
				}
				break;

			case GraphView.subjects:
				if (view === GraphView.domains) {
					this.subjectsToDomains();
				} else if (view === GraphView.lectures) {
					this.subjectsToLectures();
				}
				break;

			case GraphView.lectures:
				if (view === GraphView.domains) {
					this.lecturesToDomains();
				} else if (view === GraphView.subjects) {
					this.lecturesToSubjects();
				}
				break;
		}
	}

	setLecture(lecture: LectureData | null) {
		this.lecture = lecture;

		// Update lecture view
		if (this.view === GraphView.lectures) {
			this.snapToLectures();
		}

		// Update highlights
		this.content.selectAll<SVGGElement, NodeData>('.node').call(NodeToolbox.updateHighlight, this);
	}

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

	centerOnGraph() {
		if (!CameraToolbox.allowZoomAndPan(this)) {
			return;
		}

		const nodes = this.content.selectAll<SVGGElement, NodeData>('.node').data();

		const transform = CameraToolbox.centralTransform(this, nodes);
		CameraToolbox.moveCamera(this, transform, () => {});
	}

	startSimulation() {
		if (this.state !== GraphState.idle) {
			return;
		}

		this.content
			.selectAll<SVGGElement, NodeData>('.node.fixed')
			.call(NodeToolbox.setFixed, this, false);

		this.simulation.alpha(1).restart();

		this.state = GraphState.simulating;
	}

	stopSimulation() {
		if (this.state !== GraphState.simulating) {
			return;
		}

		this.content
			.selectAll<SVGGElement, NodeData>('.node:not(.fixed)')
			.call(NodeToolbox.setFixed, this, true)
			.call(NodeToolbox.save);

		this.simulation.stop();
		this.state = GraphState.idle;
	}

	hasFreeNodes() {
		return this.content.selectAll<SVGGElement, NodeData>('.node:not(.fixed)').size() > 0;
	}

	// -----------------------------> Private methods

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
			if (domain.style === null) continue; // Do not display domains without style

			const node_data = {
				id: 'domain-' + domain.id, // Prefix to avoid id conflicts between domains and subjects
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
				if (source_node === undefined || target_node === undefined) continue; // Skip edges with invalid domains

				// Add edge to graph
				graph.domain_edges.push({
					id: `domain-${source.id}-${target.id}`, // Unique edge id from source and target ids
					source: source_node,
					target: target_node
				});
			}
		}

		// Extract subject data
		const detail_map = new Map<number, PrismaSubjectPayload>();
		const subject_map = new Map<number, NodeData>();
		for (const subject of data.subjects) {
			if (subject.domainId === null) continue; // Skip subjects without a parent domain
			const domain = domain_map.get(subject.domainId);
			if (domain === undefined) continue; // Skip subjects with invalid parent domains

			const node_data = {
				id: 'subject-' + subject.id, // Prefix to avoid id conflicts between domains and subjects
				style: domain.style,
				text: subject.name,
				x: subject.x,
				y: subject.y,
				fx: subject.x,
				fy: subject.y,
				parent: domain
			};

			detail_map.set(subject.id, subject);
			subject_map.set(subject.id, node_data);
			graph.subject_nodes.push(node_data);
		}

		// Extract subject edge data
		const subject_edge_map = new Map<number, Map<number, EdgeData>>();
		for (const source of data.subjects) {
			for (const target of source.targetSubjects) {

				// Get source and target nodes
				const source_node = subject_map.get(source.id);
				const target_node = subject_map.get(target.id);
				if (source_node === undefined || target_node === undefined) continue; // Skip edges with invalid subjects

				// Create edge data
				const edge = {
					id: `subject-${source.id}-${target.id}`, // Unique edge id from source and target ids
					source: source_node,
					target: target_node
				}

				// Update subject edge map
				let nested_map = subject_edge_map.get(source.id);
				if (nested_map === undefined) {
					nested_map = new Map<number, EdgeData>();
					subject_edge_map.set(source.id, nested_map);
				}

				// Add edge to graph and edge map
				graph.subject_edges.push(edge);
				nested_map.set(target.id, edge);
			}
		}

		// Extract lecture data
		for (const lecture of data.lectures) {
			const lecture_data: LectureData = {
				past_nodes: [],
				present_nodes: [],
				future_nodes: [],
				domains: [],
				nodes: [],
				edges: []
			};

			for (const subject of lecture.subjects) {

				// Get subject node
				const subject_node = subject_map.get(subject.id);
				if (subject_node === undefined) continue; // Skip invalid subjects

				// Get parent domain
				if (subject.domainId === null) continue; // Skip subjects without parent domain
				const domain_node = domain_map.get(subject.domainId);
				if (domain_node === undefined) continue; // Skip subjects with invalid parent domain

				lecture_data.present_nodes.push(subject_node);
				lecture_data.domains.push(domain_node);
				lecture_data.nodes.push(subject_node);

				// Get subject details
				const details = detail_map.get(subject.id);
				if (details === undefined) throw new Error('Invalid graph data');

				// Gather past nodes and edges
				for (const source of details.sourceSubjects) {
					const source_node = subject_map.get(source.id);
					if (source_node === undefined || lecture_data.past_nodes.includes(source_node)) {
						continue; // Skip invalid or duplicate subjects
					}

					// Find edge data
					const edge = subject_edge_map.get(source.id)?.get(subject.id);
					if (edge === undefined) continue; // Skip edges with invalid subjects

					lecture_data.past_nodes.push(source_node);
					lecture_data.nodes.push(source_node);
					lecture_data.edges.push(edge);
				}

				// Gather future nodes and edges
				for (const target of details.targetSubjects) {
					const target_node = subject_map.get(target.id);
					if (target_node === undefined || lecture_data.past_nodes.includes(target_node)) {
						continue; // Skip invalid or duplicate subjects
					}

					// Find edge data
					const edge = subject_edge_map.get(subject.id)?.get(target.id);
					if (edge === undefined) continue; // Skip edges with invalid subjects

					lecture_data.future_nodes.push(target_node);
					lecture_data.nodes.push(target_node);
					lecture_data.edges.push(edge);
				}
			}

			graph.lectures.push(lecture_data);
		}

		return graph;
	}

	private clearContent(callback?: () => void) {
		this.content
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

	private setContent(nodes: NodeData[], edges: EdgeData[], callback?: () => void) {
		if (nodes.length + edges.length === 0) {
			this.clearContent(callback);
			return;
		}

		const graphD3 = this; // Ref to graphD3 for toolbox callbacks

		// Update Nodes
		this.content
			.selectAll<SVGGElement, NodeData>('.node')
			.data(nodes, (node) => node.id)
			.join(
				function (enter) {
					return enter
						.append('g')
						.call(NodeToolbox.create, graphD3)
						.call(NodeToolbox.updateHighlight, graphD3)
						.style('opacity', 0);
				},

				function (update) {
					return update.call(NodeToolbox.updateHighlight, graphD3);
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
		this.content
			.selectAll<SVGGElement, EdgeData>('.edge')
			.data(edges, (edge) => edge.id)
			.join(
				function (enter) {
					return enter.append('line').call(EdgeToolbox.create).style('opacity', 0);
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
		this.simulation.nodes(nodes).force('link', d3.forceLink(edges));

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	private moveContent(
		nodes: NodeData[],
		transform: (node: NodeData) => void,
		callback?: () => void
	) {
		// Buffer node positions
		const buffers = nodes.map((node) => ({ node, x: node.x, y: node.y }));

		// Set node positions
		nodes.forEach(transform);

		// Update nodes
		this.content
			.selectAll<SVGGElement, NodeData>('.node')
			.call(NodeToolbox.updatePosition, this, callback !== undefined);

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

	private restoreContentPosition(callback?: () => void) {
		// Update nodes
		this.content
			.selectAll<SVGGElement, NodeData>('.node')
			.call(NodeToolbox.updatePosition, this, callback !== undefined);

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	// -----------------------------> Transformations

	private domainTransform(node: NodeData): void {
		node.x = node.parent ? node.parent.x : node.x;
		node.y = node.parent ? node.parent.y : node.y;
	}

	private lectureTransform(x: number, y: number): (node: NodeData) => void {
		const past = this.lecture ? this.lecture.past_nodes : [];
		const present = this.lecture ? this.lecture.present_nodes : [];
		const future = this.lecture ? this.lecture.future_nodes : [];

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

	private snapToDomains() {
		this.state = GraphState.transitioning;

		// Set camera pov and background
		const transform = CameraToolbox.centralTransform(this, this.graph_data.domain_nodes);
		CameraToolbox.moveCamera(this, transform);
		BackgroundToolbox.grid(this);

		// Set content
		this.setContent(this.graph_data.domain_nodes, this.graph_data.domain_edges);
		this.restoreContentPosition();

		// Cleanup
		this.state = GraphState.idle;
		this.view = GraphView.domains;
	}

	private snapToSubjects() {
		this.state = GraphState.transitioning;

		// Set camera pov and background
		const transform = CameraToolbox.centralTransform(this, this.graph_data.subject_nodes);
		CameraToolbox.moveCamera(this, transform);
		BackgroundToolbox.grid(this);

		// Set content
		this.setContent(this.graph_data.subject_nodes, this.graph_data.subject_edges);
		this.restoreContentPosition();

		// Cleanup
		this.state = GraphState.idle;
		this.view = GraphView.subjects;
	}

	private snapToLectures() {
		this.state = GraphState.transitioning;

		// Set camera pov and background
		CameraToolbox.moveCamera(this, { x: 0, y: 0, k: 1 });
		BackgroundToolbox.lecture(this);

		// Set content
		const nodes = this.lecture ? this.lecture.nodes : [];
		const edges = this.lecture ? this.lecture.edges : [];
		this.setContent(nodes, edges);
		this.moveContent(nodes, this.lectureTransform(0, 0));

		// Cleanup
		this.state = GraphState.idle;
		this.view = GraphView.lectures;
	}

	private domainsToSubjects() {
		this.state = GraphState.transitioning;

		// Transition camera to new pov
		const transform = CameraToolbox.centralTransform(this, this.graph_data.subject_nodes);
		CameraToolbox.moveCamera(this, transform, () => {});

		// Set new content to domain positions
		this.setContent(this.graph_data.subject_nodes, this.graph_data.subject_edges);
		this.moveContent(this.graph_data.subject_nodes, this.domainTransform);

		// Transition content to original positions
		this.restoreContentPosition(() => {
			// Cleanup
			this.state = GraphState.idle;
			this.view = GraphView.subjects;
		});
	}

	private domainsToLectures() {
		// Validate lecture
		if (this.lecture === null) {
			this.snapToLectures();
			return;
		}

		this.state = GraphState.transitioning;

		// Transition to new camera pov - centered on the current graph for minimal movement
		const transform = CameraToolbox.centralTransform(this, this.graph_data.domain_nodes);
		CameraToolbox.moveCamera(this, { ...transform, k: 1 }, () => {});

		// Set new content in domain positions
		this.setContent(this.lecture.nodes, this.lecture.edges);
		this.moveContent(this.lecture.nodes, this.domainTransform);

		// Transition content to lecture positions, then update background
		this.moveContent(this.lecture.nodes, this.lectureTransform(transform.x, transform.y), () => {
			BackgroundToolbox.lecture(this);

			// Cleanup
			this.state = GraphState.idle;
			this.view = GraphView.lectures;
		});
	}

	private subjectsToDomains() {
		this.state = GraphState.transitioning;

		// Transition to new camera pov
		const transform = CameraToolbox.centralTransform(this, this.graph_data.domain_nodes);
		CameraToolbox.moveCamera(this, transform, () => {});

		// Move content to domain positions, then fade in new content
		this.moveContent(this.graph_data.subject_nodes, this.domainTransform, () => {
			this.setContent(this.graph_data.domain_nodes, this.graph_data.domain_edges, () => {
				// Cleanup
				this.state = GraphState.idle;
				this.view = GraphView.domains;
			});
		});
	}

	private subjectsToLectures() {
		// Validate lecture
		if (this.lecture === null) {
			this.snapToLectures();
			return;
		}

		this.state = GraphState.transitioning;
		const lecture = this.lecture; // Ref to lecture for future callbacks

		// Transition to new camera pov - centered on the current graph for minimal movement
		const transform = CameraToolbox.centralTransform(this, this.graph_data.subject_nodes);
		CameraToolbox.moveCamera(this, { ...transform, k: 1 }, () => {});

		// Fade in new content, then move to lecture positions, then update background
		this.setContent(lecture.nodes, lecture.edges, () => {
			this.moveContent(lecture.nodes, this.lectureTransform(transform.x, transform.y), () => {
				BackgroundToolbox.lecture(this);

				// Cleanup
				this.state = GraphState.idle;
				this.view = GraphView.lectures;
			});
		});
	}

	private lecturesToDomains() {
		// Validate lecture
		if (this.lecture === null) {
			this.snapToDomains();
			return;
		}

		this.state = GraphState.transitioning;

		// Snap camera and content to new pov - as the camera might be at (0, 0) at this time
		const transform = CameraToolbox.centralTransform(this, this.graph_data.domain_nodes);
		CameraToolbox.panCamera(this, transform.x, transform.y);
		this.moveContent(this.lecture.nodes, this.lectureTransform(transform.x, transform.y));

		// Update background and zoom out to new pov
		BackgroundToolbox.grid(this);
		CameraToolbox.zoomCamera(this, transform.k, () => {});

		// Transition content to domain positions, then fade in new content
		this.moveContent(this.lecture.nodes, this.domainTransform, () => {
			this.setContent(this.graph_data.domain_nodes, this.graph_data.domain_edges, () => {
				// Cleanup
				this.state = GraphState.idle;
				this.view = GraphView.domains;
			});
		});
	}

	private lecturesToSubjects() {
		// Validate lecture
		if (this.lecture === null) {
			this.snapToSubjects();
			return;
		}

		this.state = GraphState.transitioning;

		// Snap camera and content to new pov - as the camera might be at (0, 0) at this time
		const transform = CameraToolbox.centralTransform(this, this.graph_data.subject_nodes);
		CameraToolbox.panCamera(this, transform.x, transform.y);
		this.moveContent(this.lecture.nodes, this.lectureTransform(transform.x, transform.y));

		// Set new background and zoom out to new pov
		BackgroundToolbox.grid(this);
		CameraToolbox.zoomCamera(this, transform.k, () => {});

		// Transition content to original positions, then fade in new content
		this.restoreContentPosition(() => {
			this.setContent(this.graph_data.subject_nodes, this.graph_data.subject_edges, () => {
				// Cleanup
				this.state = GraphState.idle;
				this.view = GraphView.subjects;
			});
		});
	}
}
