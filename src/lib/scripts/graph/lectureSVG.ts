
// External imports
import * as d3 from 'd3'

// Internal imports
import { Graph, Lecture, Subject, SubjectRelation } from './entities'
import { createArrowhead } from './arrowhead'
import { RelationSVG } from './relationSVG'
import { FieldSVG } from './fieldSVG'
import * as settings from './settings'

export class LectureSVG {
	graph: Graph
	lecture?: Lecture
	svg?: SVGSVGElement

	constructor(graph: Graph) {
		this.graph = graph
	}

	load(element: SVGSVGElement, lecture?: Lecture) {
		this.svg = element

		// D3 Magic
		const svg = d3.select<SVGSVGElement, unknown>(this.svg)
		svg.append('defs')

		// Create arrowhead
		createArrowhead(element)

		// Past subjects
		const past = svg.append('g')
			.attr('id', 'past')

		past.append('rect')
			.attr('x', settings.STROKE_WIDTH / 2)
			.attr('y', settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
			.attr('width', settings.LECTURE_WIDTH * settings.GRID_UNIT)
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('fill', 'transparent')
			.attr('stroke', 'black')

		past.append('text')
			.attr('x', (settings.STROKE_WIDTH + settings.LECTURE_WIDTH * settings.GRID_UNIT) / 2)
			.attr('y', settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT / 2)
			.attr('font-size', settings.LECTURE_FONT_SIZE)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.text('Past Topics')

		// Present subjects
		const present = svg.append('g')
			.attr('id', 'present')

		present.append('rect')
			.attr('x', settings.STROKE_WIDTH / 2 + settings.LECTURE_WIDTH * settings.GRID_UNIT)
			.attr('y', settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
			.attr('width', settings.LECTURE_WIDTH * settings.GRID_UNIT)
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('fill', 'transparent')
			.attr('stroke', 'black')

		present.append('text')
			.attr('x', (settings.STROKE_WIDTH + 3 * settings.LECTURE_WIDTH * settings.GRID_UNIT) / 2)
			.attr('y', settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT / 2)
			.attr('font-size', settings.LECTURE_FONT_SIZE)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.text('This Lecture')

		// Future subjects
		const future = svg.append('g')
			.attr('id', 'future')
			.lower() // To ensure relations are drawn on top of rectangles

		future.append('rect')
			.attr('x', settings.STROKE_WIDTH / 2 + 2 * settings.LECTURE_WIDTH * settings.GRID_UNIT)
			.attr('y', settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT)
			.attr('width', settings.LECTURE_WIDTH * settings.GRID_UNIT)
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('fill', 'transparent')
			.attr('stroke', 'black')

		future.append('text')
			.attr('x', (settings.STROKE_WIDTH + 5 * settings.LECTURE_WIDTH * settings.GRID_UNIT) / 2)
			.attr('y', settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT / 2)
			.attr('font-size', settings.LECTURE_FONT_SIZE)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.text('Future Topics')
		
		// Fill content
		this.show(lecture)
	}

	unload() {
		this.lecture = undefined
		this._clear()
	}

	show(lecture?: Lecture) {
		if (this.svg === undefined || this.lecture === lecture) return

		// Prepare svg
		this.lecture = lecture
		this._clear()

		// Gather data
		if (this.lecture === undefined) return
		const parents = this.lecture.parents()
		const subjects = this.lecture.subjects as Subject[]
		const children = this.lecture.children()
		const relations = this.lecture.relations()
		const most_subjects = Math.max(parents.length, subjects.length, children.length)

		// Copy objects using lecture layout
		const copied_parents = parents.map((subject, index) =>
			new Subject(
				subject.graph,
				subject.id,
				settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_PADDING,
				settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT,
				subject.name,
				subject.domain,
				false
			)
		)

		const copied_subjects = subjects.map((subject, index) =>
			new Subject(
				subject.graph,
				subject.id,
				settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + settings.LECTURE_WIDTH + settings.LECTURE_PADDING,
				settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT,
				subject.name,
				subject.domain,
				false
			)
		)

		const copied_children = children.map((subject, index) =>
			new Subject(
				subject.graph,
				subject.id,
				settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + 2 * settings.LECTURE_WIDTH + settings.LECTURE_PADDING,
				settings.LECTURE_HEADER_HEIGHT + settings.STROKE_WIDTH / (2 * settings.GRID_UNIT) + (index + 1) * settings.LECTURE_PADDING + index * settings.FIELD_HEIGHT,
				subject.name,
				subject.domain,
				false
			)
		)

		const copied_relations = relations.map(relation => 
			new SubjectRelation(
				relation.graph,
				relation.id,
				copied_parents.find(subject => subject.id === relation.parent!.id) || copied_subjects.find(subject => subject.id === relation.parent!.id),
				copied_subjects.find(subject => subject.id === relation.child!.id) || copied_children.find(subject => subject.id === relation.child!.id),
				false
			)
		)
			
		// D3 Magic
		const svg = d3.select(this.svg)

		// Past subjects
		const past = svg.select('#past')
		past.select('rect')
			.attr('height', ((most_subjects + 1) * settings.LECTURE_PADDING + most_subjects * settings.FIELD_HEIGHT) * settings.GRID_UNIT)

		past.selectAll('g')
			.data(copied_parents)
			.enter()
			.append('g')
				.each(function() {
					FieldSVG.create(this, false)
				})

		// Present subjects
		const present = svg.select('#present')
		present.select('rect')
			.attr('height', ((most_subjects + 1) * settings.LECTURE_PADDING + most_subjects * settings.FIELD_HEIGHT) * settings.GRID_UNIT)
	
		present.selectAll('line')
			.data(copied_relations)
			.enter()
			.append('line')
				.each(function() { RelationSVG.create(this) })
	
		present.selectAll('g')
			.data(copied_subjects)
			.enter()
			.append('g')
				.each(function() { FieldSVG.create(this, false) })

		// Future subjects
		const future = svg.select('#future')
		future.select('rect')
			.attr('height', ((most_subjects + 1) * settings.LECTURE_PADDING + most_subjects * settings.FIELD_HEIGHT) * settings.GRID_UNIT)
		
		future.selectAll('g')
			.data(copied_children)
			.enter()
			.append('g')
				.each(function() { FieldSVG.create(this, false) })
	}

	_clear() {
		if (this.svg === undefined) return

		const svg = d3.select(this.svg)
		svg.select('#past')
			.attr('height', settings.LECTURE_PADDING * settings.GRID_UNIT)
			.selectAll('g')
				.remove()

		svg.select('#present')
			.attr('height', settings.LECTURE_PADDING * settings.GRID_UNIT)
			.selectAll('g, line')
				.remove()
		
		svg.select('#future')
			.attr('height', settings.LECTURE_PADDING * settings.GRID_UNIT)
			.selectAll('g')
				.remove()
	}
}

