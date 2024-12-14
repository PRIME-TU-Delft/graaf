
// Internal dependencies
import * as settings from '$scripts/settings'

import { compareArrays, customError, debounce } from '$scripts/utility'
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

import type SaveStatus from '$components/SaveStatus.svelte'
import type { DropdownOption, SerializedGraph } from '$scripts/types'

// Exports
export { GraphController }


// --------------------> Graph Controller


class GraphController {
	private _course?: CourseController
	private _domains?: DomainController[]
	private _domains_relations?: DomainRelationController[]
	private _subjects?: SubjectController[]
	private _subjects_relations?: SubjectRelationController[]
	private _lectures?: LectureController[]
	private _links?: LinkController[]

	public save = debounce(this._save, settings.DEBOUNCE_DELAY)

	private constructor(
		public cache: ControllerCache,
		public id: number,
		public name: string,
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
	get trimmed_name(): string {
		return this.name.trim()
	}

	get display_name(): string {
		return this.trimmed_name === '' ? 'Untitled graph' : this.trimmed_name
	}

	// Course properties
	get course_id(): number {
		if (this._course_id === undefined)
			throw customError('GraphError', 'Course data unknown')
		return this._course_id
	}

	get course(): CourseController {
		if (this._course_id === undefined)
			throw customError('GraphError', 'Course data unknown')
		if (this._course !== undefined)
			return this._course

		// Fetch course from the cache
		this._course = this.cache.findOrThrow(CourseController, this._course_id)
		return this._course
	}

	// Domain properties
	get domain_ids(): number[] {
		if (this._domain_ids === undefined)
			throw customError('GraphError', 'Domain data unknown')
		return Array.from(this._domain_ids)
	}

	get domains(): DomainController[] {
		if (this._domain_ids === undefined)
			throw customError('GraphError', 'Domain data unknown')
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

		this.sort('domain-relations')
		return Array.from(this._domains_relations)
	}

	// Subject properties
	get subject_ids(): number[] {
		if (this._subject_ids === undefined)
			throw customError('GraphError', 'Subject data unknown')
		return Array.from(this._subject_ids)
	}

	get subjects(): SubjectController[] {
		if (this._subject_ids === undefined)
			throw customError('GraphError', 'Subject data unknown')
		if (this._subjects !== undefined)
			return Array.from(this._subjects)

		// Fetch subjects from the cache
		this._subjects = this._subject_ids.map(id => this.cache.findOrThrow(SubjectController, id))

		this.sort('subjects')
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

		this.sort('subject-relations')
		return Array.from(this._subjects_relations)
	}

	// Lecture properties
	get lecture_ids(): number[] {
		if (this._lecture_ids === undefined)
			throw customError('GraphError', 'Lecture data unknown')
		return Array.from(this._lecture_ids)
	}

	get lectures(): LectureController[] {
		if (this._lecture_ids === undefined)
			throw customError('GraphError', 'Lecture data unknown')
		if (this._lectures !== undefined)
			return Array.from(this._lectures)

		// Fetch lectures from the cache
		this._lectures = this._lecture_ids.map(id => this.cache.findOrThrow(LectureController, id))
		this._lectures.sort((a, b) => a.order - b.order)

		return Array.from(this._lectures)
	}

	get lecture_options(): DropdownOption<LectureController>[] {
		return this.lectures.map(lecture => ({
			value: lecture,
			label: lecture.display_name
		}))
	}

	// Link properties
	get link_ids(): number[] {
		if (this._link_ids === undefined)
			throw customError('GraphError', 'Link data unknown')
		return Array.from(this._link_ids)
	}

	get links(): LinkController[] {
		if (this._link_ids === undefined)
			throw customError('GraphError', 'Link data unknown')
		if (this._links !== undefined)
			return Array.from(this._links)

		// Fetch links from the cache
		this._links = this._link_ids.map(id => this.cache.findOrThrow(LinkController, id))
		return Array.from(this._links)
	}

	// Copy properties
	get copy_options(): DropdownOption<CourseController>[] {
		const courses = this.cache.all(CourseController)
		return courses.map(course => ({
			value: course,
			label: course.display_name
		}))
	}

	// --------------------> Assignments

	assignDomain(domain: DomainController) {
		if (this._domain_ids !== undefined) {
			if (this._domain_ids.includes(domain.id))
				throw customError('GraphError', `Domain with ID ${domain.id} already assigned to graph with ID ${this.id}`)
			this._domain_ids.push(domain.id)
			this._domains?.push(domain)
		}
	}

	assignDomainRelation(relation: DomainRelationController) {
		if (this._domains_relations !== undefined) {
			if (this._domains_relations.includes(relation))
				throw customError('GraphError', `Domain relation already assigned to graph with ID ${this.id}`)
			this._domains_relations.push(relation)
		}
	}

	assignSubject(subject: SubjectController) {
		if (this._subject_ids !== undefined) {
			if (this._subject_ids.includes(subject.id))
				throw customError('GraphError', `Subject with ID ${subject.id} already assigned to graph with ID ${this.id}`)
			this._subject_ids.push(subject.id)
			this._subjects?.push(subject)
		}
	}

	assignSubjectRelation(relation: SubjectRelationController) {
		if (this._subjects_relations !== undefined) {
			if (this._subjects_relations.includes(relation))
				throw customError('GraphError', `Subject relation already assigned to graph with ID ${this.id}`)
			this._subjects_relations.push(relation)
		}
	}

	assignLecture(lecture: LectureController) {
		if (this._lecture_ids !== undefined) {
			if (this._lecture_ids.includes(lecture.id))
				throw customError('GraphError', `Lecture with ID ${lecture.id} already assigned to graph with ID ${this.id}`)
			this._lecture_ids.push(lecture.id)
			this._lectures?.push(lecture)
		}
	}

	assignToLink(link: LinkController, mirror: boolean = true) {
		if (this._link_ids !== undefined) {
			if (this._link_ids.includes(link.id))
				throw customError('GraphError', `Link with ID ${link.id} already assigned to graph with ID ${this.id}`)
			this._link_ids.push(link.id)
			this._links?.push(link)
		}

		if (mirror) {
			link.assignGraph(this, false)
		}
	}

	unassignDomain(domain: DomainController) {
		if (this._domain_ids !== undefined) {
			if (!this._domain_ids.includes(domain.id))
				throw customError('GraphError', `Domain with ID ${domain.id} not assigned to graph with ID ${this.id}`)
			this._domain_ids = this._domain_ids.filter(id => id !== domain.id)
			this._domains = this._domains?.filter(d => d.id !== domain.id)
		}
	}

	unassignDomainRelation(relation: DomainRelationController) {
		if (this._domains_relations !== undefined) {
			if (!this._domains_relations.includes(relation))
				throw customError('GraphError', `Domain relation not assigned to graph with ID ${this.id}`)
			this._domains_relations = this._domains_relations.filter(r => r !== relation)
		}
	}

	unassignSubject(subject: SubjectController) {
		if (this._subject_ids !== undefined) {
			if (!this._subject_ids.includes(subject.id))
				throw customError('GraphError', `Subject with ID ${subject.id} not assigned to graph with ID ${this.id}`)
			this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
			this._subjects = this._subjects?.filter(s => s.id !== subject.id)
		}
	}

	unassignSubjectRelation(relation: SubjectRelationController) {
		if (this._subjects_relations !== undefined) {
			if (!this._subjects_relations.includes(relation))
				throw customError('GraphError', `Subject relation not assigned to graph with ID ${this.id}`)
			this._subjects_relations = this._subjects_relations.filter(r => r !== relation)
		}
	}

	unassignLecture(lecture: LectureController) {
		if (this._lecture_ids !== undefined) {
			if (!this._lecture_ids.includes(lecture.id))
				throw customError('GraphError', `Lecture with ID ${lecture.id} not assigned to graph with ID ${this.id}`)
			this._lecture_ids = this._lecture_ids.filter(id => id !== lecture.id)
			this._lectures = this._lectures?.filter(l => l.id !== lecture.id)
		}
	}

	unassignFromLink(link: LinkController, mirror: boolean = true) {
		if (this._link_ids !== undefined) {
			if (!this._link_ids.includes(link.id))
				throw customError('GraphError', `Link with ID ${link.id} not assigned to graph with ID ${this.id}`)
			this._link_ids = this._link_ids.filter(id => id !== link.id)
			this._links = this._links?.filter(l => l.id !== link.id)
		}

		if (mirror) {
			link.unassignGraph(this, false)
		}
	}

	// --------------------> Validation

	validateName() {
		const validation = new Validation()

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

	// --------------------> Actions

	static async create(cache: ControllerCache, course: CourseController, name: string, save_status?: SaveStatus): Promise<GraphController> {
		save_status?.setSaving(true)

		// Call the API to create a new graph
		const response = await fetch('/api/graph', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ course_id: course.id, name })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/graph POST)', await response.text())
		}

