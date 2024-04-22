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
		const parents: Domain[] = [this]

		for (const relation of this.graph.domainRelations) {
			if (relation.to === this && relation.from !== undefined) {
				parents.push(...relation.from.getParents())
			}
		}

		return parents
	}

	getChildren(): Domain[] {
		const children: Domain[] = [this]

		for (const relation of this.graph.domainRelations) {
			if (relation.from === this && relation.to !== undefined) {
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
		const parents: Subject[] = [this];

		for (const relation of this.graph.subjectRelations) {
			if (relation.to === this && relation.from !== undefined) {
				parents.push(...relation.from.getParents());
			}
		}

		return parents;
	}

	getChildren(): Subject[] {
		const children: Subject[] = [this]
		
		for (const relation of this.graph.subjectRelations) {
			if (relation.from === this && relation.to !== undefined) {
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

	getFromOptions(): { name: string, value: Domain }[] {
		
		// Domain must have a name
		let options: Domain[] = this.graph.domains
			.filter(domain => domain.name !== "")

		// Prevent circular references
		if (this.to !== undefined) {
			let children = this.to.getChildren()
			options = options.filter(domain => !children.includes(domain))
		
			// Prevent duplicate relations
			if (this.from === undefined) {
				options = options.filter(domain => 
					!this.graph.domainRelations.find(relation =>
						relation.from === domain && relation.to === this.to
					)
				)
			}
		}

		return options.map(domain => ({name: domain.name, value: domain}))
	}

	getToOptions(): { name: string, value: Domain }[] {

		// Domain must have a name
		let options: Domain[] = this.graph.domains
			.filter(domain => domain.name !== "")

		// Prevent circular references
		if (this.from !== undefined) {
			let parents = this.from.getParents()
			options = options.filter(domain => !parents.includes(domain))

			// Prevent duplicate relations
			if (this.to === undefined) {
				options = options.filter(domain =>
					!this.graph.domainRelations.find(relation =>
						relation.from === this.from && relation.to === domain
					)
				)
			}
		}

		return options.map(domain => ({name: domain.name, value: domain}))
	}

	getFromPreview() {
		if (this.from === undefined)
			return "transparent"
		return this.from.preview()
	}

	getToPreview() {
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

	getFromOptions(): { name: string, value: Subject }[] {

		// Subject must have a name
		let options: Subject[] = this.graph.subjects
			.filter(subject => subject.name !== "")

		// Prevent circular references
		if (this.to !== undefined) {
			let children = this.to.getChildren()
			options = options.filter(subject => !children.includes(subject))

			// Prevent duplicate relations
			if (this.from === undefined) {
				options = options.filter(subject =>
					!this.graph.subjectRelations.find(relation =>
						relation.from === subject && relation.to === this.to
					)
				)
			}
		}

		return options.map(subject => ({name: subject.name, value: subject}))
	}

	getToOptions(): { name: string, value: Subject }[] {

		// Subject must have a name
		let options: Subject[] = this.graph.subjects
			.filter(subject => subject.name !== "")

		// Prevent circular references
		if (this.from !== undefined) {
			let parents = this.from.getParents()
			options = options.filter(subject => !parents.includes(subject))

			// Prevent duplicate relations
			if (this.to === undefined) {
				options = options.filter(subject =>
					!this.graph.subjectRelations.find(relation =>
						relation.from === this.from && relation.to === subject
					)
				)
			}
		}

		return options.map(subject => ({name: subject.name, value: subject}))
	}

	getFromPreview() {
		if (this.from === undefined)
			return "transparent"
		return this.from.preview()
	}

	getToPreview() {
		if (this.to === undefined)
			return "transparent"
		return this.to.preview()
	}
}