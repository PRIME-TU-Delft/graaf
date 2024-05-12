import * as d3 from 'd3';

import { updateVertice } from './vertice';
import { styles } from './settings';
import * as settings from './settings';

export class Node {
	id: number;
	x: number;
	y: number;
	style: string;
	text: string;
	dependencies: number[];

	constructor(
		id: number,
		x: number,
		y: number,
		color: string,
		text: string,
		dependencies: number[]
	) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.style = color;
		this.text = text;
		this.dependencies = dependencies;
	}
}

export function updateNode(element: SVGGElement) {
	const group = d3.select<SVGGElement, Node>(element);
	const content = d3.select<SVGGElement, unknown>(element.parentNode as SVGGElement);

	group
		.select('path')
		.attr(
			'transform',
			(node) => `translate(${node.x * settings.GRID_UNIT}, ${node.y * settings.GRID_UNIT})`
		);

	group.select('text').attr(
		'transform',
		(node) => `translate(
			${(node.x + settings.NODE_WIDTH / 2) * settings.GRID_UNIT}, 
			${(node.y + settings.NODE_HEIGHT / 2) * settings.GRID_UNIT}
		)`
	);

	content
		.selectAll<SVGLineElement, Node[]>('line')
		.filter((vertice) => vertice.includes(group.datum()))
		.each(function () {
			updateVertice(this);
		});
}

export function createNode(element: SVGGElement) {
	const group = d3.select<SVGGElement, Node>(element);

	group
		.append('path')
		.attr('stroke-Width', settings.STROKE_WIDTH)
		.attr('stroke', (node) => styles[node.style].stroke)
		.attr('fill', (node) => styles[node.style].fill)
		.attr('d', (node) => styles[node.style].path);

	group
		.append('text')
		.text((node) => node.text)
		.attr('dominant-baseline', 'middle')
		.attr('text-anchor', 'middle');

	group.call(
		d3
			.drag<SVGGElement, Node>()
			.on('start', function () {
				d3.select(this).raise();
			})
			.on('drag', function (event, node) {
				node.x = node.x + event.dx / settings.GRID_UNIT;
				node.y = node.y + event.dy / settings.GRID_UNIT;
				updateNode(element);
			})
			.on('end', function (event, node) {
				node.x = Math.round(node.x);
				node.y = Math.round(node.y);
				updateNode(element);
			})
	);

	updateNode(element);
}
