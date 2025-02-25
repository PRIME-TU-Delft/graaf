
// External imports
import * as d3 from 'd3'

// Internal imports
import * as settings from '$scripts/settings'
import { NODE_STYLES } from '$scripts/settings'

import {
	DomainController, 
	SubjectController, 
	RelationController 
} from '$scripts/controllers'

// Exports
export { RelationSVG }


// --------------------> Classes

type RelationSelection = d3.Selection<SVGLineElement, RelationController<DomainController | SubjectController>, d3.BaseType, unknown>

class RelationSVG {
	static create(selection: RelationSelection) {
		selection
			.attr('id', relation => relation.uuid)
			.attr('class', 'relation')
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('stroke', relation => NODE_STYLES[relation.parent!.style!].stroke)
			.attr('fill', relation => NODE_STYLES[relation.parent!.style!].stroke)
			.attr('marker-end', 'url(#arrowhead)')
			.call(RelationSVG.update)
	}

	static update(selection: RelationSelection, animated: boolean = false) {

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
			const halfWidth  = settings.NODE_WIDTH / 2 + settings.NODE_MARGIN
			const halfHeight = settings.NODE_HEIGHT / 2 + settings.NODE_MARGIN

			// Center of the nodes
			const cxStart = relation.parent!.x - settings.NODE_MARGIN + halfWidth
			const cyStart = relation.parent!.y - settings.NODE_MARGIN + halfHeight
			const cxEnd = relation.child!.x - settings.NODE_MARGIN + halfWidth
			const cyEnd = relation.child!.y - settings.NODE_MARGIN + halfHeight

			// Difference between the centers
			const dx = cxEnd - cxStart
			const dy = cyEnd - cyStart

			// Check for overlap
			if (Math.abs(dx) < halfWidth && Math.abs(dy) < halfHeight) {
				line.transition()
						.duration(animated ? settings.GRAPH_ANIMATION_DURATION : 0)
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
					.duration(animated ? settings.GRAPH_ANIMATION_DURATION : 0)
					.ease(d3.easeSinInOut)
				.attr('x1', x1 * settings.GRID_UNIT)
				.attr('y1', y1 * settings.GRID_UNIT)
				.attr('x2', x2 * settings.GRID_UNIT)
				.attr('y2', y2 * settings.GRID_UNIT)
		})
	}
}
