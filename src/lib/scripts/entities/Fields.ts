
// External imports
import * as uuid from 'uuid'

// Internal imports
import { ValidationData, Severity } from './Validation'
import { Graph } from './Graph'

import * as settings from '../settings'
import { styles } from '../settings'

// Exports
export { Field, Domain, Subject }
export type { SerializedDomain, SerializedSubject }


// --------------------> Types


type ID = number

type SerializedDomain = {
	id: ID,
	x: number,
	y: number,
	name?: string,
	style?: string,
	parents: ID[],
	children: ID[]
}

type SerializedSubject = {
	id: ID,
	x: number,
	y: number,
	name?: string,
	domain?: ID,
	parents: ID[],
	children: ID[]
}


// --------------------> Classes


abstract class Field<T extends Domain | Subject> {
	fx?: number					// The locked x-coordinate of this field
	fy?: number					// The locked y-coordinate of this field

	constructor(
		public graph: Graph,	// The graph this field belongs to
		public anchor: string,	// The anchor of this field, unique for every DOM element, used for finding errors and d3 selections
		public index: number,	// The index of this field in the list of its type, based on creation order, consistent after sorting, deleting etc
		public id: ID,			// The ID of this field in the database, unique among its type, NOT among all fields
		public x: number,		// The current x-coordinate of this field
		public y: number,		// The current y-coordinate of this field
		public name: string,	// The name of this field
		public parents: T[],	// The parents of this field
		public children: T[],	// The children of this field
	) {
		/* Create a new field */

		this.fx = x
		this.fy = y
	}

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
		id: ID,
		x: number = 0,
		y: number = 0,
		style?: string,
		name: string = '',
		parents: Domain[] = [],
		children: Domain[] = []
	) {
		super(graph, uuid.v4(), index, id, x, y, name, parents, children)
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

	get style_options() {
		/* Return the style options of this domain */

		const options = []
		for (const [style, value] of Object.entries(styles)) {
			const validation = new ValidationData()

			// Check if the style is already used
			if (this.graph.domains.some(domain => domain.style === style && domain !== this)) {
				validation.add({ severity: Severity.warning, short:'Duplicate style' })
			}

			options.push({
				name: value.display_name,
				value: style,
				validation
			})
		}

		return options
	}

	static async create(graph: Graph): Promise<Domain> {
		/* Create a new domain */

		// Call API to create domain
		const res = await fetch(`/api/graph/${graph.id}/domain`, { method: 'POST' })
		if (!res.ok) throw new Error('Failed to create domain')
		
		// Parse response
		const data = await res.json()
		const domain = new Domain(
			graph,
			graph.domains.length,
			data.id
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
			response.add({
				severity: Severity.error,
				short: 'Domain has no name',
				tab: 1,
				anchor: this.anchor
			})
		}

		else {

			// Check if the domain has a unique name
			const first = this.findOriginal(this.graph.domains, this, domain => domain.name)
			if (first !== -1) {
				response.add({
					severity: Severity.error,
					short: 'Domain has duplicate name',
					long: `Name first used by Domain nr. ${first + 1}`,
					tab: 1,
					anchor: this.anchor
				})
			}

			// Check if the name is too long
			if (this.name.length > settings.FIELD_MAX_CHARS) {
				response.add({
					severity: Severity.error,
					short: 'Domain name too long',
					long: `Name exceeds ${settings.FIELD_MAX_CHARS} characters`,
					tab: 1,
					anchor: this.anchor
				})
			}
		}

		// Check if the domain has a style
		if (!this.hasStyle()) {
			response.add({
				severity: Severity.error,
				short: 'Domain has no style',
				tab: 1,
				anchor: this.anchor
			})
		}

		else {

			// Check if the domain has a unique style
			const first = this.findOriginal(this.graph.domains, this, domain => domain.style)
			if (first !== -1) {
				response.add({
					severity: Severity.warning,
					short: 'Domain has duplicate style',
					long: `Style first used by Domain nr. ${first + 1}`,
					tab: 1,
					anchor: this.anchor
				})
			}
		}

		// Check if the domain has subjects
		if (!this.hasSubjects()) {
			response.add({
				severity: Severity.warning,
				short: 'Domain has no subjects',
				tab: 1,
				anchor: this.anchor
			})
		}

		return response
	}

	reduce(): SerializedDomain {
		/* Serialize domain to a POJO */

		return {
			id: this.id,
			x: this.x,
			y: this.y,
			style: this.style!,
			name: this.name,
			parents: this.parents.map(parent => parent.id),
			children: this.children.map(child => child.id)
		}
	}

	async delete(): Promise<void> {
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

		// Call API to delete domain
		const res = await fetch(`/api/domain/${this.id}`, { method: 'DELETE' })
		if (!res.ok) throw new Error('Failed to create domain')

		// Remove this domain from the graph
		this.graph.domains = this.graph.domains.filter(domain => domain !== this)
	}
}

