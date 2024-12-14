
// External imports
import * as d3 from 'd3'

// Internal imports
import * as settings from '$scripts/settings'
import { customError } from '$scripts/utility'
import { Severity } from '$scripts/validation'

import {
	NodeSVG,
	RelationSVG,
	OverlaySVG
} from '$scripts/svg'

import {
	GraphController,
	DomainController,
	SubjectController,
	RelationController,
	LectureController,
	NodeController
} from '$scripts/controllers'

import type {
	EditorView
} from '$scripts/types'

// Exports
export { GraphSVG, SVGState }


// --------------------> Classes


const ANIMATE = () => {}

enum SVGState {
	detached,			// When the graph is detached from the DOM
	static,				// When the graph cannot be interacted with
	dynamic,			// When the graph can be interacted with
	animating,			// When the graph is animating
	lecture,			// When the graph is displaying a lecture
	await_lecture,		// When the graph is waiting for the user to select a lecture
	broken				// When the current view is broken
}

class GraphSVG {
	private _graph: GraphController
	private _interactive: boolean
	private _view: EditorView = 'domains'
	private _state: SVGState = SVGState.detached
	private _lecture: LectureController | null = null
	private _subscribers: (() => void)[] = []
 
	private svg?: SVGSVGElement
	private zoom?: d3.ZoomBehavior<SVGSVGElement, unknown>
	private simulation?: d3.Simulation<d3.SimulationNodeDatum, undefined>

	private keys: { [key: string]: boolean } = {}

	public shift_zoom: boolean = true

	constructor(graph: GraphController, interactive: boolean = true) {
		this._interactive = interactive
		this._graph = graph
	}

	// -----------------> Getters & Setters

	get graph() {
		return this._graph
	}

	get interactive() {
		return this._interactive
	}

	get view() {
		return this._view
	}

	set view(view: EditorView) {
		if (this.view === view || this.state === SVGState.animating)
			return

		// If detached, save view for later
		if (this.state === SVGState.detached) {
			this._view = view
			return
		}

		// Validate view
		if (!this.validateView(view)) {
			this.state = SVGState.broken
			this._view = view
			return
		}

		// Transition to new view
		switch (this.view) {
			case 'domains':
				switch (view) {
					case 'subjects':
						this.domainsToSubjects()
						break
					case 'lectures':
						this.domainsToLectures()
						break
				} break
			case 'subjects':
				switch (view) {
					case 'domains':
						this.subjectsToDomains()
						break
					case 'lectures':
						this.subjectsToLectures()
						break
				} break
			case 'lectures':
				switch (view) {
					case 'domains':
						this.lecturesToDomains()
						break
					case 'subjects':
						this.lecturesToSubjects()
						break
				} break
		}

		this._view = view

		// Notify subscribers
		this._subscribers.forEach(subscriber => subscriber())
	}

	get state() {
		return this._state
	}

	private set state(state: SVGState) {
		// Check if state is changing
		if (this.state === state) {
			return
		}

		// Check if SVG is properly attached
		if (this.svg === undefined || this.simulation === undefined) {
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		}

		// If moving out of broken state:
		//  - Reset overlay
		if (this.state === SVGState.broken) {
			d3.select<SVGGElement, unknown>('#overlay')
				.call(OverlaySVG.reset)
		}

		// If moving out of awaiting lecture state:
		//  - Reset overlay
		if (this.state === SVGState.await_lecture) {
			d3.select<SVGGElement, unknown>('#overlay')
				.call(OverlaySVG.reset)
		}

		// If moving out of dynamic state:
		//  - Disable pointer events
		//  - Fix all nodes
		//  - Save all nodes
		//  - Stop simulation
		if (this.state === SVGState.dynamic) {
			d3.select(this.svg)
				.style('pointer-events', 'none')
				.select('#content')
					.selectAll<SVGGElement, NodeController<DomainController | SubjectController>>('.node')
						.call(NodeSVG.setFixed, true)
						.each(async node => await node.save())

			this.simulation.stop()
		}

		// If moving out of static state:
		//  - Disable pointer events
		if (this.state === SVGState.static) {
			d3.select(this.svg)
				.style('pointer-events', 'none')
		}

		// If moving into broken state:
		//  - Set overlay to broken
		if (state === SVGState.broken) {
			d3.select<SVGGElement, unknown>('#overlay')
				.call(OverlaySVG.brokenView)
		}

		// If moving into awaiting lecture state:
		//  - Set overlay to await lecture
		if (state === SVGState.await_lecture) {
			d3.select<SVGGElement, unknown>('#overlay')
				.call(OverlaySVG.awaitLecture)
		}

		// If moving into dynamic state:
		//  - Enable pointer events
		if (state === SVGState.dynamic) {
			d3.select(this.svg)
				.style('pointer-events', 'all')
		}

		// If moving into static state:
		//  - Enable pointer events
		if (state === SVGState.static) {
			d3.select(this.svg)
				.style('pointer-events', 'all')
		}

		this._state = state // NEW STATE

		// Notify subscribers
		this._subscribers.forEach(subscriber => subscriber())
	}

