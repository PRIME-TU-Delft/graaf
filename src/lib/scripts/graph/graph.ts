import * as d3 from 'd3';

import { createGrid } from './grid';
import { createArrowhead } from './arrowhead';
import { Node, createNode } from './node';
import { createVertice } from './vertice';
import * as settings from './settings';

export function graph(element: SVGSVGElement, nodes: Node[]) {
	const svg = d3.select<SVGSVGElement, unknown>(element);
	const definitions = svg.append('defs');
	const content = svg.append('g');

	createGrid(svg.node() as SVGSVGElement);
	createArrowhead(definitions.node() as SVGDefsElement);

	svg.call(
		d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([settings.GRID_MIN_ZOOM, settings.GRID_MAX_ZOOM])
			.on('zoom', (event) => {
				// Update content
				content.attr('transform', event.transform);

				// Update grid
				svg
					.select('#grid')
					.attr('x', event.transform.x)
					.attr('y', event.transform.y)
					.attr('width', settings.GRID_UNIT * event.transform.k)
					.attr('height', settings.GRID_UNIT * event.transform.k)
					.selectAll('line')
					.attr('opacity', Math.min(1, event.transform.k));
			})
	);

	content
		.selectAll('g')
		.data(nodes)
		.enter()
		.append('g')
		.each(function (node) {
			createNode(this);
			node.dependencies.forEach((id) => {
				const vertice = content.insert('line', ':first-child').node() as SVGLineElement;
				const dependency = nodes.find((node) => node.id === id) as Node;
				createVertice(vertice, dependency, node);
			});
		});
}
