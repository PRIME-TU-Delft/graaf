
// External imports
import * as d3 from 'd3'

// Exports
export { createArrowhead } 

// Functions

function createArrowhead(element: SVGSVGElement) {
    const svg = d3.select<SVGSVGElement, unknown>(element)
    
    // Create arrowhead
    svg.select('defs')
        .append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 5)
            .attr('refY', 5)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto-start-reverse')
            .append('path')
                .attr('fill', 'context-fill')
                .attr('d', `M 0 0 L 10 5 L 0 10 Z`)
}