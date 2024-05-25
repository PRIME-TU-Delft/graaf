
// External imports
import * as d3 from 'd3'

// Internal imports
import { Graph, Field, Subject, Relation, Lecture } from './entities'
import { FieldSVG } from './fieldSVG'
import { RelationSVG } from './relationSVG'
import * as settings from './settings'

// Exports
export { GraphSVG, GraphType }

enum GraphType {
	domains,
	subjects,
	lecture
}

class GraphSVG {
	private fields: Field[] = []
	private animating: boolean = false

	private _graph: Graph
	private _svg?: SVGSVGElement
	private _type: GraphType
	private _lecture?: Lecture
	private _interactive: boolean

	constructor(graph: Graph, type: GraphType, interactive: boolean) {
		this._graph = graph
		this._type = type
		this._interactive = interactive
	}

	create(element: SVGSVGElement) {
		this.svg = element

		// D3 setup
		const svg = d3.select<SVGSVGElement, unknown>(this.svg)
		const definitions = svg.append('defs')
		svg.append('g').attr('id', 'background')
		svg.append('g').attr('id', 'content')

		// Arrowhead pattern
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

		// Grid pattern
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

		// Background & content
		this.updateBackground()
		switch (this.type) {
			case GraphType.domains:
				this.setContent(this.graph.domains, this.graph.domainRelations)
				break

			case GraphType.subjects:
				this.setContent(this.graph.subjects, this.graph.subjectRelations)
				break

			case GraphType.lecture:
				if (!this.lecture) break
				this.setContent(this.lecture.subjects, this.lecture.relations)
				this.moveContent(this.lectureTransform)
				break
		}
	}

	get interactive() {
		return this._interactive
	}

	set interactive(interactive: boolean) {
		if (!this._svg) throw new Error('SVG not created')
		if (this.animating) throw new Error('Animation in progress')
		this._interactive = interactive

		const svg = d3.select<SVGSVGElement, unknown>(this._svg)
			.style('pointer-events', this.interactive ? 'all' : 'none')
	
		// Reset transform
		if (this.interactive) return
		const content = svg.select('#content')
	
		// Update content
		content.attr('transform', null)
	
		// Update grid
		svg.select('#grid')
			.attr('x', null)
			.attr('y', null)
			.attr('width', '100%')
			.attr('height', '100%')
			.selectAll('line')
				.attr('opacity', null)
	}

	get graph() {
		return this._graph
	}

	private get svg() {
		if (!this._svg) throw new Error('SVG not created')
		return this._svg
	}

	private set svg(svg: SVGSVGElement) {
		this._svg = svg
	}

	get type() {
		return this._type
	}

	set type(type: GraphType) {
		if (this.type === type) return
		if (this.animating) throw new Error('Animation in progress')

		switch (this.type) {
			case GraphType.domains:
				switch (type) { 

					// Domains -> Subjects
					case GraphType.subjects:
						this._type = type
						this.setContent(this.graph.subjects, this.graph.subjectRelations)
						this.moveContent(this.domainTransform)
						this.restoreContent(true)
						break

					// Domains -> Lecture
					case GraphType.lecture:
						this._type = type
						if (!this.lecture) {
							this.clearContent(true, () => {
								this.updateBackground()
							})

							break
						}

						this.setContent(this.lecture.subjects, this.lecture.relations)
						this.moveContent(this.domainTransform)
						this.moveContent(this.lectureTransform, true, () => {
							this.updateBackground()
						})
				} break

			case GraphType.subjects:
				switch (type) {

					// Subjects -> Domains
					case GraphType.domains:
						this._type = type
						this.moveContent(this.domainTransform, true, () => {
							this.setContent(this.graph.domains, this.graph.domainRelations, true)
						})

						break

					// Subjects -> Lectures
					case GraphType.lecture:
						this._type = type
						if (!this.lecture) {
							this.clearContent(true, () => {
								this.updateBackground()
							})

							break
						}

						this.setContent(this.lecture.subjects, this.lecture.relations, true, () => {
							this.moveContent(this.lectureTransform, true, () => {
								this.updateBackground()
							})
						})
				} break

			case GraphType.lecture:
				switch (type) {

					// Lectures -> Domains
					case GraphType.domains:
						this._type = type
						if (!this.lecture) {
							this.updateBackground()
							this.setContent(this.graph.domains, this.graph.domainRelations, true)
							break
						}

						this.updateBackground()
						this.moveContent(this.domainTransform, true, () => {
							this.setContent(this.graph.domains, this.graph.domainRelations, true)
						})

						break

					// Lectures -> Subjects
					case GraphType.subjects:
						this._type = type
						if (!this._lecture) {
							this.updateBackground()
							this.setContent(this.graph.subjects, this.graph.subjectRelations, true)
							break
						}

						this.updateBackground()
						this.restoreContent(true, () => {
							this.setContent(this.graph.subjects, this.graph.subjectRelations, true)
						})

						break
				}
		}
	}

