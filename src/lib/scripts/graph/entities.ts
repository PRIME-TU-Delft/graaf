
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
			new Domain(this, 1, 0, 0, [], [], 'Domain 1', 'prosperous-red'),
			new Domain(this, 2, 0, 0, [], [], 'Domain 2', 'energizing-orange'),
			new Domain(this, 3, 0, 0, [], [], 'Domain 3', 'sunny-yellow')
		)

		this.subjects.push(
			new Subject(this, 4, 0, 0, [], [], 'Subject 1', this.domains[0]),
			new Subject(this, 5, 0, 0, [], [], 'Subject 2', this.domains[0]),
			new Subject(this, 6, 0, 0, [], [], 'Subject 3', this.domains[1]),
			new Subject(this, 7, 0, 0, [], [], 'Subject 4', this.domains[1]),
			new Subject(this, 8, 0, 0, [], [], 'Subject 5', this.domains[2]),
			new Subject(this, 9, 0, 0, [], [], 'Subject 6', this.domains[2])
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
			new Lecture(this, 'Lecture 1', [this.subjects[3], this.subjects[4]])
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
	parents: Field[]
	children: Field[]
	name?: string

	constructor(graph: Graph, id: number, x: number, y: number, parents: Field[], children: Field[], name?: string,) {
		this.graph = graph
		this.id = id
		this.x = x
		this.y = y
		this.parents = parents
		this.children = children
		this.name = name
	}

	get ancestors(): Field[] {
		let ancestors = this.parents
		for (const parent of this.parents) {
			ancestors = ancestors.concat(
				parent.ancestors.filter(ancestor => !ancestors.includes(ancestor))
			)
		}

		return ancestors
	}

	get descendants(): Field[] {
		let descendants = this.children
		for (const child of this.children) {
			descendants = descendants.concat(
				child.descendants.filter(descendant => !descendants.includes(descendant))
			)
		}

		return descendants
	}

	get color(): string {
		return this.style ? styles[this.style].stroke : 'transparent'
	}

	abstract get style(): string | undefined
	abstract delete(): void
}

class Domain extends Field {
	private _style?: string

	constructor(graph: Graph, id: number, x: number, y: number, parents: Domain[], children: Domain[], name?: string, style?: string) {
		super(graph, id, x, y, parents, children, name)
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
			0, 0, // TODO Calculate position to not overlap,
			[], [],
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
		for (const domain of this.graph.domains) {
			domain.parents = domain.parents.filter(parent => parent !== this)
			domain.children = domain.children.filter(child => child !== this)
		}
	}
}

class Subject extends Field {
	domain?: Domain

	constructor(graph: Graph, id: number, x: number, y: number, parents: Subject[], children: Subject[], name?: string, domain?: Domain) {
		super(graph, id, x, y, parents, children, name)
		this.domain = domain
	}

	get style(): string | undefined {
		return this.domain?.style
	}

	static create(graph: Graph) {
		let subject = new Subject(
			graph,
			graph.nextFieldID(),
			0, 0, // TODO Calculate position to not overlap
			[], []
		)

		graph.subjects.push(subject)
	}

	delete() {
		this.graph.subjects = this.graph.subjects.filter(subject => subject !== this)

		// Unset relations with this subject
		for (const subject of this.graph.subjects) {
			subject.parents = subject.parents.filter(parent => parent !== this)
			subject.children = subject.children.filter(child => child !== this)
		}
	}
}

abstract class Relation<T extends Field> {
	graph: Graph
	id: number
	private _parent?: T
	private _child?: T

	constructor(graph: Graph, id: number, parent?: T, child?: T) {
		this.graph = graph
		this.id = id
		this.parent = parent
		this.child = child
	}

	get parent(): T | undefined {
		return this._parent
	}

	set parent(parent: T | undefined) {
		if (this.parent === parent) return

		if (this.child) {
			if (this.parent) {
				this.parent.children = this.parent.children.filter(field => field !== this.child)
				this.child.parents = this.child.parents.filter(field => field !== this.parent)
			}
			
			if (parent) {
				parent.children.push(this.child)
				this.child.parents.push(parent)
			}
		}

		this._parent = parent
	}

	get parentColor(): string {
		return this.parent?.color ?? 'transparent'
	}

