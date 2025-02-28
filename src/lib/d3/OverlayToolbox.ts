
import * as settings from '$lib/settings'

import { GraphD3 } from './GraphD3'

export { OverlayToolbox }


// -----------------------------> Classes


class OverlayToolbox {
    static clear(graph: GraphD3) {
        graph.overlay
            .interrupt()
            .attr('class', null)
            .style('opacity', 1)
            .style('pointer-events', 'all')
            .selectAll('*')
                .remove()
    }

    static error(graph: GraphD3) {
        OverlayToolbox.clear(graph)

        graph.overlay
            .attr('class', 'error')
            .append('rect')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('fill', 'white')

        const text = graph.overlay
            .append('text')
                .attr('x', '50%')
                .attr('y', '50%')
                .attr('font-size', settings.OVERLAY_BIG_FONT)
                .attr('dominant-baseline', 'middle')
                .attr('text-anchor', 'middle')
                .attr('fill', 'black')

        text.append('tspan')
            .text('Oops!')

        text.append('tspan')
            .text('An error occured while rendering this graph')
                .attr('dy', settings.OVERLAY_BIG_FONT)
                .attr('font-size', settings.OVERLAY_SMALL_FONT)
    }

    static zoom(graph: GraphD3) {
        if (!graph.overlay.classed('zoom')) {
            OverlayToolbox.clear(graph)
        
            graph.overlay
                .attr('class', 'zoom')
                .append('rect')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr('background-color', 'black')
                    .style('opacity', settings.OVERLAY_OPACITY)
        
            const text = graph.overlay
                .append('text')
                    .attr('x', '50%')
                    .attr('y', '50%')
                    .attr('font-size', settings.OVERLAY_BIG_FONT)
                    .attr('dominant-baseline', 'middle')
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')

            text.append('tspan')
                .text('Shift + Scroll to zoom')
        
            text.append('tspan')
                .text('disable this')
                .attr('dy', settings.OVERLAY_BIG_FONT)
                .attr('font-size', settings.OVERLAY_SMALL_FONT)
                .attr('text-decoration', 'underline')
                .style('cursor', 'pointer')
                .on('click', () => {
                    graph.zoom_lock = false
                    OverlayToolbox.clear(graph)
                })
        }
        
        graph.overlay
            .interrupt()
            .style('opacity', 1)
            .transition()
                .duration(settings.OVERLAY_FADE_OUT)
                .delay(settings.OVERLAY_LINGER)
            .style('opacity', 0)
            .on('end', () => {
                OverlayToolbox.clear(graph)
            })
    }
}