	get lecture() {
		return this._lecture
	}

	set lecture(lecture: Lecture | undefined) {
		this._lecture = lecture

		if (this.type !== GraphType.lecture) return
		if (this.animating) throw new Error('Animation in progress')
		
		if (!this.lecture) {
			this.clearContent()
			this.updateBackground()
			return
		}
		
		this.clearContent()
		this.setContent(this.lecture.subjects, this.lecture.relations)
		this.moveContent(this.lectureTransform)
		this.updateBackground()
	}

	private setContent(fields: Field[], relations: Relation<Field>[], fade: boolean = false, callback: () => void = () => {}) {
		const content = d3.select<SVGSVGElement, unknown>(this.svg)
			.select('#content')
		this.fields = fields

		// Remove old content
		this.animating = fade
		content.selectAll<SVGGElement, Field>('.field')
			.each(function (field) {
				if (fields.includes(field)) {
					fields.splice(fields.indexOf(field), 1)
				} else {
					d3.select(this)
						.transition()
							.duration(fade ? settings.TRANSITION_DURATION : 0)
							.ease(d3.easeSinInOut)
							.on('end', () => this.remove() )
						.attr('opacity', 0)
				}
			})

		content.selectAll<SVGGElement, Relation<Field>>('.relation')
			.each(function (relation) {
				if (relations.includes(relation)) {
					relations.splice(relations.indexOf(relation), 1)
				} else {
					d3.select(this)
						.transition()
							.duration(fade ? settings.TRANSITION_DURATION : 0)
							.ease(d3.easeSinInOut)
							.on('end', () => this.remove())
						.attr('opacity', 0)
				}
			})

		// Add new content
		content.selectAll<SVGGElement, Field>('.field')
			.data(fields)
			.enter()
			.append('g')
				.call(function () { FieldSVG.create(this) })
				.attr('opacity', 0)
				.transition()
					.duration(fade ? settings.TRANSITION_DURATION : 0)
					.ease(d3.easeSinInOut)
				.attr('opacity', 1)

		content.selectAll<SVGGElement, Relation<Field>>('.relation')
			.data(relations)
			.enter()
			.append('g')
				.call(relation => RelationSVG.create(this))
				.attr('opacity', 0)
				.transition()
					.duration(fade ? settings.TRANSITION_DURATION : 0)
					.ease(d3.easeSinInOut)
				.attr('opacity', 1)
		
		// Post-transition
		setTimeout(() => {
			this.animating = false
			callback()
		}, fade ? settings.TRANSITION_DURATION : 0)
	}

	private moveContent(transform: (value: Field, index: number, array: Field[]) => void, animate: boolean = false, callback: () => void = () => {}) {

		// Buffer field positions
		const buffers = this.fields.map(field => ({ field, x: field.x, y: field.y }))

		// Set field positions
		this.fields.forEach(transform)

		// Update fields
		this.animating = animate
		d3.select<SVGSVGElement, unknown>(this.svg)
			.select('#content')
				.selectAll<SVGGElement, Field>('.field')
					.each(FieldSVG.update(this, animate))

		// Restore field positions
		for (const buffer of buffers) {
			buffer.field.x = buffer.x
			buffer.field.y = buffer.y
		}

		// Post-transition
		setTimeout(() => {
			this.animating = false
			callback()
		}, animate ? settings.TRANSITION_DURATION : 0)
	}

	private restoreContent(animate: boolean = false, callback: () => void = () => {}) {
		this.moveContent(() => {}, animate, callback)
	}

