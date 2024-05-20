
// External imports
import * as d3 from 'd3'

// Internal imports
import { Graph, Field } from './entities'
import { createField, updateField } from './field'
import { createRelation } from './relation'
import * as settings from './settings'

export enum LayoutType {
    domain = 0,
    subject = 1
}

export class Layout {
    graph: Graph
    type: LayoutType = LayoutType.domain
    svg?: SVGSVGElement
    timeout?: NodeJS.Timeout

    constructor(graph: Graph) {
        this.graph = graph
    }

    setup(element: SVGSVGElement): void {
        this.svg = element

        // D3 Magic
        const svg = d3.select<SVGSVGElement, unknown>(element)
        const definitions = svg.append('defs')
        const content = svg.append('g')
            .attr('id', 'content')
        
        // Create arrowhead
        definitions.append('marker')
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

        // Create grid
        const pattern = definitions.append('pattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', settings.GRID_UNIT)
            .attr('height', settings.GRID_UNIT)
            .attr('id', 'grid')

        pattern.append('line')
            .attr('stroke', settings.GRID_COLOR)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', settings.GRID_UNIT * settings.GRID_MAX_ZOOM)
            .attr('y2', 0)

        pattern.append('line')
            .attr('stroke', settings.GRID_COLOR)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', settings.GRID_UNIT * settings.GRID_MAX_ZOOM)

        svg.append('rect')
            .attr('fill', 'url(#grid)')
            .attr('width', '100%')
            .attr('height', '100%')
            .lower()

        // Grid events
        svg.call(
            d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([settings.GRID_MIN_ZOOM, settings.GRID_MAX_ZOOM])
                .on('zoom', (event) => {
                
                    // Update content
                    content.attr('transform', event.transform)
                
                    // Update grid
                    svg.select('#grid')
                        .attr('x', event.transform.x)
                        .attr('y', event.transform.y)
                        .attr('width', settings.GRID_UNIT * event.transform.k)
                        .attr('height', settings.GRID_UNIT * event.transform.k)
                        .selectAll('line')
                            .attr('opacity', Math.min(1, event.transform.k))
                })
        )

        // Fill content
        this._fill()
    }

    show(type: LayoutType): void {
        if (this.type === type) return
        this.type = type

        if (this.type === LayoutType.domain) {

            // Save the current layout
            const buffers = this.graph.subjects.map(subject => ({ subject, x: subject.x, y: subject.y }))

            // Move the subjects to their domain
            for (let subject of this.graph.subjects) {
                subject.x = subject.domain!.x
                subject.y = subject.domain!.y
            }

            // Animate
            this._animate()

            // Restore the layout
            for (let buffer of buffers) {
                buffer.subject.x = buffer.x
                buffer.subject.y = buffer.y
            }

            // Show the domains after the animation
            this.timeout = setTimeout(() => {
                this._clear()
                this._fill()
                this.timeout = undefined
            }, settings.TRANSITION_DURATION)

        } else if (this.timeout) {

            // Cancel the animation towards domains
            clearTimeout(this.timeout)
            this.timeout = undefined

            // Restore subject positions
            this._animate()

        } else {

            // Save the current layout
		    const buffers = this.graph.subjects.map(subject => ({ subject, x: subject.x, y: subject.y }))

		    // Move the subjects to their domain
            for (let subject of this.graph.subjects) {
		    	subject.x = subject.domain!.x
		    	subject.y = subject.domain!.y
		    }

		    // Create the new layout
		    this._clear()
		    this._fill()

		    // Move the subjects back to their original position
            for (let buffer of buffers) {
		    	buffer.subject.x = buffer.x
		    	buffer.subject.y = buffer.y
		    }

		    // Animate
		    this._animate()
        }
    }

    _fill(): void {
        if (this.svg === undefined) return
        const svg = d3.select<SVGSVGElement, unknown>(this.svg)
        const content = svg.select('#content')
        const fields =  this.type === LayoutType.domain ? this.graph.domains : this.graph.subjects
        const relations = this.type === LayoutType.domain ? this.graph.domainRelations : this.graph.subjectRelations
    
        // Create relations
        content.selectAll('line')
            .data(relations)
            .enter()
            .append('line')
                .each(function() {
                    createRelation(this)
                })
    
        // Create fields
        content.selectAll('g')
            .data(fields)
            .enter()
            .append('g')
                .each(function() {
                    createField(this)
                })
    }

    _clear(): void {
        if (this.svg === undefined) return
        const svg = d3.select<SVGSVGElement, unknown>(this.svg)
	    const content = svg.select('#content')
	    content.selectAll('*').remove()
    }

    _animate(): void {
        if (this.svg === undefined) return
        const svg = d3.select<SVGSVGElement, unknown>(this.svg);
        const content = svg.select('#content')
    
        content.selectAll<SVGGElement, Field>('g')
            .each(function() {
                updateField(this, true);
            })
    }
}

