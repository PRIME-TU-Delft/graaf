
// External imports
import * as d3 from 'd3';

// Internal imports
import { Field, Relation } from '../entities';
import { createField, updateField } from './field';
import { createRelation } from './relation';
import * as settings from './settings';

// Exports
export function layout(element: SVGSVGElement) {
	// Prepare an svg to display the layout.

	const svg = d3.select<SVGSVGElement, unknown>(element)
	const definitions = svg.append('defs');
	const content = svg.append('g')
		.attr('id', 'content');

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
		.attr('height', '100%')
		.lower();

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
}

export function fillLayout(element: SVGSVGElement, fields: Field[], relations: Relation<Field>[]) {
	// Fill the layout with fields and relations.

	const svg = d3.select<SVGSVGElement, unknown>(element);
	const content = svg.select('#content');

	// Create relations
	content.selectAll('line')
		.data(relations)
		.enter()
		.append('line')
			.each(function() {
				createRelation(this);
			});

	// Create fields
	content.selectAll('g')
		.data(fields)
		.enter()
		.append('g')
			.each(function() {
				createField(this);
			});
}

export function updateLayout(element: SVGSVGElement, animated: boolean = false) {
	// Update the layout to represent its current state. When animated is true, the transition is animated.

	const svg = d3.select<SVGSVGElement, unknown>(element);
	const content = svg.select('#content');
	console.log(content);

	content.selectAll<SVGGElement, Field>('g')
		.each(function(field) {
			updateField(this, animated);
		});
}

export function clearLayout(element: SVGSVGElement) {
	// Clear the layout of all fields and relations.

	const svg = d3.select<SVGSVGElement, unknown>(element);
	const content = svg.select('#content');
	content.selectAll('*').remove();
}