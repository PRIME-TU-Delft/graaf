
// External imports
import * as d3 from 'd3'

// Internal imports
import { Graph, Field, Domain, Subject, Relation, Lecture } from '../entities'
import { FieldSVG, RelationSVG } from '.'
import * as settings from '../settings'

// Exports
export { GraphSVG, View, State }

// --------------------> Types

const ANIMATE = () => {}

enum State {
	static,
	dynamic,
	animating,
	lecture,
}

enum View {
	domains,
	subjects,
	lectures
}

class GraphSVG {
	private graph: Graph
	private interactive: boolean

	private _view: View
	private _state: State
	private _lecture?: Lecture

	private svg!: SVGSVGElement
	private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>
	private simulation!: d3.Simulation<d3.SimulationNodeDatum, undefined>

	constructor(graph: Graph, interactive: boolean = true) {
		this.graph = graph
		this.interactive = interactive

		this._view = View.domains
		this._state = interactive ? State.dynamic : State.static
	}

	get view() {
		return this._view
	}

	set view(view: View) {
		if (
			this.view === view ||
			this.state === State.animating
		) return

		switch (this.view) {
			case View.domains:
				switch (view) {
					case View.subjects:
						this.domainToSubject()
						break
					case View.lectures:
						this.domainToLecture()
						break
				} break
			case View.subjects:
				switch (view) {
					case View.domains:
						this.subjectToDomain()
						break
					case View.lectures:
						this.subjectToLecture()
						break
				} break
			case View.lectures:
				switch (view) {
					case View.domains:
						this.lectureToDomain()
						break
					case View.subjects:
						this.lectureToSubject()
						break
				} break
		}

		this._view = view
	}

	get state() {
		return this._state
	}

	private set state(state: State) {
		if (this.state === state) return

		if (this.state === State.dynamic) {
			d3.select(this.svg)
				.attr('pointer-events', 'none')
				.select('#content')
					.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
						.call(FieldSVG.setFixed, true)

			this.simulation.stop()
		}

		this._state = state

		if (this.state === State.dynamic) {
			d3.select(this.svg)
				.attr('pointer-events', 'all')
				.select('#content')
					.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
						.call(FieldSVG.setFixed, true)

			this.microwaveSimulation()
		}
	}

	get lecture() {
		return this._lecture
	}

	set lecture(lecture: Lecture | undefined) {
		if (
			this.lecture === lecture ||
			this.state === State.animating
		) return

		this._lecture = lecture

		// Update content
		if (this.view === View.lectures) {
			this.moveCamera(0, 0, 1)
			this.setBackground(View.lectures)
			this.setContent(this.lecture?.subjects ?? [], this.lecture?.relations ?? [])
			this.moveContent(this.lecture?.subjects ?? [], this.lectureTransform(0, 0))
		}

		// Update highlights
		d3.select(this.svg)
			.select('#content')
				.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
					.call(FieldSVG.updateHighlight, this.lecture)
	}

