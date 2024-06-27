
// External imports
import * as d3 from 'd3'

// Internal imports
import { FieldSVG, RelationSVG } from '.'
import { Graph, Domain, Subject, Relation, Lecture, Field } from '../entities'
import * as settings from '../settings'

// Exports
export { GraphType, GraphSVG }


// --------------------> Types


type Transform = (field: Field<Domain | Subject>, bbx: BoundingBox, graphSVG: GraphSVG) => void

enum GraphType {
	domains,
	subjects,
	lectures
}


// --------------------> Classes


class BoundingBox {
	constructor(
		public x: number,
		public y: number,
		public width: number,
		public height: number
	) { }

	static from(fields: Domain[] | Subject[]): BoundingBox {
		/* Create a bounding box around a list of fields */

		let min_x = Infinity
		let min_y = Infinity
		let max_x = -Infinity
		let max_y = -Infinity

		for (const field of fields) {
			min_x = Math.min(min_x, field.x - settings.FIELD_MARGIN)
			min_y = Math.min(min_y, field.y - settings.FIELD_MARGIN)
			max_x = Math.max(max_x, field.x + settings.FIELD_WIDTH + settings.FIELD_MARGIN)
			max_y = Math.max(max_y, field.y + settings.FIELD_HEIGHT + settings.FIELD_MARGIN)
		}

		return new BoundingBox(
			(max_x + min_x) / 2,
			(max_y + min_y) / 2,
			max_x - min_x,
			max_y - min_y
		)
	}

	static origin(): BoundingBox {
		/* Create an empty bounding box around the origin */

		return new BoundingBox(0, 0, 0, 0)
	}
}

class Transition {
	start: GraphType
	end: GraphType

	constructor(start: GraphType, end?: GraphType) {
		this.start = start
		this.end = end ?? start
	}
}

class GraphSVG {
	private _type: GraphType = GraphType.domains
	private _lecture?: Lecture = undefined
	private _forces: boolean = false

	private fields: Field<Domain | Subject>[] = []
	private animating: boolean = false

	// If either of these are undefined, the graph is being interacted with before it was created
	private svg!: SVGSVGElement
	private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>

	constructor(
		public graph: Graph,
		private interactive: boolean
	) { }

	get type() {
		return this._type
	}

