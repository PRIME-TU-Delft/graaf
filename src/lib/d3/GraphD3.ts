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

	constructor(element: SVGSVGElement, payload: PrismaGraphPayload, editable: boolean) {
		this.editable = editable;

		// Format data
		this.data = this.formatPayload(payload);

		// SVG setup
		this.svg = d3.select<SVGSVGElement, unknown>(element).attr('display', 'block');
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

	setLecture(lecture: LectureData | null) {
		this.lecture = lecture;

		// Update lecture view
		if (graphView.isLectures()) TransitionToolbox.snapToLectures(this);

		// Update highlights
		this.content.selectAll<SVGGElement, NodeData>('.node').call(NodeToolbox.updateHighlight, this);
	}

	setDomainStyle(id: number, style: DomainStyle | null) {
		this.content
			.selectAll<SVGGElement, NodeData>(`#domain-${id}`)
			.each(function (node) {
				node.style = style;
			})
			.call(NodeToolbox.updateStyle);
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

	startSimulation() {
		if (!graphState.isIdle()) return;

		this.content
			.selectAll<SVGGElement, NodeData>('.node.fixed')
			.call(NodeToolbox.setFixed, this, false);

		this.simulation.alpha(1).restart();

		graphState.toSimulating();
	}

	stopSimulation() {
		if (!graphState.isSimulating()) return;

		this.content
			.selectAll<SVGGElement, NodeData>('.node:not(.fixed)')
			.call(NodeToolbox.setFixed, this, true)
			.call(NodeToolbox.save);

		this.simulation.stop();

		graphState.toIdle();

		this.centerOnGraph();
	}

	hasFreeNodes() {
		return this.content.selectAll<SVGGElement, NodeData>('.node:not(.fixed)').size() > 0;
	}

	centerOnGraph() {
		if (!CameraToolbox.allowZoomAndPan(this)) {
			return;
		}

		const nodes = this.content.selectAll<SVGGElement, NodeData>('.node').data();

		const transform = CameraToolbox.centralTransform(this, nodes);
		CameraToolbox.moveCamera(this, transform, () => {});
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
					uuid: 'domain-${source.id}-${target.id}', // Unique edge id from source and target ids
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
				let forward_edges = forward_edge_map.get(source.id);
				if (!forward_edges) {
					forward_edges = [];
					forward_edge_map.set(source.id, forward_edges);
				}

				forward_edges.push(edge);

				// Update reverse subject edge map
				let reverse_edges = reverse_edge_map.get(target.id);
				if (!reverse_edges) {
					reverse_edges = [];
					reverse_edge_map.set(target.id, reverse_edges);
				}

				reverse_edges.push(edge);

				// Add edge to graph and edge map
				graph.subject_edges.push(edge);
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
				if (subject_node === undefined) throw new Error('Invalid graph data'); // Occurs when a lecture has non-existent subjects
				lecture_data.present_nodes.push(subject_node);
				lecture_data.nodes.push(subject_node);

				// Get parent domain
				if (subject_node.parent) {
					lecture_data.domains.push(subject_node.parent);
				}

				// Gather past nodes and edges
				const source_edges = reverse_edge_map.get(subject.id);
				if (source_edges) {
					for (const edge of source_edges.values()) {
						lecture_data.past_nodes.push(edge.source);
						lecture_data.nodes.push(edge.source);
						lecture_data.edges.push(edge);
					}
				}

				// Gather future nodes and edges
				const target_edges = forward_edge_map.get(subject.id);
				if (target_edges) {
					for (const edge of target_edges.values()) {
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
