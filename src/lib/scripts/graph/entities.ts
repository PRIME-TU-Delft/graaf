
// Internal Imports
import { styles } from './settings'

// Exports
export { Course, Graph, Field, Domain, Subject, Relation, DomainRelation, SubjectRelation, Lecture }

// TODO course probably shouldnt be in this file
class Course {
	code: string
	name: string

	constructor(code: string) {
		// TODO load from database

		this.code = code
		this.name = 'Course Name'
	}
}

// Entities

class Graph {
	name: string
	domains: Domain[]
	subjects: Subject[]
	domainRelations: DomainRelation[]
	subjectRelations: SubjectRelation[]
	lectures: Lecture[]

	constructor(name: string, domains: Domain[], subjects: Subject[], domainRelations: DomainRelation[], subjectRelations: SubjectRelation[], lectures: Lecture[]) {
		this.name = name
		this.domains = domains
		this.subjects = subjects
		this.domainRelations = domainRelations
		this.subjectRelations = subjectRelations
		this.lectures = lectures
	}

	static create(data: object): Graph {
		throw new Error('Not implemented')
	}

	serialize(): object {
		throw new Error('Not implemented')
	}

	validate(): boolean {

		// Check for missing fields
		for (const domain of this.domains)
			if (!domain.name || !domain.style) return false
		for (const subject of this.subjects)
			if (!subject.name || !subject.domain) return false
		for (const relation of this.domainRelations)
			if (!relation.parent || !relation.child) return false
		for (const relation of this.subjectRelations)
			if (!relation.parent || !relation.child) return false

		return true
	}

	save() {
		throw new Error('Not implemented')
	}

	delete() {
		throw new Error('Not implemented')
	}

	nextDomainStyle(): string | undefined {
		const usedStyles = this.domains.map(domain => domain.style)
		return Object.keys(styles).find(style => !usedStyles.includes(style))
	}
}

abstract class Field {
	graph: Graph
	x: number
	y: number
	name?: string

	constructor(graph: Graph, x: number, y: number, name?: string) {
		this.graph = graph
		this.x = x
		this.y = y
		this.name = name
	}

	get parents(): Field[] {
		const relations = this instanceof Domain ? this.graph.domainRelations : this.graph.subjectRelations
		const parents: Field[] = [this]

		for (const relation of relations) {
			if (relation.child === this && relation.parent) {
				parents.push(...relation.parent.parents)
			}
		}

		return parents
	}

	get children(): Field[] {
		const relations = this instanceof Domain ? this.graph.domainRelations : this.graph.subjectRelations
		const children: Field[] = [this]

		for (const relation of relations) {
			if (relation.parent === this && relation.child) {
				children.push(...relation.child.children)
			}
		}

		return children
	}

	get color(): string {
		return this.style ? styles[this.style].stroke : 'transparent'
	}

	abstract get style(): string | undefined
	abstract delete(): void
}

class Domain extends Field {
	private _style?: string

	constructor(graph: Graph, x: number, y: number, name?: string, style?: string) {
		super(graph, x, y, name)
		this._style = style
		this.graph.domains.push(this)
	}

	get style(): string | undefined {
		return this._style
	}

	set style(style: string | undefined) {
		this._style = style
	}

	static create(graph: Graph) {
		let domain = new Domain(
			graph,
			0, 0, // TODO Calculate position to not overlap
			undefined,
			graph.nextDomainStyle()
		)

		graph.domains.push(domain)
	}

	delete() {
		this.graph.domains = this.graph.domains.filter(domain => domain !== this)

		// Unset all subjects with this domain
		for (const subject of this.graph.subjects) {
			if (subject.domain === this) {
				subject.domain = undefined
			}
		}

		// Unset relations with this domain
		for (const relation of this.graph.domainRelations) {
			if (relation.parent === this) relation.parent = undefined
			if (relation.child === this) relation.child = undefined
		}
	}
}

class Subject extends Field {
	domain?: Domain

	constructor(graph: Graph,  x: number, y: number, name?: string, domain?: Domain) {
		super(graph, x, y, name)
		this.domain = domain
		this.graph.subjects.push(this)
	}

	get style(): string | undefined {
		return this.domain?.style
	}

	static create(graph: Graph) {
		let subject = new Subject(
			graph,
			0, 0 // TODO Calculate position to not overlap
		)
		
		graph.subjects.push(subject)
	}

	delete() {
		this.graph.subjects = this.graph.subjects.filter(subject => subject !== this)

		// Unset relations with this subject
		for (const relation of this.graph.subjectRelations) {
			if (relation.parent === this) relation.parent = undefined
			if (relation.child === this) relation.child = undefined
		}
	}
}

abstract class Relation<T extends Field> {
	graph: Graph
	parent?: T
	child?: T

	constructor(graph: Graph, parent?: T, child?: T) {
		this.graph = graph
		this.parent = parent
		this.child = child
	}

	get parentColor(): string {
		return this.parent ? this.parent.color : 'transparent'
	}

	get childColor(): string {
		return this.child ? this.child.color : 'transparent'
	}

	get parentOptions(): { name: string, value: T }[] {
		let fields = this instanceof DomainRelation ? this.graph.domains : this.graph.subjects
		let relations = this instanceof DomainRelation ? this.graph.domainRelations : this.graph.subjectRelations

		// Field must have a name
		let options = fields.filter(field => field.name)

		// Prevent circular references
		if (this.child) {
			const children = this.child.children
			options = options.filter(field => !children.includes(field))

			// Prevent duplicate relations
			if (!this.parent) {
				options = options.filter(field =>
					!relations.find(relation =>
						relation.parent === field && relation.child === this.child
					)
				)
			}
		}

		return options.map(field => ({ name: field.name!, value: field as T }))
	}

	get childOptions(): { name: string, value: T }[] {
		let fields = this instanceof DomainRelation ? this.graph.domains : this.graph.subjects
		let relations = this instanceof DomainRelation ? this.graph.domainRelations : this.graph.subjectRelations

		// Field must have a name
		let options = fields.filter(field => field.name)

		// Prevent circular references
		if (this.parent) {
			const parents = this.parent.parents
			options = options.filter(field => !parents.includes(field))

			// Prevent duplicate relations
			if (!this.child) {
				options = options.filter(field =>
					!relations.find(relation =>
						relation.parent === this.parent && relation.child === field
					)
				)
			}
		}

		return options.map(field => ({ name: field.name!, value: field as T }))
	
	}

	delete() {
		if (this instanceof DomainRelation) {
			this.graph.domainRelations = this.graph.domainRelations.filter(relation => relation !== this)
		} else if (this instanceof SubjectRelation) {
			this.graph.subjectRelations = this.graph.subjectRelations.filter(relation => relation !== this)
		}
	}

}

class DomainRelation extends Relation<Domain> {
	static create(graph: Graph) {
		let relation = new DomainRelation(graph)
		graph.domainRelations.push(relation)
	}
}

class SubjectRelation extends Relation<Subject> {
	static create(graph: Graph) {
		let relation = new SubjectRelation(graph)
		graph.subjectRelations.push(relation)
	}
}

class Lecture {
	graph: Graph
	name?: string
	subjects: (Subject | undefined)[] = []

	constructor(graph: Graph, name?: string, subjects: Subject[] = []) {
		this.graph = graph
		this.name = name
		this.subjects = subjects

		this.graph.lectures.push(this)
	}

	static create(graph: Graph) {
		new Lecture(graph)
	}

	delete() {
		this.graph.lectures = this.graph.lectures.filter(lecture => lecture !== this)
	}

	options(chosen?: Subject): { name: string, value: Subject }[] {
		return this.graph.subjects
			.filter(subject => subject.name)
			.filter(subject => subject === chosen || !this.subjects.includes(subject))
			.map(subject => ({ name: subject.name!, value: subject }))
	}

	parents(): Subject[] {
		const parents: Subject[] = []
		for (const subject of this.subjects) {
			for (const relation of this.graph.subjectRelations) {
				if (relation.child === subject &&
					relation.parent &&
					!parents.includes(relation.parent) &&
					!this.subjects.includes(relation.parent)
				) {
					parents.push(relation.parent)
				}
			}
		}

		return parents
	}

	children(): Subject[] {
		const children: Subject[] = []
		for (const subject of this.subjects) {
			for (const relation of this.graph.subjectRelations) {
				if (relation.parent === subject &&
					relation.child &&
					!children.includes(relation.child) &&
					!this.subjects.includes(relation.child)
				) {
					children.push(relation.child)
				}
			}
		}

		return children
	}

	relations(): SubjectRelation[] {
		return this.graph.subjectRelations.filter(relation =>
			this.subjects.includes(relation.parent) || this.subjects.includes(relation.child)
		)
	}
}