	set type(type: GraphType) {
		if (this.type === type || this.animating) return

		this.forces = false
		this.animating = true
		this.setInteractive(false)
		const transition = new Transition(this.type, type)

		switch (transition.start) {
			case GraphType.domains:
				switch (transition.end) {

					// Domains -> Subjects
					case GraphType.subjects:
						this.moveIntoFrame(transition, true)
						this.setContent(transition)
						this.moveContent(transition, this.domainTransform)
						this.restoreContent(transition, true, () => {
							this.setInteractive(this.interactive)
							this.animating = false
						})

						break

					// Domains -> Lecture
					case GraphType.lectures:
						if (this.lecture) {
							this.moveIntoFrame(transition, true)
							this.setContent(transition)
							this.moveContent(transition, this.domainTransform)
							this.moveContent(transition, this.lectureTransform, true, () => {
								this.setBackground(transition)
								this.animating = false
							})
						}

						else {
							this.moveIntoFrame(transition)
							this.setBackground(transition)
							this.clearContent()
							this.animating = false
						}
				} break

			case GraphType.subjects:
				switch (type) {

					// Subjects -> Domains
					case GraphType.domains:
						this.moveIntoFrame(transition, true)
						this.moveContent(transition, this.domainTransform, true, () => {
							this.setContent(transition, true, () => {
								this.setInteractive(this.interactive)
								this.animating = false
							})
						})

						break

					// Subjects -> Lectures
					case GraphType.lectures:
						if (this.lecture) {
							this.moveIntoFrame(transition, true)
							this.setContent(transition, true, () => {
								this.moveContent(transition, this.lectureTransform, true, () => {
									this.setBackground(transition)
									this.animating = false
								})
							})
						}

						else {
							this.moveIntoFrame(transition)
							this.setBackground(transition)
							this.clearContent()
							this.animating = false
						}
				} break

			case GraphType.lectures:
				switch (type) {

					// Lectures -> Domains
					case GraphType.domains:
						if (this.lecture) {
							this.moveIntoFrame(transition, true)
							this.setBackground(transition)
							this.moveContent(transition, this.lectureTransform)
							this.moveContent(transition, this.domainTransform, true, () => {
								this.setContent(transition, true, () => {
									this.setInteractive(this.interactive)
									this.animating = false
								})
							})
						}

						else {
							this.moveIntoFrame(transition)
							this.setBackground(transition)
							this.setContent(transition, true, () => {
								this.setInteractive(this.interactive)
								this.animating = false
							})
						}

						break

					// Lectures -> Subjects
					case GraphType.subjects:
						if (this.lecture) {
							this.moveIntoFrame(transition, true)
							this.setBackground(transition)
							this.moveContent(transition, this.lectureTransform)
							this.restoreContent(transition, true, () => {
								this.setContent(transition, true, () => {
									this.setInteractive(this.interactive)
									this.animating = false
								})
							})

						}

						else {
							this.moveIntoFrame(transition)
							this.setBackground(transition)
							this.setContent(transition, true, () => {
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
		if (this.animating || this.lecture === lecture) return

		this._lecture = lecture

		// Update content
		if (this.type === GraphType.lectures) {
			const transition = new Transition(this.type)
			this.moveIntoFrame(transition)
			this.setBackground(transition)
			this.setContent(transition)
			this.moveContent(transition, this.lectureTransform)
		}

		// Update highlights
		d3.select(this.svg)
			.select('#content')
				.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
					.call(FieldSVG.updateHighlight, this.lecture)
	}

	get forces() {
		return this._forces
	}

	set forces(forces: boolean) {
		const links = []
		for (const field of this.fields) {
			for (const parent of field.parents)
				links.push({ source: field.uuid, target: parent.uuid })
			for (const child of field.children) {
				links.push({ source: field.uuid, target: child.uuid })
			}
		}

		const simulation = d3.forceSimulation()
			.force('charge', d3.forceManyBody().strength(5))
			.force('collision', d3.forceCollide().radius(settings.FIELD_WIDTH / 2 + settings.FIELD_MARGIN))
			.force('link', d3.forceLink().links(links).distance(settings.FIELD_WIDTH + settings.FIELD_MARGIN).strength(1))
		
		simulation
			.nodes(this.fields)
			.on('tick', () => {
				d3.select(this.svg)
					.select('#content')
						.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
							.call(FieldSVG.updatePosition, false)
			})	
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

		// Shadow filter
		definitions.append('filter')
			.attr('id', 'shadow')
			.append('feDropShadow')
				.attr('dx', 0)
				.attr('dy', 0)
				.attr('stdDeviation', settings.FIELD_SHADOW_DEVIATION)
				.attr('flood-opacity', settings.FIELD_SHADOW_OPACITY)
				.attr('flood-color', settings.FIELD_SHADOW_COLOR)

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
		const transition = new Transition(this.type)
		this.setInteractive(this.interactive)
		this.setBackground(transition)
		this.setContent(transition)
		this.moveIntoFrame(transition)
	}

	findGraph() {
		this.moveIntoFrame(new Transition(this.type), true)
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
				d3.zoomIdentity
					.translate(
						this.svg.clientWidth / 2 - k * x,
						this.svg.clientHeight / 2 - k * y
					)
					.scale(k)
			)

		// Post-transition
		setTimeout(() => {
			callback()
		}, animate ? settings.ANIMATION_DURATION : 0)
	}

	private setBackground(transition: Transition) {
		const background = d3.select<SVGSVGElement, unknown>(this.svg)
			.select<SVGGElement>('#background')

		// Remove old background
		background.selectAll('*')
			.remove()

		// Add new background
		switch (transition.end) {
			case GraphType.domains:
			case GraphType.subjects:

				// Grid
				background
					.append('rect')
						.attr('fill', 'url(#grid)')
						.attr('width', '100%')
						.attr('height', '100%')

				break

			case GraphType.lectures:
				const size = Math.max(this.lecture?.past.length || 0, this.lecture?.present.length || 0, this.lecture?.future.length || 0)
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
					.text('Past Topics')
					.style('font-size', settings.LECTURE_FONT_SIZE)
					.attr('x', dx + (settings.STROKE_WIDTH + settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2)
					.attr('y', dy)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'hanging')

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
					.text('This Lecture')
					.style('font-size', settings.LECTURE_FONT_SIZE)
					.attr('x', dx + (settings.STROKE_WIDTH + 3 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2)
					.attr('y', dy)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'hanging')

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
					.text('Future Topics')
					.style('font-size', settings.LECTURE_FONT_SIZE)
					.attr('x', dx + (settings.STROKE_WIDTH + 5 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2)
					.attr('y', dy)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'hanging')
		}
	}

	private setContent(transition: Transition, fade: boolean = false, callback: () => void = () => {}) {
		let relations: Relation<Domain | Subject>[]
		let fields: Field<Domain | Subject>[]

		// Get fields and relations
		if (transition.end === GraphType.domains) {
			relations = this.graph.domain_relations
			fields = this.graph.domains
		} else if (transition.end === GraphType.subjects) {
			relations = this.graph.subject_relations
			fields = this.graph.subjects
		} else {
			relations = this.lecture?.relations ?? []
			fields = this.lecture?.subjects ?? []
		}

		const content = d3.select<SVGGElement, unknown>('#content')
		const lecture = this.lecture
		this.fields = fields

		// Update Fields
		content.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
			.data(fields, field => field.uuid)
			.join(
				function(enter) {
					return enter
						.append('g')
							.call(FieldSVG.create)
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
							.duration(fade ? settings.FADE_DURATION : 0)
							.on('end', function() { d3.select(this).remove() }) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0)
				}
			)
			.transition()
				.duration(fade ? settings.FADE_DURATION : 0)
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

	private moveContent(transition: Transition, transform: Transform, animate: boolean = false, callback: () => void = () => {}) {

		// Buffer field positions
		const buffers = this.fields.map(field => ({ field, x: field.x, y: field.y }))

		// Find bounding box
		let bbx: BoundingBox
		if (transition.start === GraphType.domains || transition.end === GraphType.domains) {
			bbx = BoundingBox.from(this.graph.domains)
		} else if (transition.start === GraphType.subjects || transition.end === GraphType.subjects) {
			bbx = BoundingBox.from(this.graph.subjects)
		} else {
			bbx = BoundingBox.origin()
		}

		// Set field positions
		for (const field of this.fields) {
			transform(field, bbx, this)
		}

		// Update fields
		d3.select<SVGSVGElement, unknown>(this.svg)
			.select('#content')
				.selectAll<SVGGElement, Field<Domain | Subject>>('.field')
					.call(FieldSVG.updatePosition, animate)

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

	private restoreContent(transition: Transition, animate: boolean = false, callback: () => void = () => {}) {

		// As the field positions are always maintained, we can just update them
		this.moveContent(transition, () => {}, animate, callback)
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

	private moveIntoFrame(transition: Transition, animate: boolean = false, callback: () => void = () => {}) {
		if (transition.end === GraphType.lectures) {

			// If swapping between lectures, reset pan and zoom
			if (transition.start === GraphType.lectures) {
				this.setZoomAndPan(0, 0, 1)
				return
			}

			// If swapping to lectures, maintain pan of previous extent and zoom to fit lecture into frame
			const bbx = BoundingBox.from(transition.start === GraphType.domains ? this.graph.domains : this.graph.subjects)
			this.setZoomAndPan(
				bbx.x * settings.GRID_UNIT,
				bbx.y * settings.GRID_UNIT,
				1, animate, callback
			)

			return
		}

		// Target bounding box is whatever we are transitioning towards
		const bbx = BoundingBox.from(transition.end === GraphType.domains ? this.graph.domains : this.graph.subjects)

		// If coming from lectures, current pan might be at origin. In that case, pan to end-extent
		if (transition.start === GraphType.lectures) {
			this.setZoomAndPan(
				bbx.x * settings.GRID_UNIT,
				bbx.y * settings.GRID_UNIT,
				1
			)
		}

		// Pan and zoom to fit end-extent into frame
		this.setZoomAndPan(
			bbx.x * settings.GRID_UNIT,
			bbx.y * settings.GRID_UNIT,
			Math.max(
				settings.GRID_MIN_ZOOM,
				Math.min(
					this.svg.clientWidth / (bbx.width * settings.GRID_UNIT),
					this.svg.clientHeight / (bbx.height * settings.GRID_UNIT),
					settings.GRID_MAX_ZOOM
				)
			),

			animate,
			callback
		)
	}

	private lectureTransform(field: Field<Domain | Subject>, bbx: BoundingBox, graphSVG: GraphSVG) {
		if (field instanceof Subject) {
			const size = graphSVG.lecture?.size || 0
			const dx = bbx.x - 3 * settings.LECTURE_COLUMN_WIDTH / 2
			const dy = bbx.y - (settings.LECTURE_HEADER_HEIGHT + size * settings.FIELD_HEIGHT + (size + 1) * settings.LECTURE_PADDING) / 2

			// Set past subject positions to the right column
			const past = graphSVG.lecture?.past
			if (past?.includes(field)) {
				const index = past.indexOf(field)
				field.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_PADDING
				field.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
				return
			}

			// Set present subject positions to the middle column
			const present = graphSVG.lecture?.present
			if (present?.includes(field)) {
				const index = present.indexOf(field)
				field.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_COLUMN_WIDTH + settings.LECTURE_PADDING
				field.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
				return
			}

			// Set future subject positions to the left column
			const future = graphSVG.lecture?.future
			if (future?.includes(field)) {
				const index = future.indexOf(field)
				field.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + 2 * settings.LECTURE_COLUMN_WIDTH + settings.LECTURE_PADDING
				field.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT
				return
			}
		}
	}

	private domainTransform(field: Field<Domain | Subject>) {
		if (field instanceof Domain) {
			field.x = field.x * settings.GRID_UNIT
			field.y = field.y * settings.GRID_UNIT
		} else if (field instanceof Subject) {
			field.x = field.domain!.x
			field.y = field.domain!.y
		}
	}
}