	create(element: SVGSVGElement) {
		this.svg = element

		// D3 setup
		const svg = d3.select<SVGSVGElement, unknown>(this.svg)
		const definitions = svg.append('defs')
		svg.append('g')
			.attr('id', 'background')
		svg.append('g')
			.attr('id', 'content')

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
			.attr('id', 'grid')
			.attr('width', settings.GRID_UNIT)
			.attr('height', settings.GRID_UNIT)
			.attr('patternUnits', 'userSpaceOnUse')

		grid.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', settings.GRID_UNIT * settings.MAX_ZOOM)
			.attr('y2', 0)
			.attr('stroke', settings.GRID_COLOR)

		grid.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', settings.GRID_UNIT * settings.MAX_ZOOM)
			.attr('stroke', settings.GRID_COLOR)

		// Shadow filter
		definitions.append('filter')
			.attr('id', 'shadow')
			.append('feDropShadow')
				.attr('dx', 0)
				.attr('dy', 0)
				.attr('stdDeviation', settings.FIELD_SHADOW_DEVIATION)
				.attr('flood-opacity', settings.FIELD_SHADOW_OPACITY)
				.attr('flood-color', settings.FIELD_SHADOW_COLOR)

		// Shift warning
		const warning = svg.append('g')
			.attr('pointer-events', 'none')
			.attr('opacity', 0)

		warning.append('rect')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('background-color', 'black')
			.attr('opacity', 0.75)
		
		warning.append('text')
			.text('Shift + Scroll to zoom')
			.attr('font-size', '2em')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('x', '50%')
			.attr('y', '50%')
			.attr('fill', 'white')

		// Keylogging
		let shift = false
		d3.select('body')
			.on('keydown', event => {
				if (event.key === 'Shift') { shift = true }
			})
			.on('keyup', event => {
				if (event.key === 'Shift') { shift = false }
			})
		
		// Zoom & pan
		this.zoom = d3.zoom<SVGSVGElement, unknown>()
			.scaleExtent([settings.MIN_ZOOM, settings.MAX_ZOOM])
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
			.filter((event) => shift || event.type === 'mousedown')

		svg
			.call(this.zoom)
			.on('dblclick.zoom', null)

		// Zoom warning
		svg.on('wheel', () => {
			if (shift) return

			warning
				.interrupt()
				.attr('opacity', 1)
				.transition()
					.duration(500)
					.delay(1000)
				.attr('opacity', 0)
		})

		// Simulation
		const links = this.graph.domain_relations.map(relation => ({ source: relation.parent!, target: relation.child!  }))
		this.simulation = d3.forceSimulation<d3.SimulationNodeDatum>(this.graph.domains)
			.force('x', d3.forceX(0).strength(settings.CENTER_FORCE))
			.force('y', d3.forceY(0).strength(settings.CENTER_FORCE))
			.force('charge', d3.forceManyBody().strength(settings.CHARGE_FORCE))
			.force('link', d3.forceLink(links))
			.on('tick', () => {
				d3.select('#content')
					.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
						.call(FieldSVG.updatePosition)
			})

		// Background & content
		const bbx = this.boundingBox(this.graph.domains)
		this.moveCamera(bbx.x, bbx.y, bbx.k)
		this.setBackground(View.domains)
		this.setContent(this.graph.domains, this.graph.domain_relations)
	}

	zoomIn() {
		if (this.state !== State.dynamic) return

		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(settings.ANIMATION_DURATION)
				.ease(d3.easeSinInOut)
			.call(this.zoom.scaleBy, settings.ZOOM_STEP)
	}

	zoomOut() {
		if (this.state !== State.dynamic) return

		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(settings.ANIMATION_DURATION)
				.ease(d3.easeSinInOut)
			.call(this.zoom.scaleBy, 1 / settings.ZOOM_STEP)
	}

	findGraph() {
		if (
			this.state !== State.dynamic &&
			this.state !== State.static
		) return

		const state = this.state
		this.state = State.animating

		const bbx = this.boundingBox(this.view === View.domains ? this.graph.domains : this.graph.subjects)
		this.moveCamera(bbx.x, bbx.y, bbx.k, () => {
			this.state = state
		})
	}

	unlockAllFields() {
		if (this.state !== State.dynamic)
			return

		d3.select('#content')
			.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
				.call(FieldSVG.setFixed, false)
		this.microwaveSimulation()
	}

	microwaveSimulation() {
		this.simulation
			.alpha(1)
			.restart()
	}

	private setSimulation(fields: Field<Domain | Subject>[], Relations: Relation<Domain | Subject>[]) {
		const links = Relations.map(relation => ({ source: relation.parent!, target: relation.child!  }))
		this.simulation
			.nodes(fields)
			.force('link', d3.forceLink(links))
	}

	private boundingBox(fields: Field<Domain | Subject>[]) {
		let min_x = Infinity
		let min_y = Infinity
		let max_x = -Infinity
		let max_y = -Infinity

		// Find most outer fields
		for (const field of fields) {
			min_x = Math.min(min_x, field.x - settings.FIELD_MARGIN)
			min_y = Math.min(min_y, field.y - settings.FIELD_MARGIN)
			max_x = Math.max(max_x, field.x + settings.FIELD_WIDTH + settings.FIELD_MARGIN)
			max_y = Math.max(max_y, field.y + settings.FIELD_HEIGHT + settings.FIELD_MARGIN)
		}

		// Find center and zoom
		return {
			x: (max_x + min_x) / 2,
			y: (max_y + min_y) / 2,
			k: Math.max(
				settings.MIN_ZOOM,
				Math.min(
					settings.MAX_ZOOM,
					this.svg.clientWidth / ((max_x - min_x) * settings.GRID_UNIT),
					this.svg.clientHeight / ((max_y - min_y) * settings.GRID_UNIT)
				)
			)
		}
	}

