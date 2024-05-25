
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
	static create(element: SVGGElement) {
		const group = d3.select<SVGGElement, Field>(element)
		const field = group.datum()

		// Field attrs
		group
			.attr('id', field.id)
			.attr('class', 'field')
			.attr('transform', `translate(
				${field.x * settings.GRID_UNIT},
				${field.y * settings.GRID_UNIT}
			)`)

		// Field outline
		group.append('path')
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('stroke', styles[field.style()!].stroke)
			.attr('fill', styles[field.style()!].fill)
			.attr('d', styles[field.style()!].path)

		// Field text
		group.append('text')
			.text(field.name!)
			.attr('font-size', settings.FIELD_FONT_SIZE)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('transform', `translate(
				${settings.FIELD_WIDTH / 2 * settings.GRID_UNIT},
				${settings.FIELD_HEIGHT / 2 * settings.GRID_UNIT}
			)`)

		// Drag behaviour
		group.call(
			d3.drag<SVGGElement, Field>()
				.on('start', function() {
					d3.select(this)
						.raise()
				})
				.on('drag', function(event) {
					const field = group.datum()
					field.x = field.x + event.dx / settings.GRID_UNIT
					field.y = field.y + event.dy / settings.GRID_UNIT
					FieldSVG.update(element)
				})
				.on('end', function() {
					const field = group.datum()
					field.x = Math.round(field.x)
					field.y = Math.round(field.y)
					FieldSVG.update(element)
				})
		)
	}

	static update(element: SVGGElement, animated: boolean = false) {
		const group = d3.select<SVGGElement, Field>(element)

		// Update field position
		group
			.transition()
				.duration(animated ? settings.TRANSITION_DURATION : 0)
				.ease(d3.easeSinInOut)
			.attr('transform', field => `translate(
				${field.x * settings.GRID_UNIT},
				${field.y * settings.GRID_UNIT}
			)`)

		// Update relations
		d3.select<SVGGElement, unknown>(group.node()!.parentNode as SVGGElement)
			.selectAll<SVGLineElement, Relation<Field>>('line')
			.filter(relation => relation.parent === group.datum() || relation.child === group.datum())
			.each(function() { RelationSVG.update(this, animated) })

	}
}