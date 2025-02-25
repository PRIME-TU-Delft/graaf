
// External imports
import * as d3 from 'd3'

// Internal imports
import * as settings from '$scripts/settings'
import { NODE_STYLES } from '$scripts/settings'

import {
	GraphSVG,
	RelationSVG,
	SVGState
} from '$scripts/svg'

import {
	NodeController,
	DomainController,
	SubjectController,
	RelationController,
	LectureController
} from '$scripts/controllers'

// Exports
export { NodeSVG }


// --------------------> Classes

type NodeSelection = d3.Selection<SVGGElement, NodeController<DomainController | SubjectController>, d3.BaseType, unknown>

class NodeSVG {
	static create(selection: NodeSelection, graphSVG: GraphSVG) {

		// Node attributes
		selection
			.attr('id', node => node.uuid)
			.attr('class', 'node fixed')
			.attr('pointer-events', graphSVG.interactive ? 'all' : 'none')
			.attr('transform', node => `translate(
				${node.x * settings.GRID_UNIT},
				${node.y * settings.GRID_UNIT}
			)`)

		// Node outline
		selection.append('path')
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('stroke', node => NODE_STYLES[node.style!].stroke)
			.attr('fill', node => NODE_STYLES[node.style!].fill)
			.attr('d', node => NODE_STYLES[node.style!].path)

		// Node text
		selection.append('text')
			.text(node => node.display_name)
			.style('text-anchor', 'middle')
			.style('dominant-baseline', 'middle')
			.style('font-size', settings.NODE_FONT_SIZE)

		// Wrap text
		selection
			.selectAll('text')
				.each(function() {
					const max_width = (settings.NODE_WIDTH - 2 * settings.NODE_PADDING) * settings.GRID_UNIT
					const middle_height = settings.NODE_HEIGHT / 2 * settings.GRID_UNIT
					const middle_width = settings.NODE_WIDTH / 2 * settings.GRID_UNIT

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
					const font_size = settings.NODE_FONT_SIZE * scale
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
			d3.drag<SVGGElement, NodeController<DomainController | SubjectController>>()
				.filter(event => graphSVG.state === SVGState.dynamic)
				.on('start', function() {
					const selection = d3.select<SVGGElement, NodeController<DomainController | SubjectController>>(this)
					selection.call(NodeSVG.setFixed, true)
				})
				.on('drag', function(event, node) {
					const selection = d3.select<SVGGElement, NodeController<DomainController | SubjectController>>(this)
					node.x = node.x + event.dx / settings.GRID_UNIT
					node.y = node.y + event.dy / settings.GRID_UNIT
					node.fx = node.x
					node.fy = node.y

					NodeSVG.updatePosition(selection)
					graphSVG.microwaveSimulation()
				})
				.on('end', async function(_ ,node) {
					const selection = d3.select<SVGGElement, NodeController<DomainController | SubjectController>>(this)
					node.x = Math.round(node.x)
					node.y = Math.round(node.y)
					node.fx = node.x
					node.fy = node.y

					NodeSVG.updatePosition(selection)
					await node.save()
				})
		)
	}

	static updatePosition(selection: NodeSelection, animated: boolean = false) {
		const content = d3.select<SVGGElement, unknown>('g#content')

		// Raise nodes
		selection.raise()

		// Update node position
		selection
			.transition()
				.duration(animated ? settings.GRAPH_ANIMATION_DURATION : 0)
				.ease(d3.easeSinInOut)
			.attr('transform', node => `translate(
				${node.x * settings.GRID_UNIT},
				${node.y * settings.GRID_UNIT}
			)`)

		// Update relations
		selection.each(function(node) {
			content.selectAll<SVGLineElement, RelationController<DomainController | SubjectController>>('.relation')
				.filter(relation => relation.parent === node || relation.child === node)
				.call(RelationSVG.update, animated)
		})
	}

	static updateHighlight(selection: NodeSelection, lecture: LectureController | null) {
		selection
			.each(function(node) {
				const highlight =
					node instanceof DomainController  && lecture?.present_subjects.some(subject => subject.domain === node) ||
					node instanceof SubjectController && lecture?.present_subjects.includes(node)

				d3.select(this)
					.attr('filter', highlight ? 'url(#highlight)' : null)
			})
	}

	static setFixed(selection: NodeSelection, fixed: boolean) {
		selection
			.classed('fixed', fixed)
			.attr('stroke-dasharray', fixed ? null : settings.STROKE_DASHARRAY)
			.each(node => {
				node.x = fixed ? Math.round(node.x) : node.x
				node.y = fixed ? Math.round(node.y) : node.y
				node.fx = fixed ? node.x : undefined
				node.fy = fixed ? node.y : undefined
			})

		NodeSVG.updatePosition(selection)
	}
}
