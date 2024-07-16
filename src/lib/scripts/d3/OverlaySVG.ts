
// External imports
import * as d3 from 'd3'

// Internal imports
import { GraphSVG } from '.'
import * as settings from '../settings'

// Exports
export { OverlaySVG }


// --------------------> 


type OverlaySelection = d3.Selection<SVGGElement, unknown, HTMLElement, any>


// --------------------> Classes


class OverlaySVG {
	static reset(selection: OverlaySelection) {
		selection
			.interrupt()
			.attr('class', null)
			.style('opacity', 1)
			.style('pointer-events', 'none')
			.selectAll('*')
				.remove()
	}

	static brokenGraph(selection: OverlaySelection) {
		if (selection.classed('broken')) return
		OverlaySVG.reset(selection)

		selection
			.attr('class', 'broken')

		selection.append('rect')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('fill', 'white')			

		const text = selection.append('text')
		text.append('tspan')
			.text('Oops!')
			.attr('x', '50%')
			.attr('y', '50%')
			.attr('font-size', settings.OVERLAY_BIG_FONT)
			.attr('dominant-baseline', 'middle')
			.attr('text-anchor', 'middle')
			.attr('fill', 'black')

		text.append('tspan')
			.text('There are outstanding errors')
			.attr('x', '50%')
			.attr('y', '50%')
			.attr('dy', settings.OVERLAY_BIG_FONT)
			.attr('font-size', settings.OVERLAY_SMALL_FONT)
			.attr('dominant-baseline', 'middle')
			.attr('text-anchor', 'middle')
			.attr('fill', 'black')
	}

	static shiftScroll(selection: OverlaySelection, graphSVG: GraphSVG) {
		if (!selection.classed('shift-scroll')) {
			OverlaySVG.reset(selection)

			selection
                .attr('class', 'shift-scroll')
            
		    selection.append('rect')
		    	.attr('width', '100%')
		    	.attr('height', '100%')
		    	.attr('background-color', 'black')
		    	.style('opacity', settings.OVERLAY_OPACITY)

		    const text = selection.append('text')
		    text.append('tspan')
		    	.text('Shift + Scroll to zoom')
                .attr('x', '50%')
		    	.attr('y', '50%')
		    	.attr('font-size', settings.OVERLAY_BIG_FONT)
		    	.attr('dominant-baseline', 'middle')
                .attr('text-anchor', 'middle')
		    	.attr('fill', 'white')

		    text.append('tspan')
		    	.text('disable this')
                .attr('x', '50%')
		    	.attr('y', '50%')
		    	.attr('dy', settings.OVERLAY_BIG_FONT)
		    	.attr('font-size', settings.OVERLAY_SMALL_FONT)
		    	.attr('text-decoration', 'underline')
		    	.attr('dominant-baseline', 'middle')
		    	.attr('text-anchor', 'middle')
		    	.style('cursor', 'pointer')
		    	.attr('fill', 'white')
				.on('click', () => {
					graphSVG.shift_required = false
					OverlaySVG.reset(selection)
				})
		}

		selection
			.interrupt()
			.style('opacity', 1)
			.style('pointer-events', 'all')
			.transition()
				.duration(settings.OVERLAY_FADE_OUT)
				.delay(settings.OVERLAY_LINGER)
			.style('opacity', 0)
			.on('end', () => {
				OverlaySVG.reset(selection)
			})
	}
}