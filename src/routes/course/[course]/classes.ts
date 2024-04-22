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
	domainRelations: DomainRelation[] = []
	subjectRelations: SubjectRelation[] = []
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
		this.domainRelations.push(new DomainRelation(this))
		console.log(this.domainRelations)
	}

	addSubjectRelation() {
		this.subjectRelations.push(new SubjectRelation(this))
	}
}

export class Domain {
	id: number
	name: string = ""
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

	getParents(): Domain[] {
		const parents: Domain[] = []

		for (const relation of this.graph.domainRelations) {
			if (relation.to === this && relation.from !== undefined) {
				parents.push(relation.from)
				parents.push(...relation.from.getParents())
			}
		}

		return parents
	}

	getChildren(): Domain[] {
		const children: Domain[] = []

		for (const relation of this.graph.domainRelations) {
			if (relation.from === this && relation.to !== undefined) {
				children.push(relation.to)
				children.push(...relation.to.getChildren())
			}
		}

		return children
	}
}

export class Subject {
	id: number
	name: string = ""
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

	getParents(): Subject[] {
		const parents: Subject[] = [];

		for (const relation of this.graph.subjectRelations) {
			if (relation.to === this && relation.from !== undefined) {
				parents.push(relation.from);
				parents.push(...relation.from.getParents());
			}
		}

		return parents;
	}

	getChildren(): Subject[] {
		const children: Subject[] = []
		
		for (const relation of this.graph.subjectRelations) {
			if (relation.from === this && relation.to !== undefined) {
				children.push(relation.to);
				children.push(...relation.to.getChildren());
			}
		}

		return children
	}
}

export class DomainRelation {
	from: Domain | undefined = undefined
	to: Domain | undefined = undefined
	graph: Graph

	constructor(graph: Graph) {
		this.graph = graph
	}

	delete() {
		this.graph.domainRelations = this.graph.domainRelations.filter(relation => relation !== this)
	}

	getFromOptions(): {name: string, value: Domain}[] {
		if (this.to === undefined) {
			return this.graph.domains
				.filter(domain => domain.name !== "")
				.map(domain => ({name: domain.name, value: domain}))
		} else {
			let children = this.to.getChildren()
			return this.graph.domains
				.filter(domain => !children.includes(domain) && domain !== this.to && domain.name !== "")
				.map(domain => ({name: domain.name, value: domain}))
		}
		
	}

	getToOptions(): {name: string, value: Domain}[] {
		if (this.from === undefined) {
			return this.graph.domains
				.filter(domain => domain.name !== "")
				.map(domain => ({name: domain.name, value: domain}))
		} else {
			let parents = this.from.getParents()
			return this.graph.domains
				.filter(domain => !parents.includes(domain) && domain !== this.from && domain.name !== "")
				.map(domain => ({name: domain.name, value: domain}))
		}
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

export class SubjectRelation {
	from: Subject | undefined = undefined
	to: Subject | undefined = undefined
	graph: Graph

	constructor(graph: Graph) {
		this.graph = graph
	}

	delete() {
		this.graph.subjectRelations = this.graph.subjectRelations.filter(relation => relation !== this)
	}

	getFromOptions(): {name: string, value: Subject}[] {
		if (this.to === undefined) {
			return this.graph.subjects
				.filter(subject => subject.name !== "")
				.map(subject => ({name: subject.name, value: subject}))
		} else {
			let children = this.to.getChildren()
			return this.graph.subjects
				.filter(subject => !children.includes(subject) && subject !== this.to && subject.name !== "")
				.map(subject => ({name: subject.name, value: subject}))
		}
		
	}

	getToOptions(): {name: string, value: Subject}[] {
		if (this.from === undefined) {
			return this.graph.subjects
				.filter(subject => subject.name !== "")
				.map(subject => ({name: subject.name, value: subject}))
		} else {
			let parents = this.from.getParents()
			return this.graph.subjects
				.filter(subject => !parents.includes(subject) && subject !== this.from && subject.name !== "")
				.map(subject => ({name: subject.name, value: subject}))
		}
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