	private clearContent(fade: boolean = false, callback: () => void = () => {}) {
		this.fields = []

		// Clear content
		this.animating = fade
		d3.select(this.svg)
			.select('#content')
				.selectAll('*')
					.transition()
						.duration(fade ? settings.TRANSITION_DURATION : 0)
						.ease(d3.easeSinInOut)
						.on('end', function () { d3.select(this).remove()})
					.attr('opacity', 0)
		
		// Post-transition
		setTimeout(() => {
			this.animating = false
			callback()
		}, fade ? settings.TRANSITION_DURATION : 0)
	}

	private updateBackground() {
		const svg = d3.select<SVGSVGElement, unknown>(this.svg)
		const background = svg.select('#background')
		const content = svg.select('#content')

		// Remove old background
		this.clearBackground()

		// Add new background
		switch (this.type) {
			case GraphType.domains:
			case GraphType.subjects:

				// Set interactive
				this.interactive = this.interactive

				// Grid
				background.append('rect')
					.attr('fill', 'url(#grid)')
					.attr('width', '100%')
					.attr('height', '100%')

				// Zoom & pan
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

			case GraphType.lecture:
				const size = this.lecture ? Math.max(
					this.lecture.pastSubjects.length,
					this.lecture.presentSubjects.length,
					this.lecture.futureSubjects.length
				) : 0

				// Set interactive
				this.interactive = false

				// Past subjects
				background.append('rect')
					.attr('x', settings.STROKE_WIDTH / 2)
					.attr('y', settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
					.attr('width', settings.LECTURE_WIDTH * settings.GRID_UNIT)
					.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
					.attr('stroke-width', settings.STROKE_WIDTH)
					.attr('fill', 'transparent')
					.attr('stroke', 'black')

				background.append('text')
					.attr('x', (settings.STROKE_WIDTH + settings.LECTURE_WIDTH * settings.GRID_UNIT) / 2)
					.attr('y', settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT / 2)
					.attr('font-size', settings.LECTURE_FONT_SIZE)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'middle')
					.text('Past Topics')

				// Present subjects
				background.append('rect')
					.attr('x', settings.STROKE_WIDTH / 2 + settings.LECTURE_WIDTH * settings.GRID_UNIT)
					.attr('y', settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
					.attr('width', settings.LECTURE_WIDTH * settings.GRID_UNIT)
					.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
					.attr('stroke-width', settings.STROKE_WIDTH)
					.attr('fill', 'transparent')
					.attr('stroke', 'black')

				background.append('text')
					.attr('x', (settings.STROKE_WIDTH + 3 * settings.LECTURE_WIDTH * settings.GRID_UNIT) / 2)
					.attr('y', settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT / 2)
					.attr('font-size', settings.LECTURE_FONT_SIZE)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'middle')
					.text('This Lecture')

				// Future subjects
				background.append('rect')
					.attr('x', settings.STROKE_WIDTH / 2 + 2 * settings.LECTURE_WIDTH * settings.GRID_UNIT)
					.attr('y', settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
					.attr('width', settings.LECTURE_WIDTH * settings.GRID_UNIT)
					.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
					.attr('stroke-width', settings.STROKE_WIDTH)
					.attr('fill', 'transparent')
					.attr('stroke', 'black')

				background.append('text')
					.attr('x', (settings.STROKE_WIDTH + 5 * settings.LECTURE_WIDTH * settings.GRID_UNIT) / 2)
					.attr('y', settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT / 2)
					.attr('font-size', settings.LECTURE_FONT_SIZE)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'middle')
					.text('Future Topics')
		}
	}

	private clearBackground() {
		d3.select(this.svg)
			.select('#background')
				.selectAll('*')
					.remove()
	}

	private lectureTransform(field: Field, index: number) {
		if (this._lecture?.pastSubjects.includes(field)) {
			field.x = settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_PADDING
			field.y = settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
		} else if (this._lecture?.presentSubjects.includes(field)) {
			field.x = settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_WIDTH + settings.LECTURE_PADDING
			field.y = settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
		} else if (this._lecture?.futureSubjects.includes(field)) {
			field.x = settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + 2 * settings.LECTURE_WIDTH + settings.LECTURE_PADDING
			field.y = settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
		}
	}

	private domainTransform(subject: Subject) {
		subject.x = subject.domain!.x
		subject.y = subject.domain!.y
	}
}