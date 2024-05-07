
import { styles } from "./layout/settings"

export { Course, Graph, Field, Domain, Subject, Relation, DomainRelation, SubjectRelation }

class Course {
	code: string
	name: string

	constructor(code: string) {
		// TODO load from database

		this.code = code
		this.name = "Course Name"
	}
}

class Graph {
	id: number
	name: string
	domains: Domain[]
	subjects: Subject[]
	domainRelations: DomainRelation[]
	subjectRelations: SubjectRelation[]

	constructor(id: number) {
		// TODO load from database

		this.id = id
		this.name = "Graph Name"
		this.domains = []
		this.subjects = []
		this.domainRelations = []
		this.subjectRelations = []

		new Domain(this, 1, 0, 0, "Domain 1", "prosperous-red")
		new Domain(this, 2, 0, 0, "Domain 2", "energizing-orange")
		new Domain(this, 3, 0, 0, "Domain 3", "sunny-yellow")
		new Subject(this, 1, 0, 0, "Subject 1", this.domains[0])
		new Subject(this, 2, 0, 0, "Subject 2", this.domains[0])
		new Subject(this, 3, 0, 0, "Subject 3", this.domains[1])
		new Subject(this, 4, 0, 0, "Subject 4", this.domains[1])
		new Subject(this, 5, 0, 0, "Subject 5", this.domains[2])
		new Subject(this, 6, 0, 0, "Subject 6", this.domains[2])
		new DomainRelation(this, 1, this.domains[0], this.domains[1])
		new DomainRelation(this, 2, this.domains[1], this.domains[2])
		new DomainRelation(this, 3, this.domains[0], this.domains[2])
		new SubjectRelation(this, 1, this.subjects[0], this.subjects[1])
		new SubjectRelation(this, 2, this.subjects[2], this.subjects[3])
		new SubjectRelation(this, 3, this.subjects[4], this.subjects[5])
		new SubjectRelation(this, 4, this.subjects[0], this.subjects[2])
		new SubjectRelation(this, 5, this.subjects[1], this.subjects[3])
		new SubjectRelation(this, 6, this.subjects[2], this.subjects[4])
	}

	save() {
		// TODO implement
	}

	delete() {
		// TODO implement
	}

	nextDomainID(): number {
		return this.domains.length > 0 ? Math.max(...this.domains.map(domain => domain.id)) + 1 : 1
	}

	nextDomainStyle(): string | undefined {
		const usedStyles = this.domains.map(domain => domain.style())
		return Object.keys(styles).find(style => !usedStyles.includes(style))
	}

	nextSubjectID(): number {
		return this.subjects.length > 0 ? Math.max(...this.subjects.map(subject => subject.id)) + 1 : 1
	}

	nextRelationID(): number {
		let relations = this.domainRelations.concat(this.subjectRelations)
		return relations.length > 0 ? Math.max(...relations.map(relation => relation.id)) + 1 : 1
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

	parents(): Field[] {
		let relations = this instanceof Domain ? this.graph.domainRelations : this.graph.subjectRelations
		let parents = [this]

		for (let relation of relations) {
			if (relation.child === this && relation.parent) {
				parents.push(...relation.parent.parents())
			}
		}

		return parents
	}

	children(): Field[] {
		let relations = this instanceof Domain ? this.graph.domainRelations : this.graph.subjectRelations
		let children = [this]

		for (let relation of relations) {
			if (relation.parent === this && relation.child) {
				children.push(...relation.child.children())
			}
		}

		return children
	}

	color(): string {
		let style = this.style()
		return style ? styles[style].stroke : "transparent"
	}

	abstract style(): string | undefined
	abstract delete(): void
}

class Domain extends Field {
	_style?: string

	constructor(graph: Graph, id: number, x: number, y: number, name?: string, style?: string) {
		super(graph, id, x, y, name)
		this._style = style

		this.graph.domains.push(this)
	}

	static create(graph: Graph): void {
		new Domain(
			graph,
			graph.nextDomainID(),
			0, 0, // TODO Calculate position to not overlap
			undefined,
			graph.nextDomainStyle()
		)
	}

	style(): string | undefined {
		return this._style
	}

	delete() {
		this.graph.domains = this.graph.domains.filter(domain => domain !== this)

		// Unset all subjects with this domain
		for (let subject of this.graph.subjects) {
			if (subject.domain === this) {
				subject.domain = undefined
			}
		}

		// Unset relations with this domain
		for (let relation of this.graph.domainRelations) {
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

		this.graph.subjects.push(this)
	}

	static create (graph: Graph): void {
		new Subject(
			graph,
			graph.nextSubjectID(),
			0, 0 // TODO Calculate position to not overlap
		)
	}

	style(): string | undefined {
		return this.domain?.style()
	}

	delete() {
		this.graph.subjects = this.graph.subjects.filter(subject => subject !== this)

		// Unset relations with this subject
		for (let relation of this.graph.subjectRelations) {
			if (relation.parent === this) relation.parent = undefined
			if (relation.child === this) relation.child = undefined
		}
	}
}

class Relation<T extends Field> {
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
}

class DomainRelation extends Relation<Domain> {
	constructor(graph: Graph, id: number, parent?: Domain, child?: Domain) {
		super(graph, id, parent, child)
		graph.domainRelations.push(this)
	}

	static create(graph: Graph): void {
		new DomainRelation(graph, graph.nextRelationID())
	}

	parentColor(): string {
		return this.parent ? this.parent.color() : "transparent"
	}

	parentOptions(): { name: string, value: Domain }[] {

		// Domain must have a name
		let options = this.graph.domains.filter(domain => domain.name)

		// Prevent circular references
		if (this.child) {
			let children = this.child.children()
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

	childColor(): string {
		return this.child ? this.child.color() : "transparent"
	}

	childOptions(): { name: string, value: Domain }[] {

		// Domain must have a name
		let options = this.graph.domains.filter(domain => domain.name)

		// Prevent circular references
		if (this.parent) {
			let parents = this.parent.parents()
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
	constructor(graph: Graph, id: number, parent?: Subject, child?: Subject) {
		super(graph, id, parent, child)
		graph.subjectRelations.push(this)
	}

	static create(graph: Graph): void {
		new SubjectRelation(graph, graph.nextDomainID())
	}

	parentColor(): string {
		return this.parent ? this.parent.color() : "transparent"
	}

	parentOptions(): { name: string, value: Subject }[] {

		// Domain must have a name
		let options = this.graph.subjects.filter(subject => subject.name)

		// Prevent circular references
		if (this.child) {
			let children = this.child.children()
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

	childColor(): string {
		return this.child ? this.child.color() : "transparent"
	}

	childOptions(): { name: string, value: Subject }[] {

		// Domain must have a name
		let options = this.graph.subjects.filter(subject => subject.name)

		// Prevent circular references
		if (this.parent) {
			let parents = this.parent.parents()
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
