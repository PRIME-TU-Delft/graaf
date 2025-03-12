import * as d3 from 'd3';

import * as settings from '$lib/settings';
import { BackgroundToolbox } from './BackgroundToolbox';
import { CameraToolbox } from './CameraToolbox';
import { NodeToolbox } from './NodeToolbox';

import { EdgeToolbox } from './EdgeToolbox';
import { GraphD3 } from './GraphD3';
import { graphState } from './GraphD3State.svelte';
import type { DefsSelection, EdgeData, GroupSelection, NodeData, SVGSelection } from './types';

export class D3 {
	graph: GraphD3;

	svg: SVGSelection;
	background: GroupSelection;
	content: GroupSelection;
	overlay: GroupSelection;
	definitions: DefsSelection;

	simulation: d3.Simulation<NodeData, EdgeData>;
	zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;

	zoom_lock = true;

	constructor(element: SVGSVGElement, graph: GraphD3) {
		this.graph = graph;

		// SVG setup
		this.svg = d3.select<SVGSVGElement, unknown>(element).attr('display', 'block');
		this.svg.selectAll('*').remove(); // Clear SVG

		// Set up SVG components - order is important!
		this.background = this.svg.append('g').attr('id', 'background');
		this.content = this.svg.append('g').attr('id', 'content');
		this.overlay = this.svg.append('g').attr('id', 'overlay');
		this.definitions = this.svg.append('defs');

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
			.filter((event) => CameraToolbox.allowZoomAndPan(graph, event))
			.on('zoom', (event) => {
				this.content.attr('transform', event.transform);
				BackgroundToolbox.transformGrid(this, event.transform);
			});

		// Toolbox setup - mainly adds definitions
		BackgroundToolbox.init(this);
		NodeToolbox.init(this);
		EdgeToolbox.init(this);
	}

	zoomIn(graphD3: GraphD3) {
		if (!CameraToolbox.allowZoomAndPan(graphD3)) {
			return;
		}

		this.svg
			.transition()
			.duration(settings.GRAPH_ANIMATION_DURATION)
			.ease(d3.easeSinInOut)
			.call(this.zoom.scaleBy, settings.ZOOM_STEP);
	}

	zoomOut(graphD3: GraphD3) {
		if (!CameraToolbox.allowZoomAndPan(graphD3)) {
			return;
		}

		this.svg
			.transition()
			.duration(settings.GRAPH_ANIMATION_DURATION)
			.ease(d3.easeSinInOut)
			.call(this.zoom.scaleBy, 1 / settings.ZOOM_STEP);
	}

	clearContent(callback?: () => void) {
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

	startSimulation() {
		if (graphState.isIdle()) return;

		this.content
			.selectAll<SVGGElement, NodeData>('.node.fixed')
			.call(NodeToolbox.setFixed, this, false);

		this.simulation.alpha(1).restart();

		graphState.toSimulating();
	}

	stopSimulation() {
		if (graphState.isSimulating()) return;

		this.content
			.selectAll<SVGGElement, NodeData>('.node:not(.fixed)')
			.call(NodeToolbox.setFixed, this, true)
			.call(NodeToolbox.save);

		this.simulation.stop();

		graphState.toIdle();
	}

	hasFreeNodes() {
		return this.content.selectAll<SVGGElement, NodeData>('.node:not(.fixed)').size() > 0;
	}

	centerOnGraph(graphD3: GraphD3) {
		if (!CameraToolbox.allowZoomAndPan(graphD3)) {
			return;
		}

		const nodes = this.content.selectAll<SVGGElement, NodeData>('.node').data();

		const transform = CameraToolbox.centralTransform(this, nodes);
		CameraToolbox.moveCamera(this, transform, () => {});
	}
}
