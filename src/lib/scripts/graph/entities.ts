
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
		throw new Error('Not implemented')
	}

	save() {
		throw new Error('Not implemented')
	}

	delete() {
		throw new Error('Not implemented')
	}

	nextDomainStyle(): string | undefined {
		const usedStyles = this.domains.map(domain => domain.style())
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

	parents(): Field[] {
		const relations: Relation<Field>[] = this instanceof Domain ? this.graph.domainRelations : this.graph.subjectRelations
		const parents: Field[] = [this]

		for (const relation of relations) {
			if (relation.child === this && relation.parent) {
				parents.push(...relation.parent.parents())
			}
		}

		return parents
	}

	children(): Field[] {
		const relations: Relation<Field>[] = this instanceof Domain ? this.graph.domainRelations : this.graph.subjectRelations
		const children: Field[] = [this]

		for (const relation of relations) {
			if (relation.parent === this && relation.child) {
				children.push(...relation.child.children())
			}
		}

		return children
	}

	color(): string {
		const style = this.style()
		return style ? styles[style].stroke : 'transparent'
	}

	abstract style(): string | undefined
	abstract delete(): void
}

class Domain extends Field {
	_style?: string

	constructor(graph: Graph, x: number, y: number, name?: string, style?: string) {
		super(graph, x, y, name)
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

	style(): string | undefined {
		return this._style
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
	}

	static create(graph: Graph) {
		let subject = new Subject(
			graph,
			0, 0 // TODO Calculate position to not overlap
		)
		
		graph.subjects.push(subject)
	}

	style(): string | undefined {
		return this.domain?.style()
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

class Relation<T extends Field> {
	graph: Graph
	parent?: T
	child?: T

	constructor(graph: Graph, parent?: T, child?: T) {
		this.graph = graph
		this.parent = parent
		this.child = child
	}

	parentColor(): string {
		return this.parent ? this.parent.color() : 'transparent'
	}

	childColor(): string {
		return this.child ? this.child.color() : 'transparent'
	}
}

class DomainRelation extends Relation<Domain> {
	static create(graph: Graph) {
		let relation = new DomainRelation(graph)
		graph.domainRelations.push(relation)
	}

	parentOptions(): { name: string, value: Domain }[] {

		// Domain must have a name
		let options = this.graph.domains.filter(domain => domain.name)

		// Prevent circular references
		if (this.child) {
			const children = this.child.children()
			options = options.filter(domain => !children.includes(domain))

			// Prevent duplicate relations
			if (!this.parent) {
				options = options.filter(domain =>
					!this.graph.domainRelations.find(relation =>
						relation.parent === domain && relation.child === this.child
					)
				)
			}
		}

		return options.map(domain => ({ name: domain.name!, value: domain }))
	}

	childOptions(): { name: string, value: Domain }[] {

		// Domain must have a name
		let options = this.graph.domains.filter(domain => domain.name)

		// Prevent circular references
		if (this.parent) {
			const parents = this.parent.parents()
			options = options.filter(domain => !parents.includes(domain))

			// Prevent duplicate relations
			if (!this.child) {
				options = options.filter(domain =>
					!this.graph.domainRelations.find(relation =>
						relation.parent === this.parent && relation.child === domain
					)
				)
			}
		}

		return options.map(domain => ({ name: domain.name!, value: domain }))
	}

	delete() {
		this.graph.domainRelations = this.graph.domainRelations.filter(relation => relation !== this)
	}
}

class SubjectRelation extends Relation<Subject> {
	static create(graph: Graph) {
		let relation = new SubjectRelation(graph)
		graph.subjectRelations.push(relation)
	}

	parentOptions(): { name: string, value: Subject }[] {

		// Domain must have a name
		let options = this.graph.subjects.filter(subject => subject.name)

		// Prevent circular references
		if (this.child) {
			const children = this.child.children()
			options = options.filter(subject => !children.includes(subject))

			// Prevent duplicate relations
			if (!this.parent) {
				options = options.filter(subject =>
					!this.graph.subjectRelations.find(relation =>
						relation.parent === subject && relation.child === this.child
					)
				)
			}
		}

		return options.map(subject => ({ name: subject.name!, value: subject }))
	}

	childOptions(): { name: string, value: Subject }[] {

		// Domain must have a name
		let options = this.graph.subjects.filter(subject => subject.name)

		// Prevent circular references
		if (this.parent) {
			const parents = this.parent.parents()
			options = options.filter(subject => !parents.includes(subject))

			// Prevent duplicate relations
			if (!this.child) {
				options = options.filter(subject =>
					!this.graph.subjectRelations.find(relation =>
						relation.parent === this.parent && relation.child === subject
					)
				)
			}
		}

		return options.map(subject => ({ name: subject.name!, value: subject }))
	}

	delete() {
		this.graph.subjectRelations = this.graph.subjectRelations.filter(relation => relation !== this)
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

	options(whitelist?: Subject): { name: string, value: Subject }[] {
		return this.graph.subjects
			.filter(subject => subject.name)
			.filter(subject => subject === whitelist || !this.subjects.includes(subject))
			.map(subject => ({ name: subject.name!, value: subject }))
	}

	parents(): Subject[] {
		const parents: Subject[] = []
		for (const subject of this.subjects) {
			for (const relation of this.graph.subjectRelations) {
				if (relation.child === subject && relation.parent && !parents.includes(relation.parent)) {
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
				if (relation.parent === subject && relation.child && !children.includes(relation.child)) {
					children.push(relation.child)
				}
			}
		}

		return children
	}
}