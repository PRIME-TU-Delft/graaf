import * as d3 from 'd3';

import * as settings from '$lib/settings';
import { GraphD3, GraphState, GraphView } from './GraphD3';

import type { NodeData, CameraTransform } from './types';

export { CameraToolbox };

// -----------------------------> Classes

class CameraToolbox {
	static allowZoomAndPan(graph: GraphD3, event?: d3.D3ZoomEvent<SVGSVGElement, unknown>): boolean {
		return (
			(graph.view === GraphView.domains || graph.view === GraphView.subjects) &&
			(graph.state === GraphState.idle || graph.state === GraphState.simulating) &&
			(event === undefined || event.type !== 'wheel' || !graph.zoom_lock || graph.keys.Shift)
		);
	}

	static centralTransform(graph: GraphD3, nodes: NodeData[]): CameraTransform {
		if (nodes.length === 0) {
			return { x: 0, y: 0, k: 1 };
		}

		let min_x = Infinity;
		let min_y = Infinity;
		let max_x = -Infinity;
		let max_y = -Infinity;

		for (const node of nodes) {
			min_x = Math.min(min_x, node.x - settings.NODE_MARGIN);
			min_y = Math.min(min_y, node.y - settings.NODE_MARGIN);
			max_x = Math.max(max_x, node.x + settings.NODE_WIDTH + settings.NODE_MARGIN);
			max_y = Math.max(max_y, node.y + settings.NODE_HEIGHT + settings.NODE_MARGIN);
		}

		min_x -= settings.GRID_PADDING;
		min_y -= settings.GRID_PADDING;
		max_x += settings.GRID_PADDING;
		max_y += settings.GRID_PADDING;

		return {
			x: (max_x + min_x) / 2,
			y: (max_y + min_y) / 2,
			k: Math.max(
				settings.MIN_ZOOM,
				Math.min(
					settings.MAX_ZOOM,
					graph.svg.node()!.clientWidth / ((max_x - min_x) * settings.GRID_UNIT),
					graph.svg.node()!.clientHeight / ((max_y - min_y) * settings.GRID_UNIT)
				)
			)
		};
	}

	static moveCamera(graph: GraphD3, transform: CameraTransform, callback?: () => void) {
		graph.svg
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.ease(d3.easeSinInOut)
			.call(
				graph.zoom.transform,
				d3.zoomIdentity
					.translate(
						graph.svg.node()!.clientWidth / 2 - transform.k * transform.x * settings.GRID_UNIT,
						graph.svg.node()!.clientHeight / 2 - transform.k * transform.y * settings.GRID_UNIT
					)
					.scale(transform.k)
			);

		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	static panCamera(graph: GraphD3, x: number, y: number, callback?: () => void) {
		graph.svg
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.ease(d3.easeSinInOut)
			.call(graph.zoom.translateTo, x * settings.GRID_UNIT, y * settings.GRID_UNIT);

		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	static zoomCamera(graph: GraphD3, k: number, callback?: () => void) {
		graph.svg
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.ease(d3.easeSinInOut)
			.call(graph.zoom.scaleTo, k);

		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}
}
