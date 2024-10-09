
// External imports
import * as d3 from 'd3'

// Internal imports
import {
	GraphSVGController,
	RelationSVGController
} from '$scripts/SVGControllers'

import {
	FieldController,
	DomainController,
	SubjectController,
	RelationController,
	LectureController
} from '$scripts/controllers'

import * as settings from '$scripts/settings'
import { styles } from '$scripts/settings'

// Exports
export { FieldSVGController }


// --------------------> Classes

type FieldSelection = d3.Selection<SVGGElement, FieldController<DomainController | SubjectController>, d3.BaseType, unknown>

class FieldSVGController {
	static create(selection: FieldSelection, graphSVG: GraphSVGController) {

		// Field attributes
		selection
			.attr('id', field => field.uuid)
			.attr('class', 'field fixed')
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
			.style('text-anchor', 'middle')
			.style('dominant-baseline', 'middle')
			.style('font-size', settings.FIELD_FONT_SIZE)

		// Wrap text
		selection
			.selectAll('text')
				.each(function() {
					const max_width = (settings.FIELD_WIDTH - 2 * settings.FIELD_PADDING) * settings.GRID_UNIT
					const middle_height = settings.FIELD_HEIGHT / 2 * settings.GRID_UNIT
					const middle_width = settings.FIELD_WIDTH / 2 * settings.GRID_UNIT

					// Select elements
					const element = d3.select(this)
					const text = element.text()
					const words = text.split(/\s+/)
					element.text(null)

					// Make tspan
					let tspan = element
						.append('tspan')
						.attr('x', middle_width)

					// Get longest word
					const longest = words.reduce((a, b) => a.length > b.length ? a : b)
					tspan.text(longest)

					// Scale font size
					const scale = Math.min(1, max_width / tspan.node()!.getComputedTextLength())
					const font_size = settings.FIELD_FONT_SIZE * scale
					element.attr('font-size', font_size)

					// Wrap text
					let line_count = 0
					let line: string[] = []
					for (const word of words) {
						line.push(word)
						tspan.text(line.join(' '))
						if (tspan.node()!.getComputedTextLength() > max_width) {
							line.pop()
							tspan.text(line.join(' '))
							line = [word]
							tspan = element.append('tspan')
								.attr('x', middle_width)
								.attr('y', 0)
								.attr('dy', ++line_count * 1.1 + 'em')
								.text(word)
						}
					}

					// Center vertically
					element.selectAll('tspan')
						.attr('y', middle_height - font_size * line_count * 1.1 / 2)
				})

		// Drag behaviour
		selection.call(
			d3.drag<SVGGElement, FieldController<DomainController | SubjectController>>()
				.on('start', function() {
					const selection = d3.select<SVGGElement, FieldController<DomainController | SubjectController>>(this)
					selection.call(FieldSVGController.setFixed, true)
				})
				.on('drag', function(event, field) {
					const selection = d3.select<SVGGElement, FieldController<DomainController | SubjectController>>(this)
					field.x = field.x + event.dx / settings.GRID_UNIT
					field.y = field.y + event.dy / settings.GRID_UNIT
					field.fx = field.x
					field.fy = field.y

					FieldSVGController.updatePosition(selection)
					graphSVG.microwaveSimulation()
				})
				.on('end', async function(_ ,field) {
					const selection = d3.select<SVGGElement, FieldController<DomainController | SubjectController>>(this)
					field.x = Math.round(field.x)
					field.y = Math.round(field.y)
					field.fx = field.x
					field.fy = field.y

					FieldSVGController.updatePosition(selection)
					await field.save()
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
			content.selectAll<SVGLineElement, RelationController<DomainController | SubjectController>>('.relation')
				.filter(relation => relation.parent === field || relation.child === field)
				.call(RelationSVGController.update, animated)
		})
	}

	static updateHighlight(selection: FieldSelection, lecture?: LectureController) {
		selection
			.each(function(field) {
				const highlight =
					field instanceof DomainController  && lecture?.present.some(subject => subject.domain === field) ||
					field instanceof SubjectController && lecture?.present.includes(field)

				d3.select(this)
					.attr('filter', highlight ? 'url(#highlight)' : null)
			})
	}

	static setFixed(selection: FieldSelection, fixed: boolean) {
		selection
			.classed('fixed', fixed)
			.attr('stroke-dasharray', fixed ? null : settings.STROKE_DASHARRAY)
			.each(field => {
				field.x = fixed ? Math.round(field.x) : field.x
				field.y = fixed ? Math.round(field.y) : field.y
				field.fx = fixed ? field.x : undefined
				field.fy = fixed ? field.y : undefined
			})

		FieldSVGController.updatePosition(selection)
	}
}
