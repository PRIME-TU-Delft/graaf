import * as settings from '$lib/settings';
import { BackgroundToolbox } from './BackgroundToolbox';
import { CameraToolbox } from './CameraToolbox';
import { D3 } from './D3';
import { EdgeToolbox } from './EdgeToolbox';
import { NodeToolbox } from './NodeToolbox';
import { OverlayToolbox } from './OverlayToolbox';

import { graphState } from './GraphD3State.svelte';
import { GraphView, graphView } from './GraphD3View.svelte';
import type {
	EdgeData,
	GraphData,
	LectureData,
	NodeData,
	PrismaGraphPayload,
	PrismaSubjectPayload
} from './types';
import { forceLink, select } from 'd3';

// -----------------------------> Classes

export class GraphD3 {
	public graph_data: GraphData;
	public editable: boolean;

	// Internal state
	lecture: LectureData | null = null;
	keys: Record<string, boolean> = {};

	// D3
	readonly d3: D3;

	constructor(data: PrismaGraphPayload, editable: boolean, element: SVGSVGElement) {
		this.graph_data = this.formatPayload(data);
		this.editable = editable;

		this.d3 = new D3(element, this);

		// Attach event listeners
		select(this.d3.svg.node()!)
			.on('keydown', (event) => (this.keys[event.key] = true))
			.on('keyup', (event) => (this.keys[event.key] = false));

		this.d3.svg
			.call(this.d3.zoom)
			.on('dblclick.zoom', null)
			.on('wheel', () => {
				if (
					(graphView.isDomains() || graphView.isSubjects()) &&
					(graphState.isIdle() || graphState.isSimulating()) &&
					this.d3.zoom_lock &&
					!this.keys.Shift
				) {
					OverlayToolbox.zoom(this.d3);
				}
			});

		// Enter initial view
		if (graphView.isDomains()) this.snapToDomains();
		else if (graphView.isSubjects()) this.snapToSubjects();
		else if (graphView.isLectures()) this.snapToLectures();
	}

	// -----------------------------> Public methods

	setView(toView: GraphView) {
		if (graphState.isTransitioning()) return;
		if (graphState.isSimulating()) this.d3.stopSimulation();

		switch (graphView.state) {
			case GraphView.domains:
				if (toView === GraphView.subjects) {
					this.domainsToSubjects();
				} else if (toView === GraphView.lectures) {
					this.domainsToLectures();
				}
				break;

			case GraphView.subjects:
				if (toView === GraphView.domains) {
					this.subjectsToDomains();
				} else if (toView === GraphView.lectures) {
					this.subjectsToLectures();
				}
				break;

			case GraphView.lectures:
				if (toView === GraphView.domains) {
					this.lecturesToDomains();
				} else if (toView === GraphView.subjects) {
					this.lecturesToSubjects();
				}
				break;
		}
	}

	setLecture(lecture: LectureData | null) {
		this.lecture = lecture;

		// Update lecture view
		if (graphView.isLectures()) this.snapToLectures();

		// Update highlights
		this.d3.content
			.selectAll<SVGGElement, NodeData>('.node')
			.call(NodeToolbox.updateHighlight, this);
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
				};

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

