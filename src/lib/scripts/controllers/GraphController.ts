
// Internal dependencies
import * as settings from '$scripts/settings'
import { compareArrays } from '$scripts/utility'
import { Validation, Severity } from '$scripts/validation'

import {
	ControllerCache,
	CourseController,
	DomainController,
	DomainRelationController,
	SubjectController,
	SubjectRelationController,
	LectureController,
	LinkController,
} from '$scripts/controllers'

import { validSerializedGraph } from '$scripts/types'

import type {
	DropdownOption,
	SerializedGraph
} from '$scripts/types'

// Exports
export { GraphController }


// --------------------> Graph Controller


class GraphController {
	private _untouched: boolean = false
	private _course?: CourseController
	private _domains?: DomainController[]
	private _domains_relations?: DomainRelationController[]
	private _subjects?: SubjectController[]
	private _subjects_relations?: SubjectRelationController[]
	private _lectures?: LectureController[]
	private _links?: LinkController[]

	private constructor(
		public cache: ControllerCache,
		public id: number,
		private _name: string,
		private _course_id?: number,
		private _domain_ids?: number[],
		private _subject_ids?: number[],
		private _lecture_ids?: number[],
		private _link_ids?: number[]
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Name properties
	get name(): string {
		return this._name
	}

	set name(value: string) {
		this._name = value
		this._untouched = false
	}

	get trimmed_name(): string {
		return this._name.trim()
	}

	// Course properties
	get course_id(): number {
		if (this._course_id === undefined)
			throw new Error('GraphError: Course data unknown')
		return this._course_id
	}

	get course(): CourseController {
		if (this._course_id === undefined)
			throw new Error('GraphError: Course data unknown')
		if (this._course !== undefined)
			return this._course

		// Fetch course from the cache
		this._course = this.cache.findOrThrow(CourseController, this._course_id)
		return this._course
	}

	// Domain properties
	get domain_ids(): number[] {
		if (this._domain_ids === undefined)
			throw new Error('GraphError: Domain data unknown')
		return Array.from(this._domain_ids)
	}

	get domains(): DomainController[] {
		if (this._domain_ids === undefined)
			throw new Error('GraphError: Domain data unknown')
		if (this._domains !== undefined)
			return Array.from(this._domains)

		// Fetch domains from the cache
		this._domains = this._domain_ids.map(id => this.cache.findOrThrow(DomainController, id))
		this._domains.sort((a, b) => a.order - b.order)

		return Array.from(this._domains)
	}

	get domain_relations(): DomainRelationController[] {
		if (this._domains_relations !== undefined)
			return Array.from(this._domains_relations)

		// Infer domain relations
		this._domains_relations = []
		for (const parent of this.domains) {
			for (const child of parent.children) {
				DomainRelationController.revive(this, parent, child)
			}
		}

		return Array.from(this._domains_relations)
	}

	// Subject properties
	get subject_ids(): number[] {
		if (this._subject_ids === undefined)
			throw new Error('GraphError: Subject data unknown')
		return Array.from(this._subject_ids)
	}

	get subjects(): SubjectController[] {
		if (this._subject_ids === undefined)
			throw new Error('GraphError: Subject data unknown')
		if (this._subjects !== undefined)
			return Array.from(this._subjects)

		// Fetch subjects from the cache
		this._subjects = this._subject_ids.map(id => this.cache.findOrThrow(SubjectController, id))
		return Array.from(this._subjects)
	}

	get subject_relations(): SubjectRelationController[] {
		if (this._subjects_relations !== undefined)
			return Array.from(this._subjects_relations)

		// Infer subject relations
		this._subjects_relations = []
		for (const parent of this.subjects) {
			for (const child of parent.children) {
				SubjectRelationController.revive(this, parent, child)
			}
		}

		return Array.from(this._subjects_relations)
	}

	// Lecture properties
	get lecture_ids(): number[] {
		if (this._lecture_ids === undefined)
			throw new Error('GraphError: Lecture data unknown')
		return Array.from(this._lecture_ids)
	}

	get lectures(): LectureController[] {
		if (this._lecture_ids === undefined)
			throw new Error('GraphError: Lecture data unknown')
		if (this._lectures !== undefined)
			return Array.from(this._lectures)

		// Fetch lectures from the cache
		this._lectures = this._lecture_ids.map(id => this.cache.findOrThrow(LectureController, id))
		return Array.from(this._lectures)
	}

	get lecture_options(): DropdownOption<LectureController>[] {
		return this.lectures.map(lecture => ({
			value: lecture,
			label: lecture.name,
			validation: Validation.success()
		}))
	}

	// Link properties
	get link_ids(): number[] {
		if (this._link_ids === undefined)
			throw new Error('GraphError: Link data unknown')
		return Array.from(this._link_ids)
	}

	get links(): LinkController[] {
		if (this._link_ids === undefined)
			throw new Error('GraphError: Link data unknown')
		if (this._links !== undefined)
			return Array.from(this._links)

		// Fetch links from the cache
		this._links = this._link_ids.map(id => this.cache.findOrThrow(LinkController, id))
		return Array.from(this._links)
	}

	// Untouched state
	get untouched(): boolean {
		return this._untouched
	}

	// --------------------> Assignments

	addDomain(domain: DomainController) {
		if (this._domain_ids === undefined)
			return
		if (this._domain_ids.includes(domain.id))
			throw new Error(`GraphError: Domain with ID ${domain.id} already assigned to graph with ID ${this.id}`)
		this._domain_ids?.push(domain.id)
		this._domains?.push(domain)
		this._untouched = false
	}

	addDomainRelation(relation: DomainRelationController) {
		if (this._domains_relations === undefined)
			return
		if (this._domains_relations.includes(relation))
			throw new Error(`GraphError: Domain relation already assigned to graph with ID ${this.id}`)
		this._domains_relations.push(relation)
		this._untouched = false
	}

	addSubject(subject: SubjectController) {
		if (this._subject_ids === undefined)
			return
		if (this._subject_ids.includes(subject.id))
			throw new Error(`GraphError: Subject with ID ${subject.id} already assigned to graph with ID ${this.id}`)
		this._subject_ids?.push(subject.id)
		this._subjects?.push(subject)
		this._untouched = false
	}

	addSubjectRelation(relation: SubjectRelationController) {
		if (this._subjects_relations === undefined)
			return
		if (this._subjects_relations.includes(relation))
			throw new Error(`GraphError: Subject relation already assigned to graph with ID ${this.id}`)
		this._subjects_relations.push(relation)
		this._untouched = false
	}

	addLecture(lecture: LectureController) {
		if (this._lecture_ids === undefined)
			return
		if (this._lecture_ids.includes(lecture.id))
			throw new Error(`GraphError: Lecture with ID ${lecture.id} already assigned to graph with ID ${this.id}`)
		this._lecture_ids?.push(lecture.id)
		this._lectures?.push(lecture)
		this._untouched = false
	}

	addLink(link: LinkController) {
		if (this._link_ids === undefined)
			return
		if (this._link_ids.includes(link.id))
			throw new Error(`GraphError: Link with ID ${link.id} already assigned to graph with ID ${this.id}`)
		this._link_ids?.push(link.id)
		this._links?.push(link)
		this._untouched = false
	}

	removeDomain(domain: DomainController) {
		if (this._domain_ids === undefined)
			return
		if (!this._domain_ids.includes(domain.id))
			throw new Error(`GraphError: Domain with ID ${domain.id} not assigned to graph with ID ${this.id}`)
		this._domain_ids = this._domain_ids?.filter(id => id !== domain.id)
		this._domains = this._domains?.filter(d => d.id !== domain.id)
		this._untouched = false
	}

	removeDomainRelation(relation: DomainRelationController) {
		if (this._domains_relations === undefined)
			return
		if (!this._domains_relations.includes(relation))
			throw new Error(`GraphError: Domain relation not assigned to graph with ID ${this.id}`)
		this._domains_relations = this._domains_relations?.filter(r => r !== relation)
		this._untouched = false
	}

	removeSubject(subject: SubjectController) {
		if (this._subject_ids === undefined)
			return
		if (!this._subject_ids.includes(subject.id))
			throw new Error(`GraphError: Subject with ID ${subject.id} not assigned to graph with ID ${this.id}`)
		this._subject_ids = this._subject_ids?.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(s => s.id !== subject.id)
		this._untouched = false
	}

	removeSubjectRelation(relation: SubjectRelationController) {
		if (this._subjects_relations === undefined)
			return
		if (!this._subjects_relations.includes(relation))
			throw new Error(`GraphError: Subject relation not assigned to graph with ID ${this.id}`)
		this._subjects_relations = this._subjects_relations?.filter(r => r !== relation)
		this._untouched = false
	}

	removeLecture(lecture: LectureController) {
		if (this._lecture_ids === undefined)
			return
		if (!this._lecture_ids.includes(lecture.id))
			throw new Error(`GraphError: Lecture with ID ${lecture.id} not assigned to graph with ID ${this.id}`)
		this._lecture_ids = this._lecture_ids?.filter(id => id !== lecture.id)
		this._lectures = this._lectures?.filter(l => l.id !== lecture.id)
		this._untouched = false
	}

	removeLink(link: LinkController) {
		if (this._link_ids === undefined)
			return
		if (!this._link_ids.includes(link.id))
			throw new Error(`GraphError: Link with ID ${link.id} not assigned to graph with ID ${this.id}`)
		this._link_ids = this._link_ids?.filter(id => id !== link.id)
		this._links = this._links?.filter(l => l.id !== link.id)
		this._untouched = false
	}

	// --------------------> Validation

	validateName(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this._untouched) {
			return validation
		}

		if (this.trimmed_name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Graph has no name'
			})
		} else if (this.trimmed_name.length > settings.MAX_GRAPH_NAME_LENGTH) {
			validation.add({
				severity: Severity.error,
				short: 'Graph name is too long',
				long: `Graph name cannot exceed ${settings.MAX_GRAPH_NAME_LENGTH} characters`
			})
		} else if (this.cache.all(GraphController)
			.find(graph => graph.id !== this.id && graph.trimmed_name === this.trimmed_name)
		) {
			validation.add({
				severity: Severity.error,
				short: 'Graph name is not unique'
			})
		}

		return validation
	}

	validateDomains(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this._untouched) {
			return validation
		}

		if (this.domain_ids.length === 0) {
			validation.add({
				severity: Severity.error,
				short: 'Graph has no domains'
			})
		}

		return validation
	}

	validateSubjects(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this._untouched) {
			return validation
		}

		if (this.subject_ids.length === 0) {
			validation.add({
				severity: Severity.error,
				short: 'Graph has no subjects'
			})
		}

		return validation
	}

	validateLectures(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this._untouched) {
			return validation
		}

		if (this.lecture_ids.length === 0) {
			validation.add({
				severity: Severity.error,
				short: 'Graph has no lectures'
			})
		}

		return validation
	}
	
	validateLinks(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this._untouched) {
			return validation
		}

		if (this.link_ids.length === 0) {
			validation.add({
				severity: Severity.error,
				short: 'Graph has no links'
			})
		}

		return validation
	}

	validate(strict: boolean = true): Validation {
		const validation = new Validation()

		validation.add(this.validateName(strict))
		validation.add(this.validateDomains(strict))
		validation.add(this.validateSubjects(strict))
		validation.add(this.validateLectures(strict))
		validation.add(this.validateLinks(strict))

		return validation
	}


	// --------------------> Actions

	static async create(cache: ControllerCache, course: CourseController, name: string): Promise<GraphController> {

		// Call the API to create a new graph
		const response = await fetch('/api/graph', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ course_id: course.id, name })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/graph POST): ${response.status} ${response.statusText}`)
		}

		// Revive the graph
		const data = await response.json()
		if (validSerializedGraph(data)) {
			const graph = GraphController.revive(cache, data)
			graph._untouched = true
			course.addGraph(graph)
			return graph
		}

		throw new Error(`GraphError: Invalid graph data received from API`)
	}

	static revive(cache: ControllerCache, data: SerializedGraph): GraphController {
		const graph = cache.find(GraphController, data.id)
		if (graph !== undefined) {

			// Throw an error if the existing graph is inconsistent
			if (!graph.represents(data)) {
				throw new Error(`GraphError: Graph with ID ${data.id} already exists, and is inconsistent with new data`)
			}

			// Update the existing graph where necessary
			if (graph._course_id === undefined)
				graph._course_id = data.course_id
			if (graph._domain_ids === undefined)
				graph._domain_ids = data.domain_ids
			if (graph._subject_ids === undefined)
				graph._subject_ids = data.subject_ids
			if (graph._lecture_ids === undefined)
				graph._lecture_ids = data.lecture_ids
			if (graph._link_ids === undefined)
				graph._link_ids = data.link_ids

			return graph
		}

		return new GraphController(
			cache,
			data.id,
			data.name,
			data.course_id,
			data.domain_ids,
			data.subject_ids,
			data.lecture_ids,
			data.link_ids
		)
	}

	represents(data: SerializedGraph): boolean {
		return this.id === data.id
			&& this.trimmed_name === data.name
			&& (this._course_id === undefined   || data.course_id === undefined    || this._course_id === data.course_id)
			&& (this._domain_ids === undefined  || data.domain_ids === undefined   || compareArrays(this._domain_ids, data.domain_ids))
			&& (this._subject_ids === undefined || data.subject_ids === undefined  || compareArrays(this._subject_ids, data.subject_ids))
			&& (this._lecture_ids === undefined || data.lecture_ids === undefined || compareArrays(this._lecture_ids, data.lecture_ids))
			&& (this._link_ids === undefined    || data.link_ids === undefined     || compareArrays(this._link_ids, data.link_ids))
	}

	reduce(): SerializedGraph {
		return {
			id: this.id,
			name: this.trimmed_name,
			course_id: this._course_id,
			domain_ids: this._domain_ids,
			subject_ids: this._subject_ids,
			lecture_ids: this._lecture_ids,
			link_ids: this._link_ids
		}
	}

	async save() {

		// Call the API to save the graph
		const response = await fetch('/api/graph', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/graph PUT): ${response.status} ${response.statusText}`)
		}
	}

	async delete() {

		// Unassign course and links
		if (this._course_id !== undefined)
			this.course.removeGraph(this)
		if (this._link_ids !== undefined)
			for (const link of this.links)
				link.graph = null

		// Delete domains, subjects and lectures
		if (this._domain_ids !== undefined)
			await Promise.all(this.domains.map(async domain => await domain.delete()))
		if (this._subject_ids !== undefined)
			await Promise.all(this.subjects.map(async subject => await subject.delete()))
		if (this._lecture_ids !== undefined)
			await Promise.all(this.lectures.map(async lecture => await lecture.delete()))

		// Call the API to delete the graph
		const response = await fetch(`/api/graph/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/graph/${this.id} DELETE): ${response.status} ${response.statusText}`)
		}

		// Remove the graph from the cache
		this.cache.remove(this)
	}

	async reorder(domains?: DomainController[]) {

		// Update the graph
		if (domains !== undefined) {
			this._domain_ids = domains.map(domain => domain.id)
			this._domains = domains
		}

		// Update domains
		for (const [index, domain] of this.domains.entries()) {
			domain.order = index
		}
		
		// Call the API to reorder the graph
		const response = await fetch(`/api/graph/${this.id}/reorder`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.domain_ids)
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/graph/${this.id}/reorder PUT): ${response.status} ${response.statusText}`)
		}
	}

	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = this.trimmed_name.toLowerCase()
		return lower_name.includes(lower_query)
	}
}
