
// External imports
import * as d3 from 'd3'

// Internal imports
import { Relation } from '../entities'
import * as settings from '../settings'
import { styles } from '../settings'

// Exports
export { RelationSVG }

class RelationSVG {
	static create(selection: d3.Selection<SVGLineElement, Relation, d3.BaseType, unknown>) {
		if (selection.empty()) return
		selection
			.attr('class', 'relation')
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('stroke', relation => styles[relation.parent!.style!].stroke)
			.attr('fill', relation => styles[relation.parent!.style!].stroke)
			.attr('marker-end', 'url(#arrowhead)')
			.call(RelationSVG.update)
	}

	static update(selection: d3.Selection<SVGLineElement, Relation, d3.BaseType, unknown>, animated: boolean = false) {
		if (selection.empty()) return

		// Lower relations
		selection.lower()

		// Update relations
		selection.each(function(relation) {
			const line = d3.select(this)

			/* We are calculating the line connecting two nodes.
			 * It should start at the center of the start node and end at the BOUNDS of the end node.
			 * We first find some properties of the nodes: their size, center, and the difference between them.
			 * As the calculation of the line depends on the placement of the start node relative to the end node,
			 * we split the plane in 4 quadrants, originating from the start node, following its diagonals.
			 * We then use simple geometry, based on the quadrant the end node resides in, to calculate the bounds of the end node.
			 * The final line is a line from the center of the start node to the calculated bounds of the end node.
			 */

			// Half the width and height of the nodes
			const halfWidth  = settings.FIELD_WIDTH  / 2 + settings.FIELD_MARGIN
			const halfHeight = settings.FIELD_HEIGHT / 2 + settings.FIELD_MARGIN

			// Center of the nodes
			const cxStart = relation.parent!.x - settings.FIELD_MARGIN + halfWidth
			const cyStart = relation.parent!.y - settings.FIELD_MARGIN + halfHeight
			const cxEnd = relation.child!.x - settings.FIELD_MARGIN + halfWidth
			const cyEnd = relation.child!.y - settings.FIELD_MARGIN + halfHeight

			// Difference between the centers
			const dx = cxEnd - cxStart
			const dy = cyEnd - cyStart

			// Check for overlap
			if (Math.abs(dx) < halfWidth && Math.abs(dy) < halfHeight) {
				line.transition()
						.duration(animated ? settings.ANIMATION_DURATION : 0)
						.ease(d3.easeSinInOut)
					.attr('x1', cxStart * settings.GRID_UNIT)
					.attr('y1', cyStart * settings.GRID_UNIT)
					.attr('x2', cxEnd * settings.GRID_UNIT)
					.attr('y2', cyEnd * settings.GRID_UNIT)

				return
			}

			// Bounds
			const ratio = halfHeight / halfWidth
			const posBound =  ratio * dx + cyStart
			const negBound = -ratio * dx + cyStart

			const sign = cyEnd > negBound ? -1 : 1
			const vertQuad = (cyEnd > posBound) == (cyEnd > negBound)

			// Final line
			const x1 = cxStart
			const y1 = cyStart
			const x2 = cxEnd + sign * (vertQuad ? halfHeight * dx / dy : halfWidth)
			const y2 = cyEnd + sign * (vertQuad ? halfHeight : halfWidth * dy / dx)

			line.transition()
					.duration(animated ? settings.ANIMATION_DURATION : 0)
					.ease(d3.easeSinInOut)
				.attr('x1', x1 * settings.GRID_UNIT)
				.attr('y1', y1 * settings.GRID_UNIT)
				.attr('x2', x2 * settings.GRID_UNIT)
				.attr('y2', y2 * settings.GRID_UNIT)
		})
	}
}