	get lecture() {
		return this._lecture
	}

	set lecture(lecture: LectureController | null) {
		if (this.lecture === lecture || this.state === SVGState.animating)
			return

		// If detached, save lecture for later
		if (this.state === SVGState.detached) {
			this._lecture = lecture
			return
		}

		// Check if properly attached
		if (this.svg === undefined) {
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		}

		this._lecture = lecture // NEW LECTURE

		// Validate lecture
		if (!this.validateView(this.view)) {
			this.state = SVGState.broken
			return
		}

		// Update content
		if (this.view === 'lectures') {
			this.Lectures()
		}

		// Update highlights
		d3.select(this.svg)
			.select('#content')
				.selectAll<SVGGElement, NodeController<DomainController | SubjectController>>('.node')
					.call(NodeSVG.updateHighlight, this.lecture)
		
		// Notify subscribers
		this._subscribers.forEach(subscriber => subscriber())
	}

	get autolayout_enabled() {

		// Check easy case
		if (this.state !== SVGState.dynamic)
			return false

		// Check if any nodes are not fixed
		return d3.select('#content')
			.selectAll<SVGGElement, NodeController<DomainController | SubjectController>>('.node:not(.fixed)')
				.size() > 0
	}

	// -----------------> Public Methods

	attach(element: SVGSVGElement) {

		// Check if already attached
		if (this.state !== SVGState.detached) {
			throw customError('GraphSVGError', 'GraphSVG already attached to DOM')
		}

		// SVG setup
		this.svg = element
		const svg = d3.select<SVGSVGElement, unknown>(this.svg)
			.attr('display', 'block')
			.attr('pointer-events', 'none')

		const definitions = svg.append('defs')
		svg.append('g').attr('id', 'background')
		svg.append('g').attr('id', 'content')
		svg.append('g').attr('id', 'overlay')

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

		// Highlight filter
		definitions.append('filter')
			.attr('id', 'highlight')
			.append('feDropShadow')
				.attr('dx', 0)
				.attr('dy', 0)
				.attr('stdDeviation', settings.NODE_HIGHLIGHT_DEVIATION)
				.attr('flood-opacity', settings.NODE_HIGHLIGHT_OPACITY)
				.attr('flood-color', settings.NODE_HIGHLIGHT_COLOR)

		// Zoom warning
		svg.on('wheel', () => {
			if (!this.shift_zoom || this.keys.Shift) return
			d3.select<SVGGElement, unknown>('#overlay')
				.call(OverlaySVG.shiftWarning, this)
		})

		// Keylogging
		d3.select('body')
			.on('keydown', event => {
				this.keys[event.key] = true
			})
			.on('keyup', event => {
				this.keys[event.key] = false
			})

		// Zoom & pan
		this.zoom = d3.zoom<SVGSVGElement, unknown>()
			.scaleExtent([settings.MIN_ZOOM, settings.MAX_ZOOM])
			.filter((event) => !this.shift_zoom || this.keys.Shift || event.type === 'mousedown')
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

		svg
			.call(this.zoom)
			.on('dblclick.zoom', null)

		// Simulation
		this.simulation = d3.forceSimulation<d3.SimulationNodeDatum>()
			.force('x', d3.forceX(0).strength(settings.CENTER_FORCE))
			.force('y', d3.forceY(0).strength(settings.CENTER_FORCE))
			.force('charge', d3.forceManyBody().strength(settings.CHARGE_FORCE))
			.on('tick', () => {
				d3.select('#content')
					.selectAll<SVGGElement, NodeController<DomainController | SubjectController>>('.node')
						.call(NodeSVG.updatePosition)
			})

		// Exit detached state
		if (!this.validateView(this.view)) {
			this.state = SVGState.broken
			return
		}

		this.simulation.stop()
		switch (this.view) {
			case 'domains':
				this.Domains()
				break
			case 'subjects':
				this.Subjects()
				break
			case 'lectures':
				this.Lectures()
				break
		}
	}

