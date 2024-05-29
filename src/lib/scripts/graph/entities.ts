
// Internal Imports
import { styles } from './settings'

// Exports
export { Course, Graph, Field, Domain, Subject, Relation, Lecture }

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
	lectures: Lecture[]

	constructor(data: object) {
		this.id = 1
		this.name = 'Graph 1'
		this.domains = []
		this.subjects = []
		this.lectures = []

		// TODO load from data

		/* this.domains.push(
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

		Relation.create(this, this.domains[0], this.domains[1])
		Relation.create(this, this.domains[1], this.domains[2])
		Relation.create(this, this.domains[0], this.domains[2])
		Relation.create(this, this.subjects[0], this.subjects[1])
		Relation.create(this, this.subjects[2], this.subjects[3])
		Relation.create(this, this.subjects[4], this.subjects[5])
		Relation.create(this, this.subjects[0], this.subjects[2])
		Relation.create(this, this.subjects[1], this.subjects[3])
		Relation.create(this, this.subjects[2], this.subjects[4])

		this.lectures.push(
			new Lecture()
		) */
	}

	get domainRelations(): Relation[] {
		let relations: Relation[] = []
		for (const domain of this.domains) {
			for (const child of domain.children) {
				relations.push(new Relation(this, domain, child))
			}
		}

		return relations
	}

	get subjectRelations(): Relation[] {
		let relations: Relation[] = []
		for (const subject of this.subjects) {
			for (const child of subject.children) {
				relations.push(new Relation(this, subject, child))
			}
		}

		return relations
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

	get backwardRelations(): Relation[] {
		return this.parents.map(parent => new Relation(this.graph, parent, this))
	}

	get forwardRelations(): Relation[] {
		return this.children.map(child => new Relation(this.graph, this, child))
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

	get style(): string | undefined {
		return this._style
	}

	set style(style: string | undefined) {
		this._style = style
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

	static create(graph: Graph) {
		let subject = new Subject(
			graph,
			graph.nextFieldID(),
			0, 0, // TODO Calculate position to not overlap
			[], []
		)

		graph.subjects.push(subject)
	}

	get style(): string | undefined {
		return this.domain?.style
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

class Relation {
	graph: Graph
	private _parent?: Field
	private _child?: Field

	constructor(graph: Graph, parent?: Field, child?: Field) {
		this.graph = graph
		this._parent = parent
		this._child = child
	}

	static create(graph: Graph, parent?: Field, child?: Field): Relation {
		let relation = new Relation(graph)
		relation.parent = parent
		relation.child = child
		return relation
	}

	get id(): string {
		return `${this.parent?.id ?? 'undefined'}.${this.child?.id ?? 'undefined'}`
	}

	get parent(): Field | undefined {
		return this._parent
	}

	set parent(parent: Field | undefined) {
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

	filterParentOptions(fields: Field[]): { name: string, value: Field, available: boolean, reason?: string }[] {
		let options = fields.map(field => {
			return { name: field.name, value: field, available: true } as { name: string, value: Field, available: boolean, reason?: string }
		})

		// Field must have a name
		options = options.filter(option => option.value.name)

		// Prevent duplicate relations
		options.forEach(option => {
			if (this.parent !== option.value && this.child?.parents.includes(option.value)) {
				option.available = false
				option.reason = 'Duplicate relation'
			}
		})

		// Prevent circular references
		const descendants = this.child?.descendants
		options.forEach(option => {
			if (!option.available) return
			if (option.value === this.child || descendants?.includes(option.value)) {
				option.available = false
				option.reason = 'Circular reference'
			}
		})

		// Ensure child options remain available
		options.forEach(option => {
			if (!option.available) return
			let childOptions = Array.from(fields)

			// Field must have a name
			childOptions = childOptions.filter(option => option.name)

			// Prevent duplicate relations
			const parent = option.value
			childOptions = childOptions.filter(option => {
				if (this.child === option) return true
				return !parent.children.includes(option)
			})

			// Prevent circular references
			const ancestors = parent.ancestors
			childOptions = childOptions.filter(option =>
				option !== parent && !ancestors?.includes(option)
			)

			// Prevent duplicate relations
			childOptions = childOptions.filter(option => {
				if (this.child === option) return true
				return !parent.children.includes(option)
			})

			if (childOptions.length === 0) {
				option.available = false
				option.reason = 'No valid child'
			}
		})

		// Sort options by availability
		return options.sort((a, b) => {
			if (a.available && !b.available) return -1
			if (!a.available && b.available) return 1
			return 0
		})
	}

	get child(): Field | undefined {
		return this._child
	}

	set child(child: Field | undefined) {
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

	filterChildOptions(fields: Field[]): { name: string, value: Field, available: boolean, reason?: string }[] {
		let options = fields.map(field => {
			return { name: field.name, value: field, available: true } as { name: string, value: Field, available: boolean, reason?: string }
		})

		// Field must have a name
		options = options.filter(option => option.value.name)

		// Prevent duplicate relations
		options.forEach(option => {
			if (this.child !== option.value && this.parent?.children.includes(option.value)) {
				option.available = false
				option.reason = 'Duplicate relation'
			}
		})

		// Prevent circular references
		const ancestors = this.parent?.ancestors
		options.forEach(option => {
			if (!option.available) return
			if (option.value === this.parent || ancestors?.includes(option.value)) {
				option.available = false
				option.reason = 'Circular reference'
			}
		})

		// Ensure parent options remain available
		options.forEach(option => {
			if (!option.available) return
			let parentOptions = Array.from(fields)

			// Field must have a name
			parentOptions = parentOptions.filter(option => option.name)

			// Prevent duplicate relations
			const child = option.value
			const descendants = child.descendants
			parentOptions = parentOptions.filter(option => {
				if (this.parent === option) return true
				return !child.parents.includes(option)
			})

			// Prevent circular references
			parentOptions = parentOptions.filter(option =>
				option !== child && !descendants?.includes(option)
			)

			if (parentOptions.length === 0) {
				option.available = false
				option.reason = 'No valid parent'
			}
		})

		// Sort options by availability
		return options.sort((a, b) => {
			if (a.available && !b.available) return -1
			if (!a.available && b.available) return 1
			return 0
		})
	}

	delete() {
		if (this.parent && this.child) {
			this.parent.children = this.parent.children.filter(field => field !== this.child)
			this.child.parents = this.child.parents.filter(field => field !== this.parent)
		}
	}
}

class Lecture {
	graph: Graph
	name?: string
	private _presentSubjects: (Subject | undefined)[]

	constructor(graph: Graph, name?: string, presentSubjects: Subject[] = []) {
		this.graph = graph
		this.name = name
		this._presentSubjects = presentSubjects
	}

	static create(graph: Graph): void {
		const lecture = new Lecture(graph)
		graph.lectures.push(lecture)
	}

	delete() {
		this.graph.lectures = this.graph.lectures.filter(lecture => lecture !== this)
	}

	get pastSubjects(): Subject[] {
		return this.presentSubjects
			.filter(subject => subject)
			.flatMap(subject => subject!.parents)
			.filter((subject, index, self) => self.indexOf(subject) === index)
	}

	get presentSubjects(): (Subject | undefined)[] {
		return this._presentSubjects
	}

	get futureSubjects(): Subject[] {
		return this.presentSubjects
			.filter(subject => subject)
			.flatMap(subject => subject!.children)
			.filter((subject, index, self) => self.indexOf(subject) === index)
	}

	get subjects(): Subject[] {
		return this.presentSubjects
			.filter(subject => subject)
			.concat(
				this.pastSubjects,
				this.futureSubjects
			) as Subject[]
	}

	get relations(): Relation[] {
		return this.presentSubjects
			.filter(subject => subject)
			.flatMap(subject => [
				...subject!.backwardRelations,
				...subject!.forwardRelations
			])
	}

	get size(): number {
		return Math.max(
			this.pastSubjects.length,
			this.presentSubjects.length,
			this.futureSubjects.length
		)
	}

	addSubject() {
		this._presentSubjects.push(undefined)
	}

	removeSubject(index: number) {
		this._presentSubjects.splice(index, 1)
	}

	subjectOptions(index: number): { name: string, value: Subject, available: boolean, reason?: string }[] {
		const options = this.graph.subjects
			.filter(subject => subject.name)
			.map(subject => (
				{ name: subject.name, value: subject, available: true }
			)) as { name: string, value: Subject, available: boolean, reason?: string }[]
		
		options.forEach(subject => {
			if (subject.value === this.presentSubjects[index]) return
			if (this.presentSubjects.includes(subject.value)) {
				subject.available = false
				subject.reason = 'Duplicate subject'
			}
		});

		return options
	}

	subjectColor(index: number) {
		return this.presentSubjects[index]?.color ?? 'transparent'
	}
}