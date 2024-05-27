
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
	graph: Graph

	private _type: GraphType
	private _lecture?: Lecture

	private svg!: SVGSVGElement
	private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>

	private fields: Field[] = []
	private interactive: boolean
	private animating: boolean = false

	constructor(graph: Graph, type: GraphType, interactive: boolean) {
		this.graph = graph
		this.interactive = interactive
		this._type = type
	}

	get type() {
		return this._type
	}

	set type(type: GraphType) {
		if (this.type === type || this.animating) return

		switch (this.type) {
			case GraphType.domains:
				switch (type) {

					// Domains -> Subjects
					case GraphType.subjects:
						this.animating = true
						this.setInteractive(false)
						this.setContent(this.graph.subjects, this.graph.subjectRelations)
						this.moveContent(this.domainTransform)
						this.restoreContent(true, () => {
							this.setInteractive(this.interactive)
							this.animating = false
						})
						break

					// Domains -> Lecture
					case GraphType.lecture:
						if (this.lecture) {
							this.animating = true
							this.setInteractive(false)
							this.setZoomAndPan(0, 0, 1, true)
							this.setContent(this.lecture.subjects, this.lecture.relations)
							this.moveContent(this.domainTransform)
							this.moveContent(this.lectureTransform, true, () => {
								this.setBackground(GraphType.lecture)
								this.moveContent(this.lectureTransform)
								this.animating = false
							})
						}

						else {
							this.setInteractive(false)
							this.setZoomAndPan(0, 0, 1)
							this.setBackground(GraphType.lecture)
							this.clearContent()
						}

				} break

			case GraphType.subjects:
				switch (type) {

					// Subjects -> Domains
					case GraphType.domains:
						this.animating = true
						this.setInteractive(false)
						this.moveContent(this.domainTransform, true, () => {
							this.setContent(this.graph.domains, this.graph.domainRelations, true, () => {
								this.setInteractive(this.interactive)
								this.animating = false
							})
						})

						break

					// Subjects -> Lectures
					case GraphType.lecture:
						if (this.lecture) {
							this.animating = true
							this.setInteractive(false)
							this.setZoomAndPan(0, 0, 1, true)
							this.setContent(this.lecture.subjects, this.lecture.relations, true, () => {
								this.moveContent(this.lectureTransform, true, () => {
									this.setBackground(GraphType.lecture)
									this.moveContent(this.lectureTransform)
									this.animating = false
								})
							})
						}

						else {
							this.setInteractive(false)
							this.setZoomAndPan(0, 0, 1)
							this.setBackground(GraphType.lecture)
							this.clearContent()
						}
				} break

			case GraphType.lecture:
				switch (type) {

					// Lectures -> Domains
					case GraphType.domains:
						if (this.lecture) {
							this.animating = true
							this.setBackground(GraphType.domains)
							this.moveContent(this.lectureTransform)
							this.moveContent(this.domainTransform, true, () => {
								this.setContent(this.graph.domains, this.graph.domainRelations, true, () => {
									this.setInteractive(this.interactive)
									this.animating = false
								})
							})
						}

						else {
							this.animating = true
							this.setBackground(GraphType.domains)
							this.setContent(this.graph.domains, this.graph.domainRelations, true, () => {
								this.setInteractive(this.interactive)
								this.animating = false
							})
						}

						break

					// Lectures -> Subjects
					case GraphType.subjects:
						if (this.lecture) {
							this.animating = true
							this.setBackground(GraphType.subjects)
							this.moveContent(this.lectureTransform)
							this.restoreContent(true, () => {
								this.setContent(this.graph.subjects, this.graph.subjectRelations, true, () => {
									this.setInteractive(this.interactive)
									this.animating = false
								})
							})
						}

						else {
							this.animating = true
							this.setBackground(GraphType.subjects)
							this.setContent(this.graph.subjects, this.graph.subjectRelations, true, () => {
								this.setInteractive(this.interactive)
								this.animating = false
							})
						}
				}
		}

		this._type = type
	}

	get lecture() {
		return this._lecture
	}

	set lecture(lecture: Lecture | undefined) {
		if (this.type !== GraphType.lecture || this.animating) return
		this._lecture = lecture

		if (this.lecture) {
			this.clearContent()
			this.setBackground(GraphType.lecture)
			this.setContent(this.lecture.subjects, this.lecture.relations)
			this.moveContent(this.lectureTransform)
		} else {
			this.clearContent()
			this.setBackground(GraphType.lecture)
		}
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
		const grid = definitions.append('pattern')
			.attr('patternUnits', 'userSpaceOnUse')
			.attr('width', settings.GRID_UNIT)
			.attr('height', settings.GRID_UNIT)
			.attr('id', 'grid')

		grid.append('line')
			.attr('stroke', settings.GRID_COLOR)
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', settings.GRID_UNIT * settings.GRID_MAX_ZOOM)
			.attr('y2', 0)

		grid.append('line')
			.attr('stroke', settings.GRID_COLOR)
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', settings.GRID_UNIT * settings.GRID_MAX_ZOOM)

		// Zoom & pan
		this.zoom = d3.zoom<SVGSVGElement, unknown>()
			.scaleExtent([settings.GRID_MIN_ZOOM, settings.GRID_MAX_ZOOM])
			.on('zoom', event => {

				// Update content
				svg.select('#content')
					.attr('transform', event.transform)

				// Update grid
				svg.select('#grid')
					.attr('x', event.transform.x)
					.attr('y', event.transform.y)
					.attr('width', settings.GRID_UNIT * event.transform.k)
					.attr('height', settings.GRID_UNIT * event.transform.k)
					.selectAll('line')
						.style('opacity', Math.min(1, event.transform.k))
			})

		svg.call(this.zoom)

		// Background & content
		this.setInteractive(this.interactive)
		switch (this.type) {
			case GraphType.domains:
				this.setContent(this.graph.domains, this.graph.domainRelations)
				this.setBackground(GraphType.domains)
				break

			case GraphType.subjects:
				this.setContent(this.graph.subjects, this.graph.subjectRelations)
				this.setBackground(GraphType.subjects)
				break

			case GraphType.lecture:
				if (!this.lecture) break
				this.setContent(this.lecture.subjects, this.lecture.relations)
				this.moveContent(this.lectureTransform)
				this.setBackground(GraphType.lecture)
				break
		}
	}

	private setInteractive(interactive: boolean) {

		// Set pointer events
		d3.select<SVGSVGElement, unknown>(this.svg)
			.style('pointer-events', interactive ? 'all' : 'none')
	}

	private setZoomAndPan(x: number, y: number, k: number, animate: boolean = false, callback: () => void = () => {}) {

		// Call zoom with custom transform
		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(animate ? settings.ANIMATION_DURATION : 0)
				.ease(d3.easeSinInOut)
			.call(
				this.zoom.transform,
				d3.zoomIdentity.translate(x, y).scale(k)
			)

		// Post-transition
		setTimeout(() => {
			callback()
		}, animate ? settings.ANIMATION_DURATION : 0)
	}

	private setContent(fields: Field[], relations: Relation<Field>[], fade: boolean = false, callback: () => void = () => {}) {
		const content = d3.select<SVGGElement, unknown>('#content')
		this.fields = fields

		// Update Relations
		content.selectAll<SVGLineElement, Relation<Field>>('.relation')
			.data(relations, relation => relation.id)
			.join(
				function(enter) {
					return enter
						.append('line')
						.call(RelationSVG.create)
						.style('opacity', 0)
				},

				function(update) {
					return update
				},

				function(exit) {
					return exit
						.transition()
							.duration(fade ? settings.FADE_DURATION : 0)
							.on('end', function() { d3.select(this).remove() }) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0)
				}
			)
			.transition()
				.duration(fade ? settings.FADE_DURATION : 0)
				.ease(d3.easeSinInOut)
			.style('opacity', 1)

		// Update Fields
		content.selectAll<SVGGElement, Field>('.field')
			.data(fields, field => field.id)
			.join(
				function(enter) {
					return enter
						.append('g')
						.call(FieldSVG.create)
						.style('opacity', 0)
				},

				function(update) {
					return update
				},

				function(exit) {
					return exit
						.transition()
							.duration(fade ? settings.FADE_DURATION : 0)
							.on('end', function() { d3.select(this).remove() }) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0)
				}
			)
			.transition()
				.duration(fade ? settings.FADE_DURATION : 0)
			.style('opacity', 1)

		// Post-transition
		setTimeout(() => {
			callback()
		}, fade ? settings.FADE_DURATION : 0)
	}

	private moveContent(transform: (value: Field, graphSVG: GraphSVG) => void, animate: boolean = false, callback: () => void = () => {}) {

		// Buffer field positions
		const buffers = this.fields.map(field => ({ field, x: field.x, y: field.y }))

		// Set field positions
		for (let i = 0; i < this.fields.length; i++) {
			const field = this.fields[i]
			transform(field, this)
		}

		// Update fields
		d3.select<SVGSVGElement, unknown>(this.svg)
			.select('#content')
				.selectAll<SVGGElement, Field>('.field')
					.each(function() { FieldSVG.update(d3.select(this), animate) })

		// Restore field positions
		for (const buffer of buffers) {
			buffer.field.x = buffer.x
			buffer.field.y = buffer.y
		}

		// Post-transition
		setTimeout(() => {
			callback()
		}, animate ? settings.ANIMATION_DURATION : 0)
	}

	private restoreContent(animate: boolean = false, callback: () => void = () => {}) {

		// As the field positions are always maintained, we can just update them
		this.moveContent(() => {}, animate, callback)
	}

	private clearContent(fade: boolean = false, callback: () => void = () => {}) {
		this.fields = []

		// Clear content
		d3.select(this.svg)
			.select('#content')
				.selectAll('*')
					.transition()
						.duration(fade ? settings.FADE_DURATION : 0)
						.ease(d3.easeSinInOut)
						.on('end', function () { d3.select(this).remove()})
					.style('opacity', 0)

		// Post-transition
		setTimeout(() => {
			callback()
		}, fade ? settings.FADE_DURATION : 0)
	}

	private setBackground(type: GraphType) {
		const svg = d3.select<SVGSVGElement, unknown>(this.svg)
		const background = svg.select<SVGGElement>('#background')

		// Remove old background
		background.selectAll('*')
			.remove()

		// Add new background
		switch (type) {
			case GraphType.domains:
			case GraphType.subjects:

				// Set svg size
				svg
					.attr('width', '100%')
					.attr('height', '100%')

				// Grid
				background
					.append('rect')
						.attr('fill', 'url(#grid)')
						.attr('width', '100%')
						.attr('height', '100%')

				break

			case GraphType.lecture:
				const size = this.lecture?.size || 0

				// Set svg size
				svg
					.attr('width', settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT * 3 + settings.STROKE_WIDTH)
					.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING + settings.LECTURE_HEADER_HEIGHT) * settings.GRID_UNIT + settings.STROKE_WIDTH)

				// Past subject colunm
				background.append('rect')
					.attr('x', settings.STROKE_WIDTH / 2)
					.attr('y', settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
					.attr('width', settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
					.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
					.attr('stroke-width', settings.STROKE_WIDTH)
					.attr('fill', 'transparent')
					.attr('stroke', 'black')

				background.append('text')
					.text('Past Topics')
					.style('font-size', settings.LECTURE_FONT_SIZE)
					.attr('x', (settings.STROKE_WIDTH + settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'hanging')

				// Present subject column
				background.append('rect')
					.attr('x', settings.STROKE_WIDTH / 2 + settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
					.attr('y', settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
					.attr('width', settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
					.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
					.attr('stroke-width', settings.STROKE_WIDTH)
					.attr('fill', 'transparent')
					.attr('stroke', 'black')

				background.append('text')
					.text('This Lecture')
					.style('font-size', settings.LECTURE_FONT_SIZE)
					.attr('x', (settings.STROKE_WIDTH + 3 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'hanging')

				// Future subject column
				background.append('rect')
					.attr('x', settings.STROKE_WIDTH / 2 + 2 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
					.attr('y', settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
					.attr('width', settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
					.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
					.attr('stroke-width', settings.STROKE_WIDTH)
					.attr('fill', 'transparent')
					.attr('stroke', 'black')

				background.append('text')
					.text('Future Topics')
					.style('font-size', settings.LECTURE_FONT_SIZE)
					.attr('x', (settings.STROKE_WIDTH + 5 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'hanging')
		}
	}

	private lectureTransform(subject: Subject, graphSVG: GraphSVG) {

		// Get bounding box and size
		const bbx = d3.select<SVGGElement, unknown>('#background').node()!.getBBox()
		const size = graphSVG.lecture?.size || 0
		const dx = (bbx.width / settings.GRID_UNIT - 3 * settings.LECTURE_COLUMN_WIDTH) / 2
		const dy = (bbx.height / settings.GRID_UNIT - size * settings.FIELD_HEIGHT - (size + 1) * settings.LECTURE_PADDING - settings.LECTURE_HEADER_HEIGHT) / 2

		// Set past subject positions to the right column
		const pastSubjects = graphSVG.lecture?.pastSubjects
		if (pastSubjects?.includes(subject)) {
			const index = pastSubjects.indexOf(subject)
			subject.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_PADDING
			subject.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
			return
		}

		// Set present subject positions to the middle column
		const presentSubjects = graphSVG.lecture?.presentSubjects
		if (presentSubjects?.includes(subject)) {
			const index = presentSubjects.indexOf(subject)
			subject.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_COLUMN_WIDTH + settings.LECTURE_PADDING
			subject.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
			return
		}

		// Set future subject positions to the left column
		const futureSubjects = graphSVG.lecture?.futureSubjects
		if (futureSubjects?.includes(subject)) {
			const index = futureSubjects.indexOf(subject)
			subject.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + 2 * settings.LECTURE_COLUMN_WIDTH + settings.LECTURE_PADDING
			subject.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
			return
		}
	}

	private domainTransform(subject: Subject) {

		// Set subject positions to their respective domains
		subject.x = subject.domain!.x
		subject.y = subject.domain!.y
	}
}