	detach() {

		// Check if already detached
		if (this.state === SVGState.detached) {
			throw customError('GraphSVGError', 'GraphSVG already detached from DOM')
		}

		// Check if properly attached
		if (this.svg === undefined) {
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		}

		// Exit current state
		this.state = SVGState.detached

		// Clear SVG
		d3.select(this.svg)
			.selectAll('*')
				.remove()

		// Reset properties
		this.svg = undefined
		this.zoom = undefined
		this.simulation = undefined
		this.keys = {}
	}

	subscribe(callback: () => void) {
		// Svelte 4 is really bad at detecting changes inside objects. Thus the need for a custom subscriber pattern.
		// Subscribers to a graphSVG will be notified when the view, state, or lecture changes.
		// Maybe Svelte 5 is better at this? we will see.

		this._subscribers.push(callback)
	}

	unsubscribe(callback: () => void) {
		this._subscribers = this._subscribers.filter(subscriber => subscriber !== callback)
	}

	zoomIn() {
		if (this.svg === undefined || this.zoom === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		if (this.state !== SVGState.dynamic && this.state !== SVGState.static)
			return

		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(settings.GRAPH_ANIMATION_DURATION)
				.ease(d3.easeSinInOut)
			.call(this.zoom.scaleBy, settings.ZOOM_STEP)
	}

	zoomOut() {
		if (this.svg === undefined || this.zoom === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		if (this.state !== SVGState.dynamic && this.state !== SVGState.static)
			return

		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(settings.GRAPH_ANIMATION_DURATION)
				.ease(d3.easeSinInOut)
			.call(this.zoom.scaleBy, 1 / settings.ZOOM_STEP)
	}

	centerGraph() {
		if (this.state !== SVGState.dynamic && this.state !== SVGState.static) return

		this.state = SVGState.animating
		const bbx = this.boundingBox(this.view === 'domains' ? this.graph.domains : this.graph.subjects)
		this.moveCamera(bbx.x, bbx.y, bbx.k, () => {
			this.state = SVGState.dynamic
		})
	}

	toggleAutolayout() {
		if (this.simulation === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		if (this.state !== SVGState.dynamic)
			return

		const autolayout_enabled = this.autolayout_enabled
		d3.select('#content')
			.selectAll<SVGGElement, NodeController<DomainController | SubjectController>>('.node')
				.call(NodeSVG.setFixed, autolayout_enabled)
				.each(async node => { if (autolayout_enabled) await node.save() })

		if (autolayout_enabled) {
			this.simulation.stop()
		} else {
			this.microwaveSimulation()
		}
	}

	microwaveSimulation() {
		if (this.simulation === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		this.simulation
			.alpha(1)
			.restart()
	}

	// -----------------> Toolbox

	private validateView(view: EditorView) {
		switch (view) {
			case 'domains':
				return this.graph.domains.every(domain => domain.validate().severity !== Severity.error)
					&& this.graph.domain_relations.every(relation => relation.validate().severity !== Severity.error)

			case 'subjects':
				return this.graph.subjects.every(subject => subject.validate().severity !== Severity.error)
					&& this.graph.subject_relations.every(relation => relation.validate().severity !== Severity.error)

			case 'lectures':
				return (
					this.lecture === null ||
					this.lecture.validate().severity !== Severity.error &&
					this.lecture.present_subjects.every(subject => subject.validate().severity !== Severity.error)
				)
		}
	}

	private boundingBox(nodes: NodeController<DomainController | SubjectController>[]) {
		if (this.svg === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		if (nodes.length === 0)
			return { x: 0, y: 0, k: 1 }

		let min_x = Infinity
		let min_y = Infinity
		let max_x = -Infinity
		let max_y = -Infinity

		// Find most outer nodes
		for (const node of nodes) {
			min_x = Math.min(min_x, node.x - settings.NODE_MARGIN)
			min_y = Math.min(min_y, node.y - settings.NODE_MARGIN)
			max_x = Math.max(max_x, node.x + settings.NODE_WIDTH + settings.NODE_MARGIN)
			max_y = Math.max(max_y, node.y + settings.NODE_HEIGHT + settings.NODE_MARGIN)
		}

		// Apply grid padding
		min_x -= settings.GRID_PADDING
		min_y -= settings.GRID_PADDING
		max_x += settings.GRID_PADDING
		max_y += settings.GRID_PADDING

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
		if (this.svg === undefined || this.zoom === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')

		// Call zoom with custom transform
		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
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
			}, settings.GRAPH_ANIMATION_DURATION)
		}
	}

	private panCamera(x: number, y: number, callback?: () => void) {
		if (this.svg === undefined || this.zoom === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')

		// Call zoom with custom transform
		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
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
			}, settings.GRAPH_ANIMATION_DURATION)
		}
	}

	private zoomCamera(k: number, callback?: () => void) {
		if (this.svg === undefined || this.zoom === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')

		// Call zoom with custom transform
		d3.select<SVGSVGElement, unknown>(this.svg)
			.transition()
				.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
				.ease(d3.easeSinInOut)
			.call(this.zoom.scaleTo, k)

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.GRAPH_ANIMATION_DURATION)
		}
	}

