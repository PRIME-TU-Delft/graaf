import * as settings from '$lib/settings';
import { easeSinInOut, zoomIdentity } from 'd3';
import type { D3 } from './D3';
import { GraphD3 } from './GraphD3';
import { graphState } from './GraphD3State.svelte';
import { graphView } from './GraphD3View.svelte';
import type { CameraTransform, NodeData } from './types';

export class CameraToolbox {
	static allowZoomAndPan(graph: GraphD3, event?: d3.D3ZoomEvent<SVGSVGElement, unknown>): boolean {
		return (
			(graphView.isDomains() || graphView.isSubjects()) &&
			(graphState.isIdle() || graphState.isSimulating()) &&
			(event === undefined || event.type !== 'wheel' || !graph.d3.zoom_lock || graph.keys.Shift)
		);
	}

	static centralTransform(d3: D3, nodes: NodeData[]): CameraTransform {
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
					d3.svg.node()!.clientWidth / ((max_x - min_x) * settings.GRID_UNIT),
					d3.svg.node()!.clientHeight / ((max_y - min_y) * settings.GRID_UNIT)
				)
			)
		};
	}

	static moveCamera(d3: D3, transform: CameraTransform, callback?: () => void) {
		d3.svg
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.ease(easeSinInOut)
			.call(
				d3.zoom.transform,
				zoomIdentity
					.translate(
						d3.svg.node()!.clientWidth / 2 - transform.k * transform.x * settings.GRID_UNIT,
						d3.svg.node()!.clientHeight / 2 - transform.k * transform.y * settings.GRID_UNIT
					)
					.scale(transform.k)
			);

		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	static panCamera(d3: D3, x: number, y: number, callback?: () => void) {
		d3.svg
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.ease(easeSinInOut)
			.call(d3.zoom.translateTo, x * settings.GRID_UNIT, y * settings.GRID_UNIT);

		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	static zoomCamera(d3: D3, k: number, callback?: () => void) {
		d3.svg
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.ease(easeSinInOut)
			.call(d3.zoom.scaleTo, k);

		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}
}
