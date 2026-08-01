import * as d3 from 'd3';
import * as settings from '$lib/settings';
import type { GraphD3 } from './GraphD3';
import { graphState } from './GraphD3State.svelte';
import { graphView } from './GraphD3View.svelte';
import type { CameraTransform, NodeData } from './types';

/**
 * Computes and applies camera transforms (pan/zoom): where the origin should sit for the current
 * background (grid vs. lecture), the transform needed to frame a set of nodes, and the
 * animated moves used to get there.
 */
export class CameraToolbox {
	/**
	 * Whether zoom/pan is currently allowed at all. Only in the domains or subjects view, only
	 * while idle or already simulating, and for wheel events specifically, only when the wheel
	 * zoom lock is off or the user is holding Shift.
	 *
	 * @param graph - The graph instance to check
	 * @param event - The zoom event triggering the check, if any; omit to check outside of an
	 * event (e.g. before a programmatic zoom)
	 */
	static allowZoomAndPan(graph: GraphD3, event?: d3.D3ZoomEvent<SVGSVGElement, unknown>): boolean {
		return (
			(graphView.isDomains() || graphView.isSubjects()) &&
			(graphState.isIdle() || graphState.isSimulating()) &&
			(event === undefined || event.type !== 'wheel' || !graph.zoom_lock || graph.keys.Shift)
		);
	}

	/**
	 * Contains a bunch of handy knickknacks.
	 *
	 * **x** and **y** are the offsets to center the origin. When the background is a lecture, or
	 * mode is explicitly set to 'lecture', the offsets are calculated based on the lecture size.
	 * Otherwise they are set to the center of the svg.
	 *
	 * **k** is used to scale the graph to fit the lecture background. Said differently, it
	 * contains the ratio between the client size and the lecture background size. When the
	 * background is a grid, or mode is 'graph' or undefined, **k** is set to 1.
	 *
	 * @param graph - The graph instance to compute the transform for
	 * @param mode - Force 'graph' or 'lecture' sizing rather than inferring it from the current
	 * background
	 */
	static clientTransform(graph: GraphD3, mode?: 'graph' | 'lecture'): CameraTransform {
		if (mode !== 'graph' && (graph.background.classed('lecture') || mode === 'lecture')) {
			const size = graph.lecture
				? Math.max(
						graph.lecture.past_nodes.length,
						graph.lecture.present_nodes.length,
						graph.lecture.future_nodes.length
					)
				: 0;

			const outer_width =
				3 * (2 * settings.LECTURE_PADDING + settings.NODE_WIDTH) * settings.GRID_UNIT +
				settings.STROKE_WIDTH;

			const outer_height =
				(settings.LECTURE_HEADER_HEIGHT +
					size * settings.NODE_HEIGHT +
					(size + 1) * settings.LECTURE_PADDING) *
					settings.GRID_UNIT +
				settings.STROKE_WIDTH;

			return {
				x: outer_width / 2,
				y: outer_height / 2,
				k: Math.min(
					1,
					(graph.svg.node()!.clientWidth - 2 * settings.LECTURE_PADDING * settings.GRID_UNIT) /
						outer_width
				)
			};
		} else {
			return {
				x: graph.svg.node()!.clientWidth / 2,
				y: graph.svg.node()!.clientHeight / 2,
				k: 1
			};
		}
	}

	/**
	 * Compute the transform that centers the camera on and frames the given nodes, with padding,
	 * clamped to the app's min/max zoom. Falls back to clientTransform if there are no nodes.
	 *
	 * @param graph - The graph instance to compute the transform for
	 * @param nodes - The nodes to frame
	 */
	static centralTransform(graph: GraphD3, nodes: NodeData[]): CameraTransform {
		if (nodes.length === 0) {
			return this.clientTransform(graph);
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
			x: (min_x + max_x) / 2,
			y: (min_y + max_y) / 2,
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

	/**
	 * Animate the camera to a given CameraTransform (typically from centralTransform or
	 * clientTransform), translated relative to the current clientTransform origin.
	 *
	 * @param graph - The graph instance to move the camera for
	 * @param transform - The target transform
	 * @param callback - If provided, animates the move and calls this once the animation
	 * duration has elapsed; if omitted, the move is instant and no callback is scheduled
	 */
	static moveCamera(graph: GraphD3, transform: CameraTransform, callback?: () => void) {
		const client = CameraToolbox.clientTransform(graph);

		graph.svg
			.transition()
			.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.ease(d3.easeSinInOut)
			.call(
				graph.zoom.transform,
				d3.zoomIdentity
					.translate(
						client.x - transform.k * transform.x * settings.GRID_UNIT,
						client.y - transform.k * transform.y * settings.GRID_UNIT
					)
					.scale(transform.k)
			);

		if (callback) {
			setTimeout(() => {
				callback();
			}, settings.GRAPH_ANIMATION_DURATION);
		}
	}

	/**
	 * Animate the camera to translate to a given grid position, without changing zoom.
	 *
	 * @param graph - The graph instance to move the camera for
	 * @param x - The target x position, in grid units
	 * @param y - The target y position, in grid units
	 * @param callback - If provided, animates the move and calls this once the animation
	 * duration has elapsed; if omitted, the move is instant and no callback is scheduled
	 */
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

	/**
	 * Animate the camera to a given zoom scale, without changing position.
	 *
	 * @param graph - The graph instance to zoom
	 * @param k - The target scale factor
	 * @param callback - If provided, animates the zoom and calls this once the animation
	 * duration has elapsed; if omitted, the zoom is instant and no callback is scheduled
	 */
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
