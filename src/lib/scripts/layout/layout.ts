
import * as d3 from 'd3';

import { Field, Relation } from '../entities';
import { createRelation } from './relation';
import { createField, updateField } from './field';

import * as settings from './settings';

type PositionBuffer = {id: number, x: number, y: number};
type LayoutParameters = [Field[], Relation<Field>[], PositionBuffer[]?];

export function layout(element: SVGSVGElement, parameters: LayoutParameters) {
	const svg = d3.select<SVGSVGElement, unknown>(element)
	const definitions = svg.append('defs');
	const [fields, relations, positionBuffers] = parameters;

	// Create arrowhead
	definitions.append('marker')
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

	// Create grid
	const pattern = definitions.append('pattern')
		.attr('patternUnits', 'userSpaceOnUse')
		.attr('width', settings.GRID_UNIT)
		.attr('height', settings.GRID_UNIT)
		.attr('id', 'grid');

	pattern.append('line')
		.attr('stroke', settings.GRID_COLOR)
		.attr('x1', 0)
		.attr('y1', 0)
		.attr('x2', settings.GRID_UNIT * settings.GRID_MAX_ZOOM)
		.attr('y2', 0);

	pattern.append('line')
		.attr('stroke', settings.GRID_COLOR)
		.attr('x1', 0)
		.attr('y1', 0)
		.attr('x2', 0)
		.attr('y2', settings.GRID_UNIT * settings.GRID_MAX_ZOOM);

	svg.append('rect')
		.attr('fill', 'url(#grid)')
		.attr('width', '100%')
		.attr('height', '100%');

	// Grid events
	svg.call(
		d3.zoom<SVGSVGElement, unknown>()
			.scaleExtent([settings.GRID_MIN_ZOOM, settings.GRID_MAX_ZOOM])
			.on('zoom', (event) => {

				// Update content
				content.attr('transform', event.transform);

				// Update grid
				svg.select('#grid')
					.attr('x', event.transform.x)
					.attr('y', event.transform.y)
					.attr('width', settings.GRID_UNIT * event.transform.k)
					.attr('height', settings.GRID_UNIT * event.transform.k)
					.selectAll('line')
						.attr('opacity', Math.min(1, event.transform.k));
			})
	);

	// Create relations
	const content = svg.append('g');
	content.selectAll('line')
		.data(relations)
		.enter()
		.append('line')
			.each(function() { createRelation(this); });

	// Create fields
	content.selectAll('g')
		.data(fields)
		.enter()
		.append('g')
			.each(function(field) {
				let buffer = positionBuffers?.find(position => position.id === field.id);
				if (buffer) {

					// Swap real field position with buffer position
					let temp = field.x;
					field.x = buffer.x;
					buffer.x = temp;
					temp = field.y;
					field.y = buffer.y;
					buffer.y = temp;
				}

				createField(this);
			});

	// Transition to real positions
	content.selectAll<SVGGElement, Field>('g')
		.each(function(field) {
			let buffer = positionBuffers?.find(position => position.id === field.id);
			if (buffer) {
				field.x = buffer.x;
				field.y = buffer.y;
				updateField(this, true);
			}
		});
}