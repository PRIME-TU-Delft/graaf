import * as d3 from 'd3';
import * as settings from '$lib/settings';
import type { GraphD3 } from './GraphD3';
import type { EdgeData, EdgeSelection } from './types';

/**
 * Renders and positions the directed edges connecting graph nodes: the arrowhead marker
 * definition, edge creation, style, and the geometry that clips each edge line to the border of
 * its target node rather than drawing into the node itself.
 */
export class EdgeToolbox {
	/**
	 * Register the arrowhead marker used at the end of every edge, in the graph's `<defs>`, if
	 * it hasn't been added already. Safe to call multiple times.
	 *
	 * @param graph - The graph instance whose defs the marker is added to
	 */
	static init(graph: GraphD3) {
		const marker = graph.definitions.select('marker#arrowhead');
		if (!marker.empty()) {
			return;
		}

		graph.definitions
			.append('marker')
			.attr('id', 'arrowhead')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('fill', 'context-fill')
			.attr('d', 'M 0 0 L 10 5 L 0 10 Z');
	}

	/**
	 * Get the style to render an edge with, taken from its source node's style (edges have no
	 * style of their own).
	 *
	 * @param edge - The edge to style
	 */
	private static styleOf(edge: EdgeData) {
		return edge.source.style ? settings.STYLES[edge.source.style] : settings.DEFAULT_STYLE;
	}

	/**
	 * Render a selection of newly-entered edges: stroke/fill from the source node's style, the
	 * arrowhead marker, and initial position.
	 *
	 * @param selection - The D3 selection of newly-entered edge elements to render into
	 */
	static create(selection: EdgeSelection) {
		selection
			.attr('id', (edge) => edge.uuid)
			.attr('class', 'edge')
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('stroke', (edge) => EdgeToolbox.styleOf(edge).stroke)
			.attr('fill', (edge) => EdgeToolbox.styleOf(edge).stroke)
			.attr('marker-end', 'url(#arrowhead)')
			.call(EdgeToolbox.updatePosition);
	}

	/**
	 * Recompute and apply each edge's line coordinates from its source/target node positions,
	 * clipping the endpoint to the border of the target node's bounding box (rather than its
	 * center) so the arrowhead lands on the node's edge, not inside it. If the two nodes
	 * overlap, draws center to center instead, since the line wouldn't be visible either way.
	 *
	 * @param selection - The edges to reposition
	 * @param transition - Whether to animate the move, or snap instantly
	 */
	static updatePosition(selection: EdgeSelection, transition: boolean = false) {
		/* We are calculating the line connecting two nodes.
		 * It should start at the center of the start node and end at the BOUNDS of the end node.
		 * Said differently, we need to find the intersection of a line with a rectangle centered at the target node.
		 * To do this, we split the plane in four using the two diagonals of the rectangle. We find in which quadrant
		 * the source node is, then find the intersection with the corresponding side of the rectangle.
		 */

		// Lower edges
		selection.lower();

		// Update edges
		selection.each(function (edge) {
			const line = d3.select(this);

			// Half the width and height of the nodes
			const halfWidth = settings.NODE_WIDTH / 2 + settings.NODE_MARGIN;
			const halfHeight = settings.NODE_HEIGHT / 2 + settings.NODE_MARGIN;

			// Center of the nodes
			const cxSource = edge.source.x - settings.NODE_MARGIN + halfWidth;
			const cySource = edge.source.y - settings.NODE_MARGIN + halfHeight;
			const cxTarget = edge.target.x - settings.NODE_MARGIN + halfWidth;
			const cyTarget = edge.target.y - settings.NODE_MARGIN + halfHeight;

			// Difference between the centers
			const dx = cxTarget - cxSource;
			const dy = cyTarget - cySource;

			// Check for overlap - if so, just go center to center (the line shouldn't be visible anyways)
			if (Math.abs(dx) < halfWidth && Math.abs(dy) < halfHeight) {
				line
					.transition()
					.duration(transition ? settings.GRAPH_ANIMATION_DURATION : 0)
					.ease(d3.easeSinInOut)
					.attr('x1', cxSource * settings.GRID_UNIT)
					.attr('y1', cySource * settings.GRID_UNIT)
					.attr('x2', cxTarget * settings.GRID_UNIT)
					.attr('y2', cyTarget * settings.GRID_UNIT);

				return;
			}

			// Bounds of our four quadrants
			const ratio = halfHeight / halfWidth;
			const posBound = ratio * dx + cySource; // positively angled diagonal
			const negBound = -ratio * dx + cySource; // negatively angled diagonal

			const sign = cyTarget > negBound ? -1 : 1; // Check if target is in top or right quadrant
			const vertQuad = cyTarget > posBound == cyTarget > negBound; // Check if target is in top or bottom quadrant

			// Final line
			const x1 = cxSource;
			const y1 = cySource;
			const x2 = cxTarget + sign * (vertQuad ? (halfHeight * dx) / dy : halfWidth);
			const y2 = cyTarget + sign * (vertQuad ? halfHeight : (halfWidth * dy) / dx);

			line
				.transition()
				.duration(transition ? settings.GRAPH_ANIMATION_DURATION : 0)
				.ease(d3.easeSinInOut)
				.attr('x1', x1 * settings.GRID_UNIT)
				.attr('y1', y1 * settings.GRID_UNIT)
				.attr('x2', x2 * settings.GRID_UNIT)
				.attr('y2', y2 * settings.GRID_UNIT);
		});
	}

	/**
	 * Re-render each edge's stroke/fill from its current source node style, without touching
	 * position. Used when a domain's style changes.
	 *
	 * @param selection - The edges to update
	 */
	static updateStyle(selection: EdgeSelection) {
		selection
			.attr('stroke', (edge) => EdgeToolbox.styleOf(edge).stroke)
			.attr('fill', (edge) => EdgeToolbox.styleOf(edge).stroke);
	}
}
