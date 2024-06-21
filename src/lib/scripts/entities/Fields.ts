
// Internal imports
import { ValidationData, Error, Warning } from './ValidationData'
import { DropdownOption } from './DropdownOption'

import { Graph } from './Graph'
import { styles } from '../settings'

import type { UUID } from './Graph'

// Exports
export { Field, Domain, Subject }
export type { DomainData, SubjectData }


// --------------------> Types


type DomainData = {
	uuid: UUID,
	x: number,
	y: number,
	style: string,
	name: string,
	parents: UUID[],
	children: UUID[]
}

type SubjectData = {
	uuid: UUID,
	x: number,
	y: number,
	domain: UUID,
	name: string,
	parents: UUID[],
	children: UUID[]
}


// --------------------> Classes


abstract class Field<T extends Domain | Subject> {
	constructor(
		public graph: Graph,
		public index: number,
		public uuid: string,
		public x: number,
		public y: number,
		public name: string,
		public parents: T[],
		public children: T[]
	) { }

	protected hasName(field: Domain | Subject): boolean {
		/* Check if the name of a field is undefined */

		return field.name !== ''
	}

	protected findOriginal<S, T>(list: S[], value: S, key: (item: S) => T): number {
		/* Find the original item in a list
		 * Returns -1 if value doesn't exist, or isnt a duplicate
		 * Returns the index of the first duplicate otherwise
		 */

		const first = list.findIndex(item => key(item) === key(value))
		const index = list.indexOf(value, first + 1)
		return index === -1 ? -1 : first
	}

	abstract get style(): string | undefined
	abstract get color(): string
	abstract validate(): ValidationData
	abstract delete(): void
}

class Domain extends Field<Domain> {
	private _style?: string

	constructor(
		graph: Graph,
		index: number,
		uuid: string,
		x: number = 0,
		y: number = 0,
		style?: string,
		name: string = '',
		parents: Domain[] = [],
		children: Domain[] = []
	) {
		super(graph, index, uuid, x, y, name, parents, children)
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
			if (this.findOriginal(this.graph.domains, this, domain => domain.style) !== -1) {
				response.add(new Warning('Duplicate style'))
			}

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
			graph.domains.length,
			Graph.generateUUID(),
			0, 0, // TODO find non-overlapping coordinates
			style
		)

		graph.domains.push(domain)
		return domain
	}

	private hasStyle(): boolean {
		/* Check if the style of a domain is undefined */

		return this.style !== undefined
	}

	private hasSubjects(): boolean {
		/* Check if the domain has subjects */

		return this.subjects.length > 0
	
	}

	validate(): ValidationData {
		/* Validate this domain */

		const response = new ValidationData()

		// Check if the domain has a name
		if (!this.hasName(this)) {
			response.add(new Error(
				'Domain must have a name',
				undefined,
				1, this.uuid
			))
		}

		// Check if the domain has a unique name
		else {
			const first = this.findOriginal(this.graph.domains, this, domain => domain.name)
			if (first !== -1) {
				response.add(new Error(
					'Domain must have a unique name',
					`Name first used by Domain nr. ${first + 1}`,
					1, this.uuid
				))
			}
		}

		// Check if the domain has a style
		if (!this.hasStyle()) {
			response.add(new Error(
				'Domain must have a style',
				undefined,
				1, this.uuid
			))
		}

		// Check if the domain has a unique style
		else {
			const first = this.findOriginal(this.graph.domains, this, domain => domain.style)
			if (first !== -1) {
				response.add(new Error(
					'Domain must have a unique style',
					`Style first used by Domain nr. ${first + 1}`,
					1, this.uuid
				))
			}
		}

		// Check if the domain has subjects
		if (!this.hasSubjects()) {
			response.add(new Warning(
				'Domain has no subjects',
				'You might want to assign subjects to this domain',
				1, this.uuid
			))
		}

		return response
	}

	reduce(): DomainData {
		/* Serialize domain to a POJO */

		return {
			uuid: this.uuid,
			x: this.x,
			y: this.y,
			style: this.style!,
			name: this.name,
			parents: this.parents.map(parent => parent.uuid),
			children: this.children.map(child => child.uuid)
		}
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
		index: number,
		uuid: string,
		x: number = 0,
		y: number = 0,
		domain?: Domain,
		name: string = '',
		parents: Subject[] = [],
		children: Subject[] = []
	) {
		super(graph, index, uuid, x, y, name, parents, children)
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
			if (!this.hasName(domain)) continue

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
			graph.subjects.length,
			Graph.generateUUID(),
			0, 0 // TODO find non-overlapping coordinates
		)

		graph.subjects.push(subject)
		return subject
	}

	private hasDomain(): boolean {
		/* Check if the domain of a subject is undefined */

		return this.domain !== undefined
	}

	validate(): ValidationData {
		/* Validate this subject */

		const response = new ValidationData()

		// Check if the subject has a name
		if (!this.hasName(this)) {
			response.add(new Error(
				'Subject must have a name',
				undefined,
				2, this.uuid
			))
		}

		// Check if the name is unique
		else {
			const first = this.findOriginal(this.graph.subjects, this, subject => subject.name)
			if (first !== -1) {
				response.add(new Error(
					'Subject must have a unique name',
					`Name first used by Subject nr. ${first + 1}`,
					2, this.uuid
				))
			}
		}

		// Check if the subject has a domain
		if (!this.hasDomain()) {
			response.add(new Error(
				'Subject must have a domain',
				undefined,
				2, this.uuid
			))
		}

		return response
	}

	reduce(): SubjectData {
		/* Serialize subject to a POJO */

		return {
			uuid: this.uuid,
			x: this.x,
			y: this.y,
			domain: this.domain!.uuid,
			name: this.name,
			parents: this.parents.map(parent => parent.uuid),
			children: this.children.map(child => child.uuid)
		}
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
