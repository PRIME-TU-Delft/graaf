
// External imports
import * as d3 from 'd3'

// Internal imports
import { Graph, Field, Subject, Relation, Lecture } from './entities'
import { createArrowhead } from './arrowhead'
import { FieldSVG } from './fieldSVG'
import { RelationSVG } from './relationSVG'
import * as settings from './settings'

// Exports
export { GraphSVG, GraphType }

// Enums
enum GraphType {
	domain = 0,
	subject = 1,
	lecture = 2
}

// Classes
class GraphSVG {
	graph: Graph
	interactive: boolean
	svg?: SVGSVGElement
	type?: GraphType
	lecture?: Lecture
	animating_from?: GraphType

	constructor(graph: Graph, interactive: boolean) {
		this.graph = graph
		this.interactive = interactive
	}

	create(element: SVGSVGElement) {
		this.svg = element
		this.type = GraphType.domain

		// D3 setup
		const svg = d3.select<SVGSVGElement, unknown>(element)
		const definitions = svg.append('defs')
		svg.append('g').attr('id', 'background')
		svg.append('g').attr('id', 'content')

		// Arrowhead pattern
		createArrowhead(element)

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

		// Show graph
		this._updateBackground()
		this._setContent(this.graph.domains, this.graph.domainRelations)
	}

	// Dear lord, forgive me for I have sinned
	show(type: GraphType, lecture?: Lecture) {
		if (this.svg === undefined ||
			(this.type !== GraphType.lecture && this.type === type) ||
			(this.type === GraphType.lecture && this.lecture === lecture)
		) return

		var buffers: { field: Field, x: number, y: number }[]

		switch (this.type) {
			case GraphType.domain:
				switch (type) {

					// Domain to subject
					case GraphType.subject:
						this.type = type
						this.lecture = undefined
						
						switch (this.animating_from) {
							case GraphType.subject:

								// Animate towards subject
								this.animating_from = GraphType.domain
								this._animate(() => { this.animating_from = undefined })
								break
							
							case GraphType.lecture:

								// TODO figure out how to animate this
								this._interrupt()
								this._updateBackground()
								this._setContent(this.graph.subjects, this.graph.subjectRelations)
								break
							
							default:

								// Animate towards subject
								buffers = this._bufferLayout(this.graph.subjects)
								this._moveSubjectsToDomains(this.graph.subjects)
								this._setContent(this.graph.subjects, this.graph.subjectRelations)
								this._restoreLayout(buffers)
								this.animating_from = GraphType.domain
								this._animate(() => { this.animating_from = undefined })
						} break

					// Domain to lecture
					case GraphType.lecture:
						this.type = type
						this.lecture = lecture

						// If lecture is undefined, do not animate
						if (this.lecture === undefined) {
							this._interrupt()
							this._updateBackground()
							this._clearContent()
							return
						}

						// Gather data
						const parents = this.lecture.parents()
						const children = this.lecture.children()
						const subjects = this.lecture.subjects.concat(parents, children) as Subject[]
						const relations = this.lecture.relations()
						buffers = this._bufferLayout(subjects)

						switch (this.animating_from) {
							case GraphType.subject:
							case GraphType.lecture:

								// TODO figure out how to animate this
								this._interrupt()
								this._moveSubjectsToLecture(parents, this.lecture.subjects as Subject[], children)
								this._updateBackground()
								this._setContent(subjects, relations)
								this._restoreLayout(buffers)
								break
							
							default:

								// Animate towards lecture
								this._moveSubjectsToDomains(subjects)
								this._setContent(subjects, relations)
								this._moveSubjectsToLecture(parents, this.lecture.subjects as Subject[], children)
								this.animating_from = GraphType.domain
								this._animate(() => {
									this.animating_from = undefined
									this._updateBackground()
								})

								this._restoreLayout(buffers)
						}
				} break

			case GraphType.subject:
				switch (type) {

					// Subject to domain
					case GraphType.domain:
						this.type = type
						this.lecture = undefined

						// Animate towards domain
						buffers = this._bufferLayout(this.graph.subjects)
						this._moveSubjectsToDomains(this.graph.subjects)
						this.animating_from = GraphType.subject
						this._animate(() => {
							this.animating_from = undefined
							this._setContent(this.graph.domains, this.graph.domainRelations)
						})

						this._restoreLayout(buffers)
						break

					// Subject to lecture
					case GraphType.lecture:
						this.type = type
						this.lecture = lecture

						// If lecture is undefined, do not animate
						if (this.lecture === undefined) {
							this._updateBackground()
							this._clearContent()
							return
						}

						// Gather data
						const parents = this.lecture.parents()
						const children = this.lecture.children()
						const subjects = this.lecture.subjects.concat(parents, children) as Subject[]
						const relations = this.lecture.relations()

						// Animate towards lecture
						this._setContent(subjects, relations)
						buffers = this._bufferLayout(subjects)
						this._moveSubjectsToLecture(parents, this.lecture.subjects as Subject[], children)
						this.animating_from = GraphType.subject
						this._animate(() => {
							this.animating_from = undefined
							this._updateBackground()
						})

						this._restoreLayout(buffers)
						break
				
				} break

			case GraphType.lecture:
				switch (type) {

					// Lecture to domain
					case GraphType.domain:
						this.type = type
						this._updateBackground()

						// If lecture is undefined, do not animate
						if (this.lecture === undefined) {
							this._setContent(this.graph.domains, this.graph.domainRelations)
							return
						}

						// Gather data
						var parents = this.lecture.parents()
						var children = this.lecture.children()
						var subjects = this.lecture.subjects.concat(parents, children) as Subject[]
						this.lecture = undefined

						// Animate towards domain
						buffers = this._bufferLayout(subjects)
						this._moveSubjectsToDomains(subjects)
						this.animating_from = GraphType.lecture
						this._animate(() => {
							this.animating_from = undefined
							this._setContent(this.graph.domains, this.graph.domainRelations)
						})

						this._restoreLayout(buffers)
						break

					// Lecture to subject
					case GraphType.subject:
						this.type = type
						this.lecture = undefined

						// TODO figure out how to animate this
						this._setContent(this.graph.subjects, this.graph.subjectRelations)
						this._updateBackground()
						break

					// Lecture to lecture
					case GraphType.lecture:
						this.lecture = lecture

						// If lecture is undefined, do not animate
						if (this.lecture === undefined) {
							this._updateBackground()
							this._clearContent()
							return
						}

						// Gather data
						var parents = this.lecture.parents()
						var children = this.lecture.children()
						var subjects = this.lecture.subjects.concat(parents, children) as Subject[]
						var relations = this.lecture.relations()

						// Show new lecture
						buffers = this._bufferLayout(subjects)
						this._moveSubjectsToLecture(parents, this.lecture.subjects as Subject[], children)
						this._setContent(subjects, relations)
						this._updateBackground()
						this._restoreLayout(buffers)			
				}
		}
	}