	private moveCamera(x: number, y: number, k: number, callback?: () => void) {

		// Call zoom with custom transform
		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(callback !== undefined ? settings.ANIMATION_DURATION : 0)
				.ease(d3.easeSinInOut)
			.call(
				this.zoom.transform,
				d3.zoomIdentity
					.translate(
						this.svg.clientWidth / 2 - k * x * settings.GRID_UNIT,
						this.svg.clientHeight / 2 - k * y * settings.GRID_UNIT
					)
					.scale(k)
			)

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.ANIMATION_DURATION)
		}
	}

	private panCamera(x: number, y: number, callback?: () => void) {

		// Call zoom with custom transform
		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(callback !== undefined ? settings.ANIMATION_DURATION : 0)
				.ease(d3.easeSinInOut)
			.call(
				this.zoom.translateTo,
				x * settings.GRID_UNIT,
				y * settings.GRID_UNIT
			)

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.ANIMATION_DURATION)
		}
	}

	private zoomCamera(k: number, callback?: () => void) {

		// Call zoom with custom transform
		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(callback !== undefined ? settings.ANIMATION_DURATION : 0)
				.ease(d3.easeSinInOut)
			.call(this.zoom.scaleTo, k)

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.ANIMATION_DURATION)
		}
	}

	private setBackground(view: View) {
		const background = d3.select<SVGGElement, unknown>('#background')

		// Remove old background
		background.selectAll('*')
			.remove()

		// Lecture background
		if (view === View.lectures) {
			const size = this.lecture?.size ?? 0
			const dx = (this.svg.clientWidth - 3 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2
			const dy = (this.svg.clientHeight - (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING + settings.LECTURE_HEADER_HEIGHT) * settings.GRID_UNIT) / 2

			// Past subject colunm
			background.append('rect')
				.attr('x', dx + settings.STROKE_WIDTH / 2)
				.attr('y', dy + settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
				.attr('width', settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
				.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
				.attr('stroke-width', settings.STROKE_WIDTH)
				.attr('fill', 'transparent')
				.attr('stroke', 'black')

			background.append('text')
				.attr('x', dx + (settings.STROKE_WIDTH + settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2)
				.attr('y', dy)
				.text('Past Topics')
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'hanging')
				.style('font-size', settings.LECTURE_FONT_SIZE)

			// Present subject column
			background.append('rect')
				.attr('x', dx + settings.STROKE_WIDTH / 2 + settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
				.attr('y', dy + settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
				.attr('width', settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
				.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
				.attr('stroke-width', settings.STROKE_WIDTH)
				.attr('fill', 'transparent')
				.attr('stroke', 'black')

			background.append('text')
				.attr('x', dx + (settings.STROKE_WIDTH + 3 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2)
				.attr('y', dy)
				.text('This Lecture')
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'hanging')
				.style('font-size', settings.LECTURE_FONT_SIZE)

			// Future subject column
			background.append('rect')
				.attr('x', dx + settings.STROKE_WIDTH / 2 + 2 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
				.attr('y', dy + settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
				.attr('width', settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
				.attr('height', (size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
				.attr('stroke-width', settings.STROKE_WIDTH)
				.attr('fill', 'transparent')
				.attr('stroke', 'black')

			background.append('text')
				.attr('x', dx + (settings.STROKE_WIDTH + 5 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2)
				.attr('y', dy)
				.text('Future Topics')
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'hanging')
				.style('font-size', settings.LECTURE_FONT_SIZE)
		}

		// Grid background
		else {
			background.append('rect')
				.attr('fill', 'url(#grid)')
				.attr('width', '100%')
				.attr('height', '100%')
		}
	}

	private setContent(fields: Field<Domain | Subject>[], relations: Relation<Domain | Subject>[], callback?: () => void) {
		const content = d3.select<SVGGElement, unknown>('#content')
		const lecture = this.lecture
		const graphSVG = this

		// Update Fields
		content.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
			.data(fields, field => field.uuid)
			.join(
				function(enter) {
					return enter
						.append('g')
							.call(FieldSVG.create, graphSVG)
							.call(FieldSVG.updateHighlight, lecture)
							.style('opacity', 0)
				},

				function(update) {
					return update
						.call(FieldSVG.updateHighlight, lecture)
				},

				function(exit) {
					return exit
						.transition()
							.duration(callback !== undefined ? settings.FADE_DURATION : 0)
							.on('end', function() { d3.select(this).remove() }) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0)
				}
			)
			.transition()
				.duration(callback !== undefined ? settings.FADE_DURATION : 0)
			.style('opacity', 1)

		// Update relations
		content.selectAll<SVGLineElement, Relation<Domain | Subject>>('.relation')
			.data(relations, relation => relation.uuid)
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
							.duration(callback !== undefined ? settings.FADE_DURATION : 0)
							.on('end', function() { d3.select(this).remove() }) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0)
				}
			)
			.transition()
				.duration(callback !== undefined ? settings.FADE_DURATION : 0)
			.style('opacity', 1)

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.FADE_DURATION)
		}
	}

	private moveContent(fields: Subject[], transform: (field: Subject) => void, callback?: () => void) {

		// Buffer field positions
		const buffers = fields.map(field => ({ field, x: field.x, y: field.y }))

		// Set field positions
		fields.forEach(transform)

		// Update fields
		d3.select<SVGGElement, unknown>('#content')
			.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
				.call(FieldSVG.updatePosition, callback !== undefined)

		// Restore field positions
		for (const buffer of buffers) {
			buffer.field.x = buffer.x
			buffer.field.y = buffer.y
		}

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.ANIMATION_DURATION)
		}
	}

	private restoreContent(callback?: () => void) {

		// Update fields
		d3.select<SVGGElement, unknown>('#content')
			.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
				.call(FieldSVG.updatePosition, callback !== undefined)

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.ANIMATION_DURATION)
		}
	}

	private clearContent(callback?: () => void) {
		d3.select<SVGGElement, unknown>('#content')
			.selectAll('*')
				.transition()
					.duration(callback !== undefined ? settings.FADE_DURATION : 0)
					.ease(d3.easeSinInOut)
					.on('end', function() { d3.select(this).remove() }) // Use this instead of .remove() to circumvent pending transitions
				.style('opacity', 0)

		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.FADE_DURATION)
		}
	}

	private domainToSubject() {
		this.state = State.animating

		const bbx = this.boundingBox(this.graph.subjects)
		this.moveCamera(bbx.x, bbx.y, bbx.k, ANIMATE)
		this.setContent(this.graph.subjects, this.graph.subject_relations)
		this.moveContent(this.graph.subjects, this.domainTransform)
		this.restoreContent(() => {
			this.state = this.interactive ? State.dynamic : State.static
			this.setSimulation(this.graph.subjects, this.graph.subject_relations)
		})
	}

	private domainToLecture() {
		if (this.lecture) {
			this.state = State.animating

			const bbx = this.boundingBox(this.graph.domains)
			this.moveCamera(bbx.x, bbx.y, 1, ANIMATE)
			this.setContent(this.lecture.subjects, this.lecture.relations)
			this.moveContent(this.lecture.subjects, this.domainTransform)
			this.moveContent(this.lecture.subjects, this.lectureTransform(bbx.x, bbx.y), () => {
				this.setBackground(View.lectures)
				this.state = State.lecture
			})
		}

		else {
			this.clearContent()
			this.setBackground(View.lectures)
			this.state = State.lecture
		}
	}

	private subjectToDomain() {
		this.state = State.animating

		const bbx = this.boundingBox(this.graph.domains)
		this.moveCamera(bbx.x, bbx.y, bbx.k, ANIMATE)
		this.moveContent(this.graph.subjects, this.domainTransform, () => {
			this.setContent(this.graph.domains, this.graph.domain_relations, () => {
				this.state = this.interactive ? State.dynamic : State.static
				this.setSimulation(this.graph.domains, this.graph.domain_relations)
			})
		})
	}

	private subjectToLecture() {
		if (this.lecture) {
			this.state = State.animating

			const bbx = this.boundingBox(this.graph.subjects)
			this.moveCamera(bbx.x, bbx.y, 1, ANIMATE)
			this.setContent(this.lecture.subjects, this.lecture.relations, () => {
				this.moveContent(this.lecture!.subjects, this.lectureTransform(bbx.x, bbx.y), () => {
					this.setBackground(View.lectures)
					this.state = State.lecture
				})
			})
		}

		else {
			this.clearContent()
			this.setBackground(View.lectures)
			this.state = State.lecture
		}
	}

	private lectureToDomain() {
		const bbx = this.boundingBox(this.graph.domains)
		this.state = State.animating

		if (this.lecture) {
			this.panCamera(bbx.x, bbx.y)
			this.moveContent(this.lecture.subjects, this.lectureTransform(bbx.x, bbx.y))
			this.setBackground(View.domains)
			this.zoomCamera(bbx.k, ANIMATE)
			this.moveContent(this.lecture.subjects, this.domainTransform, () => {
				this.setContent(this.graph.domains, this.graph.domain_relations, () => {
					this.state = this.interactive ? State.dynamic : State.static
					this.setSimulation(this.graph.domains, this.graph.domain_relations)
				})
			})
		}

		else {
			this.setBackground(View.domains)
			this.moveCamera(bbx.x, bbx.y, bbx.k)
			this.setContent(this.graph.domains, this.graph.domain_relations, () => {
				this.state = this.interactive ? State.dynamic : State.static
				this.setSimulation(this.graph.domains, this.graph.domain_relations)
			})
		}
	}

	private lectureToSubject() {
		const bbx = this.boundingBox(this.graph.subjects)
		this.state = State.animating

		if (this.lecture) {
			this.panCamera(bbx.x, bbx.y)
			this.moveContent(this.lecture.subjects, this.lectureTransform(bbx.x, bbx.y))
			this.setBackground(View.subjects)
			this.zoomCamera(bbx.k, ANIMATE)
			this.restoreContent(() => {
				this.setContent(this.graph.subjects, this.graph.subject_relations, () => {
					this.state = this.interactive ? State.dynamic : State.static
					this.setSimulation(this.graph.subjects, this.graph.subject_relations)
				})
			})
		}

		else {
			this.setBackground(View.subjects)
			this.moveCamera(bbx.x, bbx.y, bbx.k)
			this.setContent(this.graph.subjects, this.graph.subject_relations, () => {
				this.state = this.interactive ? State.dynamic : State.static
				this.setSimulation(this.graph.subjects, this.graph.subject_relations)
			})
		}
	}

	private domainTransform(subject: Subject) {
		subject.x = subject.domain!.x
		subject.y = subject.domain!.y
	}

	private lectureTransform(x: number, y: number) {
		const graphSVG = this
		return (subject: Subject) => {
			const size = graphSVG.lecture?.size ?? 0
			const dx = x - 3 * settings.LECTURE_COLUMN_WIDTH / 2
			const dy = y - (settings.LECTURE_HEADER_HEIGHT + size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) / 2

			// Set past subject positions to the right column
			const past = graphSVG.lecture?.past
			if (past?.includes(subject)) {
				const index = past.indexOf(subject)
				subject.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_PADDING
				subject.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
				return
			}

			// Set present subject positions to the middle column
			const present = graphSVG.lecture?.present
			if (present?.includes(subject)) {
				const index = present.indexOf(subject)
				subject.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_COLUMN_WIDTH + settings.LECTURE_PADDING
				subject.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
				return
			}

			// Set future subject positions to the left column
			const future = graphSVG.lecture?.future
			if (future?.includes(subject)) {
				const index = future.indexOf(subject)
				subject.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + 2 * settings.LECTURE_COLUMN_WIDTH + settings.LECTURE_PADDING
				subject.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
				return
			}
		}
	}
}