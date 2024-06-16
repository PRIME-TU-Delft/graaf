
// Internal imports
import { ValidationData, Error, Warning } from './ValidationData'
import { DropdownOption } from './DropdownOption'
import { styles } from '../settings'
import { Graph } from '../entities'

// Exports
export { Field, Domain, Subject }


// --------------------> Classes


abstract class Field<T extends Domain | Subject> {
	constructor(
		public graph: Graph,
		public uuid: string,
		public index: number,
		public x: number,
		public y: number,
		public name: string,
		public parents: T[],
		public children: T[]
	) { }

	abstract get style(): string | undefined
	abstract get color(): string
	abstract validate(): ValidationData
	abstract delete(): void
}

class Domain extends Field<Domain> {
	private _style?: string

	constructor(
		graph: Graph,
		uuid: string,
		index: number,
		x: number = 0,
		y: number = 0,
		style?: string,
		name: string = '',
		parents: Domain[] = [],
		children: Domain[] = []
	) {
		super(graph, uuid, index, x, y, name, parents, children)
		this.style = style
	}

	get subjects(): Subject[] {
		/* Return the subjects of this domain */

		const subjects = []
		for (const subject of this.graph.subjects) {
			if (subject.domain === this) {
				subjects.push(subject)
			}
		}

		return subjects
	}

	get color(): string {
		/* Return the preview color of this domain */

		return this.style ? styles[this.style].stroke : 'transparent'
	}

	get style(): string | undefined {
		/* Return the style of this domain */

		return this._style
	}

	set style(style: string | undefined) {
		/* Set the style of this domain */

		this._style = style
	}

	get style_options(): DropdownOption<string>[] {
		/* Return the style options of this domain */

		const options = []
		for (const [style, value] of Object.entries(styles)) {
			const response = new ValidationData()

			// Check if the style is already used
			if (this.graph.domains.some(domain => this !== domain && domain.style === style))
				response.add(new Warning('Duplicate style'))

			options.push(new DropdownOption(value.display_name, style, response))
		}

		return options
	}

	static create(graph: Graph): Domain {
		/* Create this domain */

		// Find unused style
		let style = undefined
		for (const key of Object.keys(styles)) {
			if (graph.domains.some(domain => domain.style === key)) continue
			style = key
			break
		}

		// Create domain
		const domain = new Domain(
			graph,
			Graph.generateUUID(),
			graph.domains.length,
			0, 0, // TODO find non-overlapping coordinates
			style
		)

		graph.domains.push(domain)
		return domain
	}

	validate(): ValidationData {
		/* Validate this domain */

		const response = new ValidationData()

		// Check if the domain has a name
		if (this.name === '')
			response.add(new Error(`Domain (${this.index + 1}) has no name`))

		// Check if the domain has a unique name
		else {
			const first = this.graph.domains.findIndex(domain => domain.name === this.name)
			if (first < this.graph.domains.indexOf(this)) {
				response.add(
					new Warning(
						`Domain (${this.index + 1}) name isn\'t unique`,
						`First used by domain (${this.graph.domains[first].index})`
					)
				)
			}
		}

		// Check if the domain has a style
		if (!this.style)
			response.add(new Error(`Domain (${this.index + 1}) has no style`))

		// Check if the domain has a unique style
		else {
			const first = this.graph.domains.findIndex(domain => domain.style === this.style)
			if (first < this.graph.domains.indexOf(this)) {
				response.add(
					new Warning(
						`Domain (${this.index + 1}) style isn\'t unique`,
						`First used by domain (${this.graph.domains[first].index + 1})`
					)
				)
			}
		}

		return response
	}

	delete(): void {
		/* Delete this domain */

		// Shift indexes
		for (const domain of this.graph.domains) {
			if (domain.index > this.index) {
				domain.index--
			}
		}

		// Delete relations
		for (const relation of this.graph.domain_relations) {
			if (relation.parent === this || relation.child === this) {
				relation.delete()
			}
		}

		// Unset subjects with this domain
		for (const subject of this.graph.subjects) {
			if (subject.domain === this) {
				subject.domain = undefined
			}
		}

		// Remove this domain from the graph
		this.graph.domains = this.graph.domains.filter(domain => domain !== this)
	}
}

class Subject extends Field<Subject> {
	domain?: Domain

	constructor(
		graph: Graph,
		uuid: string,
		index: number,
		x: number = 0,
		y: number = 0,
		domain?: Domain,
		name: string = '',
		parents: Subject[] = [],
		children: Subject[] = []
	) {
		super(graph, uuid, index, x, y, name, parents, children)
		this.domain = domain
	}

	get color(): string {
		/* Return the preview color of this subject */

		return this.domain?.color || 'transparent'
	}

	get style(): string | undefined {
		/* Return the style of this subject */

		return this.domain?.style
	}

	get domain_options(): DropdownOption<Domain>[] {
		/* Return the domain options of this subject */

		const options = []
		for (const domain of this.graph.domains) {

			// Check if the domain has a name
			if (domain.name === '') continue

			options.push(
				new DropdownOption(
					domain.name,
					domain,
					new ValidationData()
				)
			)
		}

		return options
	}

	static create(graph: Graph): Subject {
		/* Create this subject */

		const subject = new Subject(
			graph,
			Graph.generateUUID(),
			graph.subjects.length,
			0, 0 // TODO find non-overlapping coordinates
		)

		graph.subjects.push(subject)
		return subject
	}

	validate(): ValidationData {
		/* Validate this subject */

		const response = new ValidationData()

		// Check if the subject has a name
		if (this.name === '')
			response.add(new Error(`Subject (${this.index + 1}) has no name`))

		// Check if the name is unique
		else {
			const first = this.graph.subjects.findIndex(subject => subject.name === this.name)
			if (first < this.graph.subjects.indexOf(this)) {
				response.add(
					new Warning(
						`Subject (${this.index + 1}) name isn\'t unique`,
						`First used by subject (${this.graph.subjects[first].index + 1})`
					)
				)
			}
		}

		// Check if the subject has a domain
		if (!this.domain)
			response.add(new Error(`Subject (${this.index + 1}) has no assigned domain`))

		return response
	}

	delete(): void {
		/* Delete this subject */

		// Shift indexes
		for (const subject of this.graph.subjects) {
			if (subject.index > this.index) {
				subject.index--
			}
		}

		// Delete relations
		for (const relation of this.graph.subject_relations) {
			if (relation.parent === this || relation.child === this) {
				relation.delete()
			}
		}

		// Remove subject from lectures
		for (const lecture of this.graph.lectures) {
			lecture.lecture_subjects = lecture.lecture_subjects.filter(ls => ls.subject !== this)
		}

		// Remove this subject from the graph
		this.graph.subjects = this.graph.subjects.filter(subject => subject !== this)
	}
}