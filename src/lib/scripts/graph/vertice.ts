import * as d3 from 'd3';

import { Node } from './node';
import { styles } from './settings';
import * as settings from './settings';

export function updateVertice(element: SVGLineElement) {
	/* We are calculating the vertice connecting two nodes.
	 * It should start at the center of the start node and end at the BOUNDS of the end node.
	 * We first find some properties of the nodes: their size, center, and the difference between them.
	 * As the calculation of the vertice depends on the placement of the start node relative to the end node,
	 * we split the plane in 4 quadrants, originating from the start node, following its diagonals.
	 * We then use simple geometry, based on the quadrant the end node resides in, to calculate the bounds of the end node.
	 * The final vertice is a line from the center of the start node to the calculated bounds of the end node.
	 */

	const vertice = d3.select<SVGLineElement, Node[]>(element);
	const [start, end] = vertice.datum();

	// Half the width and height of the nodes
	const halfWidth = settings.NODE_WIDTH / 2 + settings.NODE_MARGIN;
	const halfHeight = settings.NODE_HEIGHT / 2 + settings.NODE_MARGIN;

	// Center of the nodes
	const cxStart = start.x - settings.NODE_MARGIN + halfWidth;
	const cyStart = start.y - settings.NODE_MARGIN + halfHeight;
	const cxEnd = end.x - settings.NODE_MARGIN + halfWidth;
	const cyEnd = end.y - settings.NODE_MARGIN + halfHeight;

	// Difference between the centers
	const dx = cxEnd - cxStart;
	const dy = cyEnd - cyStart;

	// Bounds
	const ratio = halfHeight / halfWidth;
	const posBound = ratio * dx + cyStart;
	const negBound = -ratio * dx + cyStart;

	const sign = cyEnd > negBound ? -1 : 1;
	const vertQuad = cyEnd > posBound == cyEnd > negBound;

	// Final vertice
	const x1 = cxStart;
	const y1 = cyStart;
	const x2 = cxEnd + sign * (vertQuad ? (halfHeight * dx) / dy : halfWidth);
	const y2 = cyEnd + sign * (vertQuad ? halfHeight : (halfWidth * dy) / dx);

	vertice
		.attr('x1', x1 * settings.GRID_UNIT)
		.attr('y1', y1 * settings.GRID_UNIT)
		.attr('x2', x2 * settings.GRID_UNIT)
		.attr('y2', y2 * settings.GRID_UNIT);
}

export function createVertice(element: SVGLineElement, start: Node, end: Node) {
	d3.select(element)
		.datum([start, end])
		.attr('stroke-width', settings.STROKE_WIDTH)
		.attr('stroke', styles[start.style].stroke)
		.attr('fill', styles[start.style].stroke)
		.attr('marker-end', 'url(#arrowhead)');

	updateVertice(element);
}