	get parentOptions(): { name: string, value: T }[] {
		let options = this instanceof DomainRelation ? this.graph.domains : this.graph.subjects

		// Field must have a name
		options = options.filter(option => option.name)

		// Prevent circular references
		const descendants = this.child?.descendants
		options = options.filter(option => 
			option !== this.child && !descendants?.includes(option)
		)

		// Prevent duplicate relations
		options = options.filter(option => {
			if (this.parent === option) return true
			return !this.child?.parents.includes(option)
		})

		// Ensure child options remain available
		options = options.filter(parent => {
			let options = this instanceof DomainRelation ? this.graph.domains : this.graph.subjects

			// Field must have a name
			options = options.filter(option => option.name)

			// Prevent circular references
			const ancestors = parent.ancestors
			options = options.filter(option => 
				option !== parent && !ancestors?.includes(option)
			)

			// Prevent duplicate relations
			options = options.filter(option => {
				if (this.child === option) return true
				return !parent.children.includes(option)
			})

			return options.length > 0
		})

		return options.map(option => {
			return { name: option.name, value: option } as { name: string, value: T }
		})
	}

	get child(): T | undefined {
		return this._child
	}

	set child(child: T | undefined) {
		if (this.child === child) return

		if (this.parent) {
			if (this.child) {
				this.parent.children = this.parent.children.filter(field => field !== this.child)
				this.child.parents = this.child.parents.filter(field => field !== this.parent)
			}

			if (child) {
				this.parent.children.push(child)
				child.parents.push(this.parent)
			}
		}

		this._child = child
	}

	get childColor(): string {
		return this.child?.color ?? 'transparent'
	}

	get childOptions(): { name: string, value: T }[] {
		let options = this instanceof DomainRelation ? this.graph.domains : this.graph.subjects

		// Field must have a name
		options = options.filter(option => option.name)

		// Prevent circular references
		const ancestors = this.parent?.ancestors
		options = options.filter(option => 
			option !== this.parent && !ancestors?.includes(option)
		)

		// Prevent duplicate relations
		options = options.filter(option => {
			if (this.child === option) return true
			return !this.parent?.children.includes(option)
		})

		// Ensure parent options remain available
		options = options.filter(child => {
			let options = this instanceof DomainRelation ? this.graph.domains : this.graph.subjects

			// Field must have a name
			options = options.filter(option => option.name)

			// Prevent circular references
			const descendants = child.descendants
			options = options.filter(option => 
				option !== child && !descendants?.includes(option)
			)

			// Prevent duplicate relations
			options = options.filter(option => {
				if (this.parent === option) return true
				return !child.parents.includes(option)
			})

			return options.length > 0
		})

		return options.map(option => {
			return { name: option.name, value: option } as { name: string, value: T }
		})
	}

	delete() {
		if (this instanceof DomainRelation) {
			this.graph.domainRelations = this.graph.domainRelations.filter(relation => relation !== this)
		} else if (this instanceof SubjectRelation) {
			this.graph.subjectRelations = this.graph.subjectRelations.filter(relation => relation !== this)
		}

		if (this.parent && this.child) {
			this.parent.children = this.parent.children.filter(field => field !== this.child)
			this.child.parents = this.child.parents.filter(field => field !== this.parent)
		}
	}
}

class DomainRelation extends Relation<Domain> {
	static create(graph: Graph) {
		let relation = new DomainRelation(graph, graph.nextRelationID())
		graph.domainRelations.push(relation)
	}
}

class SubjectRelation extends Relation<Subject> {
	static create(graph: Graph) {
		let relation = new SubjectRelation(graph, graph.nextRelationID())
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
			if (!(this.presentSubjects.includes(relation.parent) || pastSubjects.includes(relation.parent!))) {
				pastSubjects.push(relation.parent!)
			}
		}

		return pastSubjects
	}

	get futureSubjects(): Subject[] {
		const futureSubjects: Subject[] = []
		for (const relation of this.relations) {
			if (!(this.presentSubjects.includes(relation.child) || futureSubjects.includes(relation.child!))) {
				futureSubjects.push(relation.child!)
			}
		}

		return futureSubjects
	}

	get subjects(): Subject[] {
		return this.presentSubjects
			.filter(subject => subject)
			.concat(
				this.pastSubjects,
				this.futureSubjects
			) as Subject[]
	}

	get relations(): SubjectRelation[] {
		return this.graph.subjectRelations.filter(relation =>
			relation.parent && relation.child && (
				this.presentSubjects.includes(relation.parent) ||
				this.presentSubjects.includes(relation.child)
			)
		)
	}

	get size(): number {
		return Math.max(
			this.pastSubjects.length,
			this.presentSubjects.length,
			this.futureSubjects.length
		)
	}
}