class Subject extends Field<Subject> {
	domain?: Domain

	constructor(
		graph: Graph,
		index: number,
		id: ID,
		x: number = 0,
		y: number = 0,
		domain?: Domain,
		name: string = '',
		parents: Subject[] = [],
		children: Subject[] = []
	) {
		super(graph, uuid.v4(), index, id, x, y, name, parents, children)
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

	get domain_options() {
		/* Return the domain options of this subject */

		const options = []
		for (const domain of this.graph.domains) {

			// Check if the domain has a name
			if (!this.hasName(domain)) continue

			options.push({
				name: domain.name,
				value: domain,
				validation: ValidationData.success()
			})
		}

		return options
	}

		private hasDomain(): boolean {
		/* Check if the domain of a subject is undefined */

		return this.domain !== undefined
	}

	static create(graph: Graph, id: ID) {
		/* Create a new subject */

		const subject = new Subject(graph, graph.subjects.length, id)
		graph.subjects.push(subject)
		return subject
	}

	validate(): ValidationData {
		/* Validate this subject */

		const response = new ValidationData()

		// Check if the subject has a name
		if (!this.hasName(this)) {
			response.add({
				severity: Severity.error,
				short: 'Subject has no name',
				tab: 2,
				anchor: this.anchor
			})
		}

		else {

			// Check if the name is unique
			const first = this.findOriginal(this.graph.subjects, this, subject => subject.name)
			if (first !== -1) {
				response.add({
					severity: Severity.error,
					short: 'Subject has duplicate name',
					long: `Name first used by Subject nr. ${first + 1}`,
					tab: 2,
					anchor: this.anchor
				})
			}

			// Check if the name is too long
			if (this.name.length > settings.FIELD_MAX_CHARS) {
				response.add({
					severity: Severity.error,
					short: 'Subject name too long',
					long: `Name exceeds ${settings.FIELD_MAX_CHARS} characters`,
					tab: 2,
					anchor: this.anchor
				})
			}
		}

		// Check if the subject has a domain
		if (!this.hasDomain()) {
			response.add({
				severity: Severity.error,
				short: 'Subject has no domain',
				tab: 2,
				anchor: this.anchor
			})
		}

		return response
	}

	reduce(): SerializedSubject {
		/* Serialize subject to a POJO */

		return {
			id: this.id,
			x: this.x,
			y: this.y,
			domain: this.domain ? this.domain.id : undefined,
			name: this.name,
			parents: this.parents.map(parent => parent.id),
			children: this.children.map(child => child.id)
		}
	}

	async delete(): Promise<void> {
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

		// Call API to delete subject
		await fetch(`/api/subject/${this.id}`, { method: 'DELETE' });

		// Remove this subject from the graph
		this.graph.subjects = this.graph.subjects.filter(subject => subject !== this)
	}
}
