
// External imports
import * as d3 from 'd3'

// Internal imports
import { RelationSVG } from '../d3'
import { Field, Domain, Subject, Relation, Lecture } from '../entities'
import * as settings from '../settings'
import { styles } from '../settings'

// Exports
export { FieldSVG }

class FieldSVG {
	static create(selection: d3.Selection<SVGGElement, Field<Domain | Subject>, d3.BaseType, unknown>) {
		if (selection.empty()) return

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
			d3.drag<SVGGElement, Field<Domain | Subject>>()
				.on('start', function() {
					d3.select(this)
						.raise()
				})
				.on('drag', function(event, field) {
					field.x = field.x + event.dx / settings.GRID_UNIT
					field.y = field.y + event.dy / settings.GRID_UNIT
					FieldSVG.updatePosition(d3.select(this))
				})
				.on('end', function(_ ,field) {
					field.x = Math.round(field.x)
					field.y = Math.round(field.y)
					FieldSVG.updatePosition(d3.select(this))
				})
		)
	}

	static updatePosition(selection: d3.Selection<SVGGElement, Field<Domain | Subject>, d3.BaseType, unknown>, animated: boolean = false) {
		if (selection.empty()) return
		const content = d3.select<SVGGElement, unknown>(selection.node()!.parentNode as SVGGElement)

		// Raise fields
		selection
			.raise()

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
		selection.each(function(field) {
			content.selectAll<SVGLineElement, Relation<Domain | Subject>>('.relation')
				.filter(relation => relation.parent === field || relation.child === field)
				.call(RelationSVG.update, animated)
		})
	}

	static updateHighlight(selection: d3.Selection<SVGGElement, Field<Domain | Subject>, d3.BaseType, unknown>, lecture?: Lecture) {
		if (selection.empty()) return

		selection
			.each(function(field) {
				if (field instanceof Domain) {
					d3.select(this)
						.attr('filter', lecture?.present.some(subject => subject.domain === field) ? 'url(#shadow)' : null)
				} else if (field instanceof Subject) {
					d3.select(this)
						.attr('filter', lecture?.present.includes(field) ? 'url(#shadow)' : null)
				}
			})
	}
}
