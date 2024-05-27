
// External imports
import * as d3 from 'd3'

// Internal imports
import { Field, Relation } from './entities'
import { RelationSVG } from './relationSVG'
import * as settings from './settings'
import { styles } from './settings'

// Exports
export { FieldSVG }

class FieldSVG {
	static create(selection: d3.Selection<SVGGElement, Field, d3.BaseType, unknown>) {

		// Field attrs
		selection
			.attr('id', field => field.id)
			.attr('class', 'field')
			.attr('transform', field => `translate(
				${field.x * settings.GRID_UNIT},
				${field.y * settings.GRID_UNIT}
			)`)

		// Field outline
		selection.append('path')
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('stroke', field => styles[field.style!].stroke)
			.attr('fill', field => styles[field.style!].fill)
			.attr('d', field => styles[field.style!].path)

		// Field text
		selection.append('text')
			.text(field => field.name!)
			.style('font-size', settings.FIELD_FONT_SIZE)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('transform', `translate(
				${settings.FIELD_WIDTH / 2 * settings.GRID_UNIT},
				${settings.FIELD_HEIGHT / 2 * settings.GRID_UNIT}
			)`)

		// Drag behaviour
		selection.call(
			d3.drag<SVGGElement, Field>()
				.on('start', function() {
					d3.select(this)
						.raise()
				})
				.on('drag', function(event, field) {
					field.x = field.x + event.dx / settings.GRID_UNIT
					field.y = field.y + event.dy / settings.GRID_UNIT
					FieldSVG.update(d3.select(this))
				})
				.on('end', function(_ ,field) {
					field.x = Math.round(field.x)
					field.y = Math.round(field.y)
					FieldSVG.update(d3.select(this))
				})
		)
	}

	static update(selection: d3.Selection<SVGGElement, Field, d3.BaseType, unknown>, animated: boolean = false) {

		// Update field position
		selection
			.transition()
				.duration(animated ? settings.ANIMATION_DURATION : 0)
				.ease(d3.easeSinInOut)
			.attr('transform', field => `translate(
				${field.x * settings.GRID_UNIT},
				${field.y * settings.GRID_UNIT}
			)`)

		// Update relations
		d3.select<SVGGElement, unknown>(selection.node()?.parentNode as SVGGElement)
			.selectAll<SVGLineElement, Relation<Field>>('line')
			.filter(relation => relation.parent === selection.datum() || relation.child === selection.datum())
			.each(function() { RelationSVG.update(d3.select(this), animated) })
	}
}