	private setContent(nodes: NodeData[], edges: EdgeData[], callback?: () => void) {
		if (nodes.length + edges.length === 0) return this.d3.clearContent(callback);

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const graphD3 = this;

		// Update Nodes
		this.d3.content
			.selectAll<SVGGElement, NodeData>('.node')
			.data(nodes, (node) => node.id)
			.join(
				function (enter) {
					return enter
						.append('g')
						.call(NodeToolbox.create, graphD3.d3)
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
							select(this).remove();
						}) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0);
				}
			)
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.style('opacity', 1);

		// Update relations
		this.d3.content
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
							select(this).remove();
						}) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0);
				}
			)
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.style('opacity', 1);

		// Update simulation
		this.d3.simulation.nodes(nodes).force('link', forceLink(edges));

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
		this.d3.content
			.selectAll<SVGGElement, NodeData>('.node')
			.call(NodeToolbox.updatePosition, this.d3, callback !== undefined);

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
		this.d3.content
			.selectAll<SVGGElement, NodeData>('.node')
			.call(NodeToolbox.updatePosition, this.d3, callback !== undefined);

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
		graphState.toTransitioning();

		// Set camera pov and background
		const transform = CameraToolbox.centralTransform(this.d3, this.graph_data.domain_nodes);
		CameraToolbox.moveCamera(this.d3, transform);
		BackgroundToolbox.grid(this.d3);

		// Set content
		this.setContent(this.graph_data.domain_nodes, this.graph_data.domain_edges);
		this.restoreContentPosition();

		// Cleanup
		graphState.toIdle();
		graphView.toDomains();
	}

	private snapToSubjects() {
		graphState.toTransitioning();

		// Set camera pov and background
		const transform = CameraToolbox.centralTransform(this.d3, this.graph_data.subject_nodes);
		CameraToolbox.moveCamera(this.d3, transform);
		BackgroundToolbox.grid(this.d3);

		// Set content
		this.setContent(this.graph_data.subject_nodes, this.graph_data.subject_edges);
		this.restoreContentPosition();

		// Cleanup
		graphState.toIdle();
		graphView.toSubjects();
	}

	private snapToLectures() {
		graphState.toTransitioning();

		// Set camera pov and background
		CameraToolbox.moveCamera(this.d3, { x: 0, y: 0, k: 1 });
		BackgroundToolbox.lecture(this.d3, this);

		// Set content
		const nodes = this.lecture ? this.lecture.nodes : [];
		const edges = this.lecture ? this.lecture.edges : [];
		this.setContent(nodes, edges);
		this.moveContent(nodes, this.lectureTransform(0, 0));

		// Cleanup
		graphState.toIdle();
		graphView.toLectures();
	}

	private domainsToSubjects() {
		graphState.toTransitioning();

		// Transition camera to new pov
		const transform = CameraToolbox.centralTransform(this.d3, this.graph_data.subject_nodes);
		CameraToolbox.moveCamera(this.d3, transform, () => {});

		// Set new content to domain positions
		this.setContent(this.graph_data.subject_nodes, this.graph_data.subject_edges);
		this.moveContent(this.graph_data.subject_nodes, this.domainTransform);

		// Transition content to original positions
		this.restoreContentPosition(() => {
			// Cleanup
			graphState.toIdle();
			graphView.toSubjects();
		});
	}

	private domainsToLectures() {
		// Validate lecture
		if (this.lecture === null) {
			this.snapToLectures();
			return;
		}

		graphState.toTransitioning();

		// Transition to new camera pov - centered on the current graph for minimal movement
		const transform = CameraToolbox.centralTransform(this.d3, this.graph_data.domain_nodes);
		CameraToolbox.moveCamera(this.d3, { ...transform, k: 1 }, () => {});

		// Set new content in domain positions
		this.setContent(this.lecture.nodes, this.lecture.edges);
		this.moveContent(this.lecture.nodes, this.domainTransform);

		// Transition content to lecture positions, then update background
		this.moveContent(this.lecture.nodes, this.lectureTransform(transform.x, transform.y), () => {
			BackgroundToolbox.lecture(this.d3, this);

			// Cleanup
			graphState.toIdle();
			graphView.toLectures();
		});
	}

	private subjectsToDomains() {
		graphState.toTransitioning();

		// Transition to new camera pov
		const transform = CameraToolbox.centralTransform(this.d3, this.graph_data.domain_nodes);
		CameraToolbox.moveCamera(this.d3, transform);

		// Move content to domain positions, then fade in new content
		this.moveContent(this.graph_data.subject_nodes, this.domainTransform, () => {
			this.setContent(this.graph_data.domain_nodes, this.graph_data.domain_edges, () => {
				// Cleanup
				graphState.toIdle();
				graphView.toDomains();
			});
		});
	}

	private subjectsToLectures() {
		// Validate lecture
		if (this.lecture === null) {
			this.snapToLectures();
			return;
		}

		graphState.toTransitioning();
		const lecture = this.lecture; // Ref to lecture for future callbacks

		// Transition to new camera pov - centered on the current graph for minimal movement
		const transform = CameraToolbox.centralTransform(this.d3, this.graph_data.subject_nodes);
		CameraToolbox.moveCamera(this.d3, { ...transform, k: 1 }, () => {});

		// Fade in new content, then move to lecture positions, then update background
		this.setContent(lecture.nodes, lecture.edges, () => {
			this.moveContent(lecture.nodes, this.lectureTransform(transform.x, transform.y), () => {
				BackgroundToolbox.lecture(this.d3, this);

				// Cleanup
				graphState.toIdle();
				graphView.toLectures();
			});
		});
	}

	private lecturesToDomains() {
		// Validate lecture
		if (this.lecture === null) {
			this.snapToDomains();
			return;
		}

		graphState.toTransitioning();

		// Snap camera and content to new pov - as the camera might be at (0, 0) at this time
		const transform = CameraToolbox.centralTransform(this.d3, this.graph_data.domain_nodes);
		CameraToolbox.panCamera(this.d3, transform.x, transform.y);
		this.moveContent(this.lecture.nodes, this.lectureTransform(transform.x, transform.y));

		// Update background and zoom out to new pov
		BackgroundToolbox.grid(this.d3);
		CameraToolbox.zoomCamera(this.d3, transform.k, () => {});

		// Transition content to domain positions, then fade in new content
		this.moveContent(this.lecture.nodes, this.domainTransform, () => {
			this.setContent(this.graph_data.domain_nodes, this.graph_data.domain_edges, () => {
				// Cleanup
				graphState.toIdle();
				graphView.toDomains();
			});
		});
	}

	private lecturesToSubjects() {
		// Validate lecture
		if (this.lecture === null) {
			this.snapToSubjects();
			return;
		}

		graphState.toTransitioning();

		// Snap camera and content to new pov - as the camera might be at (0, 0) at this time
		const transform = CameraToolbox.centralTransform(this.d3, this.graph_data.subject_nodes);
		CameraToolbox.panCamera(this.d3, transform.x, transform.y);
		this.moveContent(this.lecture.nodes, this.lectureTransform(transform.x, transform.y));

		// Set new background and zoom out to new pov
		BackgroundToolbox.grid(this.d3);
		CameraToolbox.zoomCamera(this.d3, transform.k, () => {});

		// Transition content to original positions, then fade in new content
		this.restoreContentPosition(() => {
			this.setContent(this.graph_data.subject_nodes, this.graph_data.subject_edges, () => {
				// Cleanup
				graphState.toIdle();
				graphView.toSubjects();
			});
		});
	}
}