	_updateBackground() {
		if (this.svg === undefined) return

		// D3 setup
		const svg = d3.select(this.svg)
		const background = svg.select('#background')
		const content = svg.select('#content')

		// Clear background
		background.selectAll('*')
			.remove()

		// Lecture background
		if (this.type === GraphType.lecture) {
			const size = this.lecture ? Math.max(this.lecture.children().length, this.lecture.subjects.length, this.lecture.parents().length) : 0

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

			// Remove zoom behaviour
			svg.on('.zoom', null)

		}

		// Grid background
		else {

			// Grid
			background.append('rect')
				.attr('fill', 'url(#grid)')
				.attr('width', '100%')
				.attr('height', '100%')
				.lower()

			// Add zoom behaviour
			if (!this.interactive) return

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
		}
	}

	_setContent(fields: Field[], relations: Relation<Field>[]) {
		if (this.svg === undefined) return

		// D3 setup
		const interactive = this.interactive && this.type !== GraphType.lecture
		const content = d3.select<SVGSVGElement, unknown>(this.svg)
			.select('#content')

		// Clear content
		this._clearContent()

		// Create relations
		content.selectAll<SVGLineElement, Relation<Field>>('.relation')
			.data(relations)
			.enter()
			.append('line')
				.each(function() {
					RelationSVG.create(this)
				})

		// Create fields
		content.selectAll<SVGGElement, Field>('.field')
			.data(fields)
			.enter()
			.append('g')
				.each(function() {
					FieldSVG.create(this, interactive)
				})
	}

	_clearContent() {
		if (this.svg === undefined) return
		d3.select<SVGSVGElement, unknown>(this.svg)
			.select('#content')
				.selectAll('*')
					.remove()
	}

	_bufferLayout(fields: Field[]) {
		return fields.map(field => ({ field: field, x: field.x, y: field.y }))
	}

	_restoreLayout(buffers: { field: Field, x: number, y: number }[]) {
		for (const buffer of buffers) {
			buffer.field.x = buffer.x
			buffer.field.y = buffer.y
		}
	}

	_moveSubjectsToDomains(subjects: Subject[]) {
		for (const subject of subjects) {
			subject.x = subject.domain!.x
			subject.y = subject.domain!.y
		}
	}

	_moveSubjectsToLecture(parents: Subject[], subjects: Subject[], children: Subject[]) {
		for (let index = 0; index < parents.length; index++) {
			const subject = parents[index];
			subject.x = settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_PADDING;
			subject.y = settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT;
		}
	
		for (let index = 0; index < subjects.length; index++) {
			const subject = subjects[index];
			subject!.x = settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_WIDTH + settings.LECTURE_PADDING;
			subject!.y = settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT;
		}
	
		for (let index = 0; index < children.length; index++) {
			const subject = children[index];
			subject.x = settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + 2 * settings.LECTURE_WIDTH + settings.LECTURE_PADDING;
			subject.y = settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT;
		}
	}

	_animate(callback: () => void) {
		if (this.svg === undefined) return
		d3.select<SVGSVGElement, unknown>(this.svg)
			.select('#content')
				.selectAll<SVGGElement, Field>('.field')
					.each(function() {
						FieldSVG.update(this, true, callback)
					})
	}

	_interrupt() {
		if (this.svg === undefined) return
		d3.select<SVGSVGElement, unknown>(this.svg)
			.select('#content')
				.selectAll('*')
					.interrupt()
		
		this.animating_from = undefined
	}
}