		// Revive the graph
		const data = await response.json()
		if (!validSerializedGraph(data)) {
			throw customError('GraphError', 'Invalid graph data received from API')
		}

		const graph = GraphController.revive(cache, data)
		course.assignGraph(graph)
		save_status?.setSaving(false)

		return graph
	}

	static revive(cache: ControllerCache, data: SerializedGraph): GraphController {
		const graph = cache.find(GraphController, data.id)
		if (graph !== undefined) {

			// Throw an error if the existing graph is inconsistent
			if (!graph.represents(data)) {
				throw customError('GraphError', `Graph with ID ${data.id} already exists, and is inconsistent with new data`)
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
			&& (this._lecture_ids === undefined || data.lecture_ids === undefined  || compareArrays(this._lecture_ids, data.lecture_ids))
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

	private async _save(save_status?: SaveStatus) {
		if (this.validateName().severity === Severity.error) return
		save_status?.setSaving(true)

		// Call the API to save the graph
		const response = await fetch('/api/graph', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/graph PUT)', await response.text())
		}

		save_status?.setSaving(false)
	}

	async delete(save_status?: SaveStatus): Promise<void> {
		save_status?.setSaving(true)

		// Unassign course and links
		if (this._course_id !== undefined)
			this.course.unassignGraph(this)
		if (this._link_ids !== undefined)
			for (const link of this.links)
				link.unassignGraph(this, false)

		// Delete domains, subjects and lectures
		const promises: Promise<void>[] = []
		if (this._domain_ids !== undefined)
			promises.push(...this.domains.map(async domain => await domain.delete(false)))
		if (this._subject_ids !== undefined)
			promises.push(...this.subjects.map(async subject => await subject.delete()))
		if (this._lecture_ids !== undefined)
			promises.push(...this.lectures.map(async lecture => await lecture.delete(false)))
		await Promise.all(promises)

		// Call the API to delete the graph
		const response = await fetch(`/api/graph/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/graph DELETE)', await response.text())
		}

		// Remove the graph from the cache
		this.cache.remove(this)
		save_status?.setSaving(false)
	}

	async prune(save_status?: SaveStatus) {
		save_status?.setSaving(true)

		const promises: Promise<void>[] = []
		let reorder_domains = false
		let reorder_lectures = false

		// Prune empty domains
		if (this._domain_ids !== undefined) {
			const empty_domains = this.domains.filter(domain => domain.is_empty)
			if (empty_domains.length > 0) reorder_domains = true
			promises.push(...empty_domains.map(domain => domain.delete(false)))
		}

		// Prune empty domain relations
		if (this._domains_relations !== undefined) {
			const empty_domain_relations = this.domain_relations.filter(relation => relation.is_empty)
			empty_domain_relations.forEach(relation => relation.delete())
		}

		// Prune empty subjects
		if (this._subject_ids !== undefined) {
			const empty_subjects = this.subjects.filter(subject => subject.is_empty)
			promises.push(...empty_subjects.map(subject => subject.delete()))
		}

		// Prune empty subject relations
		if (this._subjects_relations !== undefined) {
			const empty_subject_relations = this.subject_relations.filter(relation => relation.is_empty)
			empty_subject_relations.forEach(relation => relation.delete())
		}

		// Prune empty lectures
		if (this._lecture_ids !== undefined) {
			const empty_lectures = this.lectures.filter(lecture => lecture.is_empty)
			if (empty_lectures.length > 0) reorder_lectures = true
			promises.push(...empty_lectures.map(lecture => lecture.delete(false)))
		}

		await Promise.all(promises)
		if (reorder_domains) await this.reorderDomains()
		if (reorder_lectures) await this.reorderLectures()

		save_status?.setSaving(false)
	}

	// TODO Rewrite copy to use API endpoint
	async copy(course: CourseController, save_status?: SaveStatus): Promise<GraphController> {
		save_status?.setSaving(true)

		// Copy graph
		const copied_graph = await GraphController.create(this.cache, course, `${this.display_name} (Copied from ${this.course.code})`)

		// Copy domains
		const domain_map = new Map<number, DomainController>()
		for (const domain of this.domains) {
			const copied_domain = await domain.copy(copied_graph)
			domain_map.set(domain.id, copied_domain)
		}

		// Copy domain relations
		for (const relation of this.domain_relations) {
			if (relation.parent === null || relation.child === null) {
				continue
			}

			// Assign copied domains
			const copied_parent = domain_map.get(relation.parent.id)
			const copied_child = domain_map.get(relation.child.id)
			if (copied_parent === undefined || copied_child === undefined) {
				throw customError('GraphError', `Domain incorrectly copied`)
			}

			DomainRelationController.create(copied_graph, copied_parent, copied_child)
		}

		// Copy subjects
		const subject_map = new Map<number, SubjectController>()
		for (const subject of this.subjects) {
			const copied_subject = await subject.copy(copied_graph)
			subject_map.set(subject.id, copied_subject)

			// Assign copied domains
			if (subject.domain_id === null) continue
			const copied_domain = domain_map.get(subject.domain_id)
			if (copied_domain === undefined) throw customError('GraphError', `Domain incorrectly copied`)
			copied_subject.domain = copied_domain
		}

		// Copy subject relations
		for (const relation of this.subject_relations) {
			if (relation.parent === null || relation.child === null) {
				continue
			}

			// Assign copied subjects
			const copied_parent = subject_map.get(relation.parent.id)
			const copied_child = subject_map.get(relation.child.id)
			if (copied_parent === undefined || copied_child === undefined) {
				throw customError('GraphError', `Subject incorrectly copied`)
			}

			SubjectRelationController.create(copied_graph, copied_parent, copied_child)
		}

		// Copy lectures
		for (const lecture of this.lectures) {
			const copied_lecture = await lecture.copy(copied_graph)

			// Assign copied subjects
			for (const subject of lecture.present_subjects) {
				const copied_subject = subject_map.get(subject.id)
				if (copied_subject === undefined) {
					throw customError('GraphError', `Subject incorrectly copied`)
				}

				copied_lecture.assignSubject(copied_subject)
			}
		}

		save_status?.setSaving(false)
		return copied_graph
	}

	async reorderDomains(domains?: DomainController[], save_status?: SaveStatus) {
		save_status?.setSaving(true)

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
		const response = await fetch(`/api/graph/${this.id}/reorder/domains`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ domain_ids: this.domain_ids })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/graph/{this.id}/reorder/domains PUT)', await response.text())
		}

		save_status?.setSaving(false)
	}

	async reorderLectures(lectures?: LectureController[], save_status?: SaveStatus) {
		save_status?.setSaving(true)

		// Update the graph
		if (lectures !== undefined) {
			this._lecture_ids = lectures.map(lecture => lecture.id)
			this._lectures = lectures
		}

		// Update lectures
		for (const [index, lecture] of this.lectures.entries()) {
			lecture.order = index
		}

		// Call the API to reorder the graph
		const response = await fetch(`/api/graph/${this.id}/reorder/lectures`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ lecture_ids: this.lecture_ids })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/graph/{this.id}/reorder/lectures PUT)', await response.text())
		}

		save_status?.setSaving(false)
	}

	sort(...targets: ('subjects' | 'domain-relations' | 'subject-relations')[]) {

		// Custom sorting algorithm, as the default sort is unstable
		function insertionSort<T>(array: T[], key: (item: T) => number) {
			const n = array.length

			for (let i = 1; i < n; i++) {
				const x = array[i]

				let j = i
				while (j > 0 && key(array[j - 1]) > key(x)) {
					array[j] = array[j - 1]
					j--
				}

				array[j] = x
			}
		}

		// Default to sorting all targets
		if (targets.length === 0) {
			targets = ['subjects', 'domain-relations', 'subject-relations']
		}

		// Sort subjects
		if (targets.includes('subjects') && this._subjects !== undefined) {
			insertionSort(this._subjects, subject => subject.domain?.order ?? Infinity)
			this._subject_ids = this._subjects.map(subject => subject.id)
		}

		// Sort domain relations
		if (targets.includes('domain-relations') && this._domains_relations !== undefined) {
			insertionSort(this._domains_relations, relation => relation.child?.order ?? Infinity)
			insertionSort(this._domains_relations, relation => relation.parent?.order ?? Infinity)
		}

		// Sort subject relations
		if (targets.includes('subject-relations') && this._subjects_relations !== undefined) {
			insertionSort(this._subjects_relations, relation => relation.child?.domain?.order ?? Infinity)
			insertionSort(this._subjects_relations, relation => relation.parent?.domain?.order ?? Infinity)
		}
	}

	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = this.trimmed_name.toLowerCase()

		return lower_name.includes(lower_query)
	}
}