	private setBackground(view: EditorView) {
		if (this.svg === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		const background = d3.select<SVGGElement, unknown>('#background')

		// Remove old background
		this.clearBackground()

		// Lecture background
		if (view === 'lectures') {
			const size = this.lecture?.max_height || 0
			const dx = (this.svg.clientWidth - 3 * settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT) / 2
			const dy = (this.svg.clientHeight - (size * settings.NODE_HEIGHT + (size + 1) * settings.LECTURE_PADDING + settings.LECTURE_HEADER_HEIGHT) * settings.GRID_UNIT) / 2

			// Past subject colunm
			background.append('rect')
				.attr('x', dx + settings.STROKE_WIDTH / 2)
				.attr('y', dy + settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
				.attr('width', settings.LECTURE_COLUMN_WIDTH * settings.GRID_UNIT)
				.attr('height', (size * settings.NODE_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
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
				.attr('height', (size * settings.NODE_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
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
				.attr('height', (size * settings.NODE_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT)
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
		else if (this.interactive) {
			background.append('rect')
				.attr('fill', 'url(#grid)')
				.attr('width', '100%')
				.attr('height', '100%')
		}
	}

	private clearBackground() {
		d3.select<SVGGElement, unknown>('#background')
			.selectAll('*')
				.remove()
	}

	private setContent(nodes: NodeController<DomainController | SubjectController>[], relations: RelationController<DomainController | SubjectController>[], callback?: () => void) {
		if (this.simulation === undefined)
			throw customError('GraphSVGError', 'GraphSVG not attached to DOM')
		if (nodes.length === 0) {
			this.clearContent(callback)
			return
		}

		const content = d3.select<SVGGElement, unknown>('#content')
		const lecture = this.lecture
		const graphSVG = this

		// Update Nodes
		content.selectAll<SVGGElement, NodeController<DomainController | SubjectController>>('.node')
			.data(nodes, node => node.uuid)
			.join(
				function(enter) {
					return enter
						.append('g')
							.call(NodeSVG.create, graphSVG)
							.call(NodeSVG.updateHighlight, lecture)
							.style('opacity', 0)
				},

				function(update) {
					return update
						.call(NodeSVG.updateHighlight, lecture)
				},

				function(exit) {
					return exit
						.transition()
							.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
							.on('end', function() { d3.select(this).remove() }) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0)
				}
			)
			.transition()
				.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.style('opacity', 1)

		// Update relations
		content.selectAll<SVGLineElement, RelationController<DomainController | SubjectController>>('.relation')
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
							.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
							.on('end', function() { d3.select(this).remove() }) // Use this instead of .remove() to circumvent pending transitions
						.style('opacity', 0)
				}
			)
			.transition()
				.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
			.style('opacity', 1)

		// Update simulation
		const links = relations.map(relation => ({ source: relation.parent!, target: relation.child!  }))
		this.simulation
			.nodes(nodes)
			.force('link', d3.forceLink(links))

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.GRAPH_ANIMATION_DURATION)
		}
	}

	private moveContent(nodes: SubjectController[], transform: (node: SubjectController) => void, callback?: () => void) {

		// Buffer node positions
		const buffers = nodes.map(node => ({ node, x: node.x, y: node.y }))

		// Set node positions
		nodes.forEach(transform)

		// Update nodes
		d3.select<SVGGElement, unknown>('#content')
			.selectAll<SVGGElement, NodeController<DomainController | SubjectController>>('.node')
				.call(NodeSVG.updatePosition, callback !== undefined)

		// Restore node positions
		for (const buffer of buffers) {
			buffer.node.x = buffer.x
			buffer.node.y = buffer.y
		}

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.GRAPH_ANIMATION_DURATION)
		}
	}

	private restoreContent(callback?: () => void) {

		// Update nodes
		d3.select<SVGGElement, unknown>('#content')
			.selectAll<SVGGElement, NodeController<DomainController | SubjectController>>('.node')
				.call(NodeSVG.updatePosition, callback !== undefined)

		// Post-transition
		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.GRAPH_ANIMATION_DURATION)
		}
	}

	private clearContent(callback?: () => void) {
		d3.select<SVGGElement, unknown>('#content')
			.selectAll('*')
				.transition()
					.duration(callback !== undefined ? settings.GRAPH_ANIMATION_DURATION : 0)
					.ease(d3.easeSinInOut)
					.on('end', function() { d3.select(this).remove() }) // Use this instead of .remove() to circumvent pending transitions
				.style('opacity', 0)

		if (callback) {
			setTimeout(() => {
				callback()
			}, settings.GRAPH_ANIMATION_DURATION)
		}
	}

	// -----------------> Transitions

	private Domains() {
		const bbx = this.boundingBox(this.graph.domains)
		this.moveCamera(bbx.x, bbx.y, bbx.k)
		this.setBackground('domains')
		this.setContent(this.graph.domains, this.graph.domain_relations)
		this.restoreContent()

		this.state = this.interactive ? SVGState.dynamic : SVGState.static
	}

	private Subjects() {
		const bbx = this.boundingBox(this.graph.subjects)
		this.moveCamera(bbx.x, bbx.y, bbx.k)
		this.setBackground('subjects')
		this.setContent(this.graph.subjects, this.graph.subject_relations)
		this.restoreContent()

		this.state = this.interactive ? SVGState.dynamic : SVGState.static
	}

	private Lectures() {

		// If going to empty lecture, await lecture selection
		if (this.lecture === null) {
			this.state = SVGState.await_lecture
			return
		}

		this.moveCamera(0, 0, 1)
		this.setBackground('lectures')
		this.setContent(this.lecture.subjects, this.lecture.relations)
		this.moveContent(this.lecture.subjects, this.lectureTransform(0, 0))

		this.state = SVGState.lecture
	}

	private domainsToSubjects() {

		// If coming out of broken state, skip animation
		if (this.state === SVGState.broken) {
			this.Subjects()
			return
		}

		// Animate from domains to subjects
		this.state = SVGState.animating

		const bbx = this.boundingBox(this.graph.subjects)
		this.setContent(this.graph.subjects, this.graph.subject_relations)
		this.moveContent(this.graph.subjects, this.domainTransform)

		this.moveCamera(bbx.x, bbx.y, bbx.k, ANIMATE)
		this.restoreContent(() => {
			this.state = this.interactive ? SVGState.dynamic : SVGState.static
		})
	}

	private domainsToLectures() {

		// If coming out of overlay state, skip animation
		if (this.state === SVGState.broken) {
			this.Lectures()
			return
		}

		// If going to empty lecture, await lecture selection
		if (this.lecture === null) {
			this.state = SVGState.await_lecture
			return
		}

		// Animate from domains to lectures
		this.state = SVGState.animating

		const bbx = this.boundingBox(this.graph.domains)
		this.moveCamera(bbx.x, bbx.y, 1, ANIMATE)
		this.setContent(this.lecture.subjects, this.lecture.relations)
		this.moveContent(this.lecture.subjects, this.domainTransform)
		this.moveContent(this.lecture.subjects, this.lectureTransform(bbx.x, bbx.y), () => {
			this.setBackground('lectures')
			this.state = SVGState.lecture
		})
	}

	private subjectsToDomains() {

		// If coming out of broken state, skip animation
		if (this.state === SVGState.broken) {
			this.Domains()
			return
		}

		// Animate from subjects to domains
		this.state = SVGState.animating

		const bbx = this.boundingBox(this.graph.domains)
		this.moveCamera(bbx.x, bbx.y, bbx.k, ANIMATE)
		this.moveContent(this.graph.subjects, this.domainTransform, () => {
			this.setContent(this.graph.domains, this.graph.domain_relations, () => {
				this.state = this.interactive ? SVGState.dynamic : SVGState.static
			})
		})
	}

	private subjectsToLectures() {

		// If coming out of broken state, skip animation
		if (this.state === SVGState.broken) {
			this.Lectures()
			return
		}

		// If going to empty lecture, await lecture selection
		if (this.lecture === null) {
			this.state = SVGState.await_lecture
			return
		}

		// Animate from subjects to lectures
		this.state = SVGState.animating

		const bbx = this.boundingBox(this.graph.subjects)
		this.moveCamera(bbx.x, bbx.y, 1, ANIMATE)
		this.setContent(this.lecture.subjects, this.lecture.relations, () => {
			this.moveContent(this.lecture!.subjects, this.lectureTransform(bbx.x, bbx.y), () => {
				this.setBackground('lectures')
				this.state = SVGState.lecture
			})
		})
	}

	private lecturesToDomains() {

		// If coming out of overlay state, skip animation
		if (this.state === SVGState.broken || this.state === SVGState.await_lecture) {
			this.Domains()
			return
		}

		// Animate from lectures to domains
		this.state = SVGState.animating

		const bbx = this.boundingBox(this.graph.domains)
		this.panCamera(bbx.x, bbx.y)
		this.setBackground('domains')
		this.moveContent(this.lecture!.subjects, this.lectureTransform(bbx.x, bbx.y))

		this.zoomCamera(bbx.k, ANIMATE)
		this.moveContent(this.lecture!.subjects, this.domainTransform, () => {
			this.setContent(this.graph.domains, this.graph.domain_relations, () => {
				this.state = this.interactive ? SVGState.dynamic : SVGState.static
			})
		})
	}

	private lecturesToSubjects() {

		// If coming out of broken state, or from empty lecture, skip animation
		if (this.state === SVGState.broken || this.state === SVGState.await_lecture) {
			this.Subjects()
			return
		}

		// Animate from lectures to subjects
		this.state = SVGState.animating

		const bbx = this.boundingBox(this.graph.subjects)
		this.panCamera(bbx.x, bbx.y)
		this.setBackground('subjects')
		this.moveContent(this.lecture!.subjects, this.lectureTransform(bbx.x, bbx.y))

		this.zoomCamera(bbx.k, ANIMATE)
		this.restoreContent(() => {
			this.setContent(this.graph.subjects, this.graph.subject_relations, () => {
				this.state = this.interactive ? SVGState.dynamic : SVGState.static
			})
		})
	}

	// -----------------> Transforms

	private domainTransform(subject: SubjectController) {
		subject.x = subject.domain!.x
		subject.y = subject.domain!.y
	}

	private lectureTransform(x: number, y: number) {
		const height = this.lecture?.max_height || 0
		const past = this.lecture?.past_subjects
		const present = this.lecture?.present_subjects
		const future = this.lecture?.future_subjects

		const dx = x - 3 * settings.LECTURE_COLUMN_WIDTH / 2
		const dy = y - (settings.LECTURE_HEADER_HEIGHT + height * settings.NODE_HEIGHT + (height + 1) * settings.LECTURE_PADDING) / 2

		return (subject: SubjectController) => {

			// Set past subject positions to the right column
			if (past?.includes(subject)) {
				const index = past.indexOf(subject)
				subject.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_PADDING
				subject.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.NODE_HEIGHT
				return
			}

			// Set present subject positions to the middle column
			if (present?.includes(subject)) {
				const index = present.indexOf(subject)
				subject.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_COLUMN_WIDTH + settings.LECTURE_PADDING
				subject.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.NODE_HEIGHT
				return
			}

			// Set future subject positions to the left column
			if (future?.includes(subject)) {
				const index = future.indexOf(subject)
				subject.x = dx + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + 2 * settings.LECTURE_COLUMN_WIDTH + settings.LECTURE_PADDING
				subject.y = dy + settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.NODE_HEIGHT
				return
			}
		}
	}
}