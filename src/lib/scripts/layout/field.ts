
import * as d3 from 'd3';

import { Field, Relation } from '../entities';
import { updateRelation } from './relation';

import * as settings from './settings';
import { styles } from './settings';

export function updateField(element: SVGGElement, transition: boolean = false) {
	const content = d3.select<SVGGElement, unknown>(element.parentNode as SVGGElement);
	const group = d3.select<SVGGElement, Field>(element);

	group.select('path')
		.transition()
			.duration(transition ? settings.TRANSITION_DURATION : 0)
			.ease(d3.easeSinInOut)
		.attr('transform', field => `translate(
			${field.x * settings.GRID_UNIT},
			${field.y * settings.GRID_UNIT}
		)`);

	group.select('text')
		.transition()
			.duration(transition ? settings.TRANSITION_DURATION : 0)
			.ease(d3.easeSinInOut)
		.attr('transform', field => `translate(
			${(field.x + settings.NODE_WIDTH / 2) * settings.GRID_UNIT},
			${(field.y + settings.NODE_HEIGHT / 2) * settings.GRID_UNIT}
		)`);

	content.selectAll<SVGLineElement, Relation<Field>>('line')
		.filter(relation => relation.parent === group.datum() || relation.child === group.datum())
		.each(function () { updateRelation(this, transition); })
}

export function createField(element: SVGGElement) {
	const group = d3.select<SVGGElement, Field>(element);
	const field = group.datum();

	group.append('path')
		.attr('stroke-Width', settings.STROKE_WIDTH)
		.attr('stroke', field => styles[field.style()!].stroke)
		.attr('fill', field => styles[field.style()!].fill)
		.attr('d', field => styles[field.style()!].path);

	group.append('text')
		.text(field => field.name!)
		.attr('dominant-baseline', 'middle')
		.attr('text-anchor', 'middle');

	group.call(
		d3.drag<SVGGElement, Field>()
			.on('start', function(event, field) {
				d3.select(this).raise();
			})
			.on('drag', function(event, field) {
				field.x = field.x + event.dx / settings.GRID_UNIT;
				field.y = field.y + event.dy / settings.GRID_UNIT;
				updateField(element);
			})
			.on('end', function(event, field) {
				field.x = Math.round(field.x);
				field.y = Math.round(field.y);
				updateField(element);
			})
	);

	updateField(element);
}