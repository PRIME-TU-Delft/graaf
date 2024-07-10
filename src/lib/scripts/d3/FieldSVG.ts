
// External imports
import * as d3 from 'd3'

// Internal imports
import { GraphSVG, RelationSVG } from '../d3'
import { Field, Domain, Subject, Relation, Lecture } from '../entities'
import * as settings from '../settings'
import { styles } from '../settings'

// Exports
export { FieldSVG }


// --------------------> Types


type FieldSelection = d3.Selection<SVGGElement, Field<Domain | Subject>, d3.BaseType, unknown>


// --------------------> Classes


class FieldSVG {
	static create(selection: FieldSelection, graphSVG: GraphSVG) {

		// Field attrs
		selection
			.attr('id', field => field.anchor)
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
					const selection = d3.select<SVGGElement, Field<Domain | Subject>>(this)
					selection.call(FieldSVG.setFixed, true)
				})
				.on('drag', function(event, field) {
					const selection = d3.select<SVGGElement, Field<Domain | Subject>>(this)
					field.x = field.x + event.dx / settings.GRID_UNIT
					field.y = field.y + event.dy / settings.GRID_UNIT
					field.fx = field.x
					field.fy = field.y
					
					FieldSVG.updatePosition(selection)
					graphSVG.microwaveSimulation()
				})
				.on('end', function(_ ,field) {
					const selection = d3.select<SVGGElement, Field<Domain | Subject>>(this)
					field.x = Math.round(field.x)
					field.y = Math.round(field.y)
					field.fx = field.x
					field.fy = field.y

					FieldSVG.updatePosition(selection)
				})
		)
	}

	static updatePosition(selection: FieldSelection, animated: boolean = false) {
		const content = d3.select<SVGGElement, unknown>(selection.node()!.parentNode as SVGGElement)

		// Raise fields
		selection.raise()

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

	static updateHighlight(selection: FieldSelection, lecture?: Lecture) {
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

	static setFixed(selection: FieldSelection, fixed: boolean) {
		selection
			.classed('fixed', fixed)
			.attr('stroke-dasharray', fixed ? null : settings.STROKE_DASHARRAY)
			.each((field) => {
				field.fx = fixed ? Math.round(field.x) : undefined
				field.fy = fixed ? Math.round(field.y) : undefined
			})
	}
}
