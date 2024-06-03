
// Internal imports
import { Graph, Relation } from '../entities'
import { styles } from '../settings'

// Exports
export { Field, Domain, Subject }

abstract class Field {
	graph: Graph
	id: number
	x: number
	y: number
	parents: Field[]
	children: Field[]
	name?: string
	highlight: boolean = false

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
	abstract validate(): boolean
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

	validate(): boolean {
		return this.name !== undefined && this.style !== undefined
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

	validate(): boolean {
		return this.name !== undefined && this.domain !== undefined
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