
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
		this.name = 'Calculus'
	}
}

class Graph {
	id: number
	name: string
	domains: Domain[]
	subjects: Subject[]
	domainRelations: DomainRelation[]
	subjectRelations: SubjectRelation[]
	lectures: Lecture[]

	constructor(data: object) {
		this.id = 1
		this.name = 'Graph 1'
		this.domains = []
		this.subjects = []
		this.domainRelations = []
		this.subjectRelations = []
		this.lectures = []

		// TODO load from data

		this.domains.push(
			new Domain(this, 1, 0, 0, 'Domain 1', 'prosperous-red'),
			new Domain(this, 2, 0, 0, 'Domain 2', 'energizing-orange'),
			new Domain(this, 3, 0, 0, 'Domain 3', 'sunny-yellow')
		)

		this.subjects.push(
			new Subject(this, 4, 0, 0, 'Subject 1', this.domains[0]),
			new Subject(this, 5, 0, 0, 'Subject 2', this.domains[0]),
			new Subject(this, 6, 0, 0, 'Subject 3', this.domains[1]),
			new Subject(this, 7, 0, 0, 'Subject 4', this.domains[1]),
			new Subject(this, 8, 0, 0, 'Subject 5', this.domains[2]),
			new Subject(this, 9, 0, 0, 'Subject 6', this.domains[2])
		)

		this.domainRelations.push(
			new DomainRelation(this, 1, this.domains[0], this.domains[1]),
			new DomainRelation(this, 2, this.domains[1], this.domains[2]),
			new DomainRelation(this, 3, this.domains[0], this.domains[2])
		)

		this.subjectRelations.push(
			new SubjectRelation(this, 4, this.subjects[0], this.subjects[1]),
			new SubjectRelation(this, 5, this.subjects[2], this.subjects[3]),
			new SubjectRelation(this, 6, this.subjects[4], this.subjects[5]),
			new SubjectRelation(this, 7, this.subjects[0], this.subjects[2]),
			new SubjectRelation(this, 8, this.subjects[1], this.subjects[3]),
			new SubjectRelation(this, 9, this.subjects[2], this.subjects[4])
		)

		this.lectures.push(
			new Lecture(this, 'Lecture 1', [this.subjects[2], this.subjects[3], this.subjects[4]])
		)
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

	nextFieldID(): number {
		const ids = this.domains.concat(this.subjects).map(field => field.id)
		return Math.max(0, ...ids) + 1
	}

	nextRelationID(): number {
		const ids = this.domainRelations.concat(this.subjectRelations).map(relation => relation.id)
		return Math.max(0, ...ids) + 1
	}

	nextDomainStyle(): string | undefined {
		const usedStyles = this.domains.map(domain => domain.style)
		return Object.keys(styles).find(style => !usedStyles.includes(style))
	}
}

abstract class Field {
	graph: Graph
	id: number
	x: number
	y: number
	name?: string

	constructor(graph: Graph, id: number, x: number, y: number, name?: string) {
		this.graph = graph
		this.id = id
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

	constructor(graph: Graph, id: number, x: number, y: number, name?: string, style?: string) {
		super(graph, id, x, y, name)
		this._style = style
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
			graph.nextFieldID(),
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

	constructor(graph: Graph, id: number, x: number, y: number, name?: string, domain?: Domain) {
		super(graph, id, x, y, name)
		this.domain = domain
	}

	get style(): string | undefined {
		return this.domain?.style
	}

	static create(graph: Graph) {
		let subject = new Subject(
			graph,
			graph.nextFieldID(),
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
	id: number
	parent?: T
	child?: T

	constructor(graph: Graph, id: number, parent?: T, child?: T) {
		this.graph = graph
		this.id = id
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
		let relation = new DomainRelation(
			graph,
			graph.nextRelationID()
		)

		graph.domainRelations.push(relation)
	}
}

class SubjectRelation extends Relation<Subject> {
	static create(graph: Graph) {
		let relation = new SubjectRelation(
			graph,
			graph.nextRelationID()
		)

		graph.subjectRelations.push(relation)
	}
}

class Lecture {
	graph: Graph
	name?: string
	presentSubjects: (Subject | undefined)[] = []

	constructor(graph: Graph, name?: string, presentSubjects: Subject[] = []) {
		this.graph = graph
		this.name = name
		this.presentSubjects = presentSubjects
	}

	static create(graph: Graph): void {
		const lecture = new Lecture(graph)
		graph.lectures.push(lecture)
	}

	delete() {
		this.graph.lectures = this.graph.lectures.filter(lecture => lecture !== this)
	}

	get pastSubjects(): Subject[] {
		const pastSubjects: Subject[] = []
		for (const relation of this.relations) {
			if (!this.presentSubjects.includes(relation.child)) {
				pastSubjects.push(relation.child!)
			}
		}

		return pastSubjects
	}

	get futureSubjects(): Subject[] {
		const futureSubjects: Subject[] = []
		for (const relation of this.relations) {
			if (!this.presentSubjects.includes(relation.parent)) {
				futureSubjects.push(relation.parent!)
			}
		}

		return futureSubjects
	}

	get subjects(): Subject[] {
		return this.pastSubjects.concat(
			this.presentSubjects.filter(subject => subject) as Subject[], 
			this.futureSubjects
		)
	}

	get relations(): SubjectRelation[] {
		return this.graph.subjectRelations.filter(relation =>
			relation.parent && relation.child && (
				this.presentSubjects.includes(relation.parent) || 
				this.presentSubjects.includes(relation.child)
			)
		)
	}
}