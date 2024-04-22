
import { styles } from '$scripts/graph/settings'

export class Course {
	code: string
	name: string
	graphs: Graph[]

	constructor(code: string, name: string) {
		this.code = code
		this.name = name
		this.graphs = []
	}
}

export class Graph {
	id: number
	name: string
	course: Course
	domains: Domain[] = []
	subjects: Subject[] = []
	domainRelations: Relation[] = []
	subjectRelations: Relation[] = []
	links: any[] = []

	constructor(id: number, name: string, course: Course) {
		this.id = id
		this.name = name
		this.course = course
		this.course.graphs.push(this)
	}

	isVisible() {
		return this.domains.length > 0 || this.subjects.length > 0
	}

	hasLinks() {
		return this.links.length > 0
	}

	addDomain() {
		this.domains.push(new Domain(this))
	}

	addSubject() {
		this.subjects.push(new Subject(this))
	}

	addDomainRelation() {
		this.domainRelations.push(new Relation(this))
		console.log(this.domainRelations)
	}

	addSubjectRelation() {
		this.subjectRelations.push(new Relation(this))
	}
}

interface Previewable {
	preview(): string
}

export class Domain implements Previewable {
	id: number
	name: string | undefined = undefined
	color: string | undefined = undefined
	graph: Graph

	constructor(graph: Graph) {
		this.graph = graph
		this.id = this.graph.domains.length > 0 ? Math.max(...this.graph.domains.map(domain => domain.id)) + 1 : 0
		for (let color of Object.keys(styles)) {
			if (this.graph.domains.every(domain => domain.color !== color)) {
				this.color = color
				break
			}
		}
	}

	delete() {
		this.graph.domains = this.graph.domains.filter(domain => domain !== this)
		for (let subject of this.graph.subjects) {
			if (subject.domain === this) {
				subject.domain = undefined
			}
		}
	}

	preview() {
		return this.color === undefined ? "transparent" : styles[this.color].stroke
	}
}

export class Subject implements Previewable {
	id: number
	name: string | undefined = undefined
	domain: Domain | undefined = undefined
	graph: Graph

	constructor(graph: Graph) {
		this.graph = graph
		this.id = this.graph.subjects.length > 0 ? Math.max(...this.graph.subjects.map(subject => subject.id)) + 1 : 0
	}

	delete() {
		this.graph.subjects = this.graph.subjects.filter(subject => subject !== this)
	}

	preview() {
		if (this.domain === undefined)
			return "transparent"
		return this.domain.preview()
	}
}

export class Relation {
	from: Previewable | undefined = undefined
	to: Previewable | undefined = undefined
	graph: Graph

	constructor(graph: Graph) {
		this.graph = graph
	}

	delete() {
		this.graph.domainRelations = this.graph.domainRelations.filter(relation => relation !== this)
		this.graph.subjectRelations = this.graph.subjectRelations.filter(relation => relation !== this)
	}

	fromPreview() {
		if (this.from === undefined)
			return "transparent"
		return this.from.preview()
	}

	toPreview() {
		if (this.to === undefined)
			return "transparent"
		return this.to.preview()
	}
}