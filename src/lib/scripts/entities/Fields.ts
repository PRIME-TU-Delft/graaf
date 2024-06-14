
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
		public id: number, 
		public name: string = '', 
		public parents: T[] = [], 
		public children: T[] = []
	) { }

	abstract get color(): string
	abstract validate(): ValidationData
	abstract delete(): void
}

class Domain extends Field<Domain> {
	style?: string

	// Inferred
	subjects: Subject[] = []

	constructor(graph: Graph, id: number, style?: string, name?: string, parents: Domain[] = [], children: Domain[] = []) {
		super(graph, id, name, parents, children)
		this.style = style
	}

	get style_options(): DropdownOption<string>[] {
		/* Return the style options of this domain */

		const options = []
		for (const [style, value] of Object.entries(styles)) {
			const response = new ValidationData()
			if (this.graph.domains.some(domain => this !== domain && domain.style === style))
				response.add(new Warning('Duplicate style'))
			options.push(new DropdownOption(value.display_name, style, response))
		}

		return options
	}

	get color(): string {
		/* Return the preview color of this domain */

		return this.style ? styles[this.style].stroke : 'transparent'
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

		const domain = new Domain(graph, 0, style) // TODO Implement ID generation
		graph.domains.push(domain)
		return domain
	}

	validate(): ValidationData {
		/* Validate this domain */

		const response = new ValidationData()

		// Check if the domain has a name
		if (this.name === '')
			response.add(new Error(`Domain (${this.id}) doesn\'t have a name`))

		// Check if the domain has a unique name
		else {
			const index = this.graph.domains.findIndex(domain => domain.name === this.name)
			if (index < this.graph.domains.indexOf(this)) {
				response.add(
					new Warning(
						`Domain (${this.id}) name isn\'t unique`, 
						`First used by domain (${this.graph.domains[index].id})`
					)
				)
			}
		}

		// Check if the domain has a style
		if (!this.style)
			response.add(new Error(`Domain (${this.id}) doesn\'t have a style`))

		// Check if the domain has a unique style
		else {
			const index = this.graph.domains.findIndex(domain => domain.style === this.style)
			if (index < this.graph.domains.indexOf(this)) {
				response.add(
					new Warning(
						`Domain (${this.id}) style isn\'t unique`, 
						`First used by domain (${this.graph.domains[index].id})`
					)
				)
			}
		}

		return response
	}

	delete(): void {
		/* Delete this domain */

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
	private _domain?: Domain

	constructor(graph: Graph, id: number, name?: string, domain?: Domain, parents: Subject[] = [], children: Subject[] = []) {
		super(graph, id, name, parents, children)
		this.domain = domain
	}

	get domain(): Domain | undefined {
		/* Return the domain of this subject */

		return this._domain
	}

	set domain(domain: Domain | undefined) {
		/* Set the domain of this subject */

		// Ensure the domain is different
		if (this.domain === domain) return

		// Remove this subject from the old domain
		if (this.domain) {
			this.domain.subjects = this.domain.subjects.filter(subject => subject !== this)
		}

		// Add this subject to the new domain
		if (domain) {
			domain.subjects.push(this)
		}
		
		this._domain = domain
	}

	get color(): string {
		/* Return the preview color of this subject */

		return this.domain?.color || 'transparent'
	}

	static create(graph: Graph): Subject {
		/* Create this subject */

		const subject = new Subject(graph, 0) // TODO Implement ID generation
		graph.subjects.push(subject)
		return subject
	}

	validate(): ValidationData {
		/* Validate this subject */

		const response = new ValidationData()

		// Check if the subject has a name
		if (this.name === '')
			response.add(new Error('Subject must have a name'))

		// Check if the name is unique
		else if (this.graph.subjects.some(subject => subject !== this && subject.name === this.name))
			response.add(new Warning('Subject name isn\'t unique'))

		// Check if the subject has a domain
		if (!this.domain)
			response.add(new Error('Subject must have a domain'))

		return response
	}

	delete(): void {
		/* Delete this subject */

		// Delete relations
		for (const relation of this.graph.subject_relations) {
			if (relation.parent === this || relation.child === this) {
				relation.delete()
			}
		}

		// Remove subject from lectures
		for (const lecture of this.graph.lectures) {
			lecture.subjects = lecture.subjects.filter(subject => subject !== this)
		}

		// Remove this subject from the graph
		this.graph.subjects = this.graph.subjects.filter(subject => subject !== this)
	}
}