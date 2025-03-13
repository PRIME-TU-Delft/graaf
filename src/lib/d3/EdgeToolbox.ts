import * as d3 from 'd3';
import * as settings from '$lib/settings';
import type { GraphD3 } from './GraphD3';
import type { EdgeSelection } from './types';

export class EdgeToolbox {
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
			.attr('d', `M 0 0 L 10 5 L 0 10 Z`);
	}

	static create(selection: EdgeSelection) {
		selection
			.attr('id', (edge) => edge.id)
			.attr('class', 'edge')
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('stroke', (edge) => settings.NODE_STYLES[edge.source.style].stroke)
			.attr('fill', (edge) => settings.NODE_STYLES[edge.source.style].stroke)
			.attr('marker-end', 'url(#arrowhead)')
			.call(EdgeToolbox.updatePosition);
	}

	static updatePosition(selection: EdgeSelection, transition: boolean = false) {
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

			/* We are calculating the line connecting two nodes.
			 * It should start at the center of the start node and end at the BOUNDS of the end node.
			 * Said differently, we need to find the intersection of a line with a rectangle centered at the target node.
			 * To do this, we split the plane in four using the two diagonals of the rectangle. We find in which quadrant
			 * the source node is, then find the intersection with the corresponding side of the rectangle.
			 */

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
}
