
// External dependencies
import { browser } from '$app/environment'

// Internal dependencies
import { ValidationData, Severity } from '$scripts/validation'

import {
	ControllerCache,
	CourseController,
	DomainController,
	DomainRelationController,
	SubjectController,
	SubjectRelationController,
	LectureController,
	LinkController
} from '$scripts/controllers'

import type {
	SerializedGraph,
	SerializedDomain,
	SerializedCourse,
	SerializedSubject,
	SerializedLecture,
	SerializedLink
} from '$scripts/types'

// Exports
export { GraphController, SortOption }


// --------------------> Enums


enum SortOption {
	ascending  = 0b1000000000,
	descending = 0b0100000000,
	relations  = 0b0010000000,
	subjects   = 0b0001000000,
	domains    = 0b0000100000,
	index      = 0b0000010000,
	name       = 0b0000001000,
	style      = 0b0000000100,
	parents    = 0b0000000010,
	children   = 0b0000000001
}


// --------------------> Controller


class GraphController {
	private _course?: CourseController
	private _domains?: DomainController[]
	private _domain_relations?: DomainRelationController[]
	private _subjects?: SubjectController[]
	private _subject_relations?: SubjectRelationController[]
	private _lectures?: LectureController[]
	private _links?: LinkController[]

	private constructor(
		public cache: ControllerCache,
		public id: number,
		public name: string,
		private _course_id: number,
		private _domain_ids: number[],
		private _subject_ids: number[],
		private _lecture_ids: number[],
		private _links_ids: number[]
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	get trimmed_name(): string {
		return this.name.trim()
	}

	get course_id(): number {
		return this._course_id
	}

	set course_id(id: number) {
		
		// Unassign previous course
		this.cache.find(CourseController, this._course_id)
			?.unassignGraph(this)

		// Assign new course
		this._course = undefined
		this._course_id = id

		this.cache.find(CourseController, this._course_id)
			?.assignGraph(this, false)
	}

	get domain_ids(): number[] {
		return this._domain_ids.concat()
	}

	get subject_ids(): number[] {
		return this._subject_ids.concat()
	}

	get lecture_ids(): number[] {
		return this._lecture_ids.concat()
	}

	get link_ids(): number[] {
		return this._links_ids.concat()
	}

	// --------------------> API Getters

	/**
	 * Get the course this graph is assigned to, from the cache or the API
	 * @returns The course this graph is assigned to
	 * @throws `APIError` if the API call fails
	 */

	async getCourse(): Promise<CourseController> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if course is already loaded
		if (this._course) {
			return this._course
		}

		// Call API to get the course data
		const response = await fetch(`/api/graph/${this.id}/course`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/graph/${this.id}/course GET): ${error}`)
			})

		// Revive the course
		const data = await response.json() as SerializedCourse
		this._course = CourseController.revive(this.cache, data)

		return this._course
	}

	/**
	 * Get the domains assigned to this graph, from the cache or the API
	 * @returns The domains assigned to this graph
	 * @throws `APIError` if the API call fails
	 */

	async getDomains(): Promise<DomainController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if domains are already loaded
		if (this._domains) {
			return Array.from(this._domains)
		}

		// Call API to get the domain data
		const response = await fetch(`/api/graph/${this.id}/domains`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/graph/${this.id}/domains GET): ${error}`)
			})

		// Revive the domains
		const data = await response.json() as SerializedDomain[]
		this._domains = data.map(domain => DomainController.revive(this.cache, domain))

		return Array.from(this._domains)
	}

	/**
	 * Infer the domain relations from the domains assigned to this graph
	 * @returns The domain relations
	 */

	async getDomainRelations(): Promise<DomainRelationController[]> {

		// Check if domain relations are already loaded
		if (this._domain_relations) {
			return Array.from(this._domain_relations)
		}

		// Infer relations
		this._domain_relations = []
		const domains = await this.getDomains()
		for (const domain of domains) {
			const children = await domain.getChildren()
			for (const child of children) {
				this.createDomainRelation(domain, child, false)
			}
		}

		return Array.from(this._domain_relations)
	}

	/**
	 * Get the subjects assigned to this graph, from the cache or the API
	 * @returns The subjects assigned to this graph
	 * @throws `APIError` if the API call fails
	 */

	async getSubjects(): Promise<SubjectController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if subjects are already loaded
		if (this._subjects) {
			return Array.from(this._subjects)
		}

		// Call API to get the subject data
		const response = await fetch(`/api/graph/${this.id}/subjects`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/graph/${this.id}/subjects GET): ${error}`)
			})

		// Revive the subjects
		const data = await response.json() as SerializedSubject[]
		this._subjects = data.map(subject => SubjectController.revive(this.cache, subject))

		return Array.from(this._subjects)
	}

	/**
	 * Infer the subject relations from the subjects assigned to this graph
	 * @returns The subject relations
	 */

	async getSubjectRelations(): Promise<SubjectRelationController[]> {

		// Check if subject relations are already loaded
		if (this._subject_relations) {
			return Array.from(this._subject_relations)
		}

		// Infer relations
		this._subject_relations = []
		const subjects = await this.getSubjects()
		for (const parent of subjects) {
			const children = await parent.getChildren()
			for (const child of children) {
				this.createSubjectRelation(parent, child, false)
			}
		}

		return Array.from(this._subject_relations)
	}

	/**
	 * Get the lectures assigned to this graph, from the cache or the API
	 * @returns The lectures assigned to this graph
	 * @throws `APIError` if the API call fails
	 */

	async getLectures(): Promise<LectureController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if lectures are already loaded
		if (this._lectures) {
			return Array.from(this._lectures)
		}

		// Call API to get the lectures
		const response = await fetch(`/api/graph/${this.id}/lectures`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/graph/${this.id}/lectures GET): ${error}`)
			})

		// Parse the data
		const data = await response.json() as SerializedLecture[]
		this._lectures = data.map(lecture => LectureController.revive(this.cache, lecture))

		return Array.from(this._lectures)
	}

	/**
	 * Get the links assigned to this graph, from the cache or the API
	 * @returns The links assigned to this graph
	 * @throws `APIError` if the API call fails
	 */

	async getLinks(): Promise<LinkController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if links are already loaded
		if (this._links) {
			return Array.from(this._links)
		}

		// Call API to get the link data
		const response = await fetch(`/api/graph/${this.id}/links`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/graph/${this.id}/links GET): ${error}`)
			})

		// Revive the links
		const data = await response.json() as SerializedLink[]
		this._links = data.map(link => LinkController.revive(this.cache, link))

		return Array.from(this._links)
	}

	// --------------------> API actions

	/**
	 * Create a new graph
	 * @param cache Cache to create the graph with
	 * @param course Course to assign the graph to
	 * @returns The newly created GraphController
	 * @throws `APIError` if the API call fails
	 */

	static async create(cache: ControllerCache, course: number, name: string): Promise<GraphController> {

		// Guard against SSR
		if (!browser) {
			Promise.reject()
		}

		// Call API to create a new graph
		const response = await fetch(`/api/graph`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ course, name })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/graph POST): ${error}`)
		})

		// Revive the graph
		const data = await response.json()
		const graph = GraphController.revive(cache, data)

		// Assign to course
		cache.find(CourseController, course)
			?.assignGraph(graph)

		return graph
	}

	/**
	 * Revive a graph from serialized data
	 * @param cache Cache to revive the graph with
	 * @param data Serialized data to revive
	 * @returns `GraphController` The revived GraphController
	 * @throws `GraphError` if the server data is out of sync with the cache
	 */

	static revive(cache: ControllerCache, data: SerializedGraph): GraphController {
		const graph = cache.find(GraphController, data.id)
		if (graph) {
			if (!graph.represents(data))
				throw new Error(`GraphError: Attempted to revive Graph with ID ${data.id}, but server data is out of sync with cache`)
			return graph
		}

		return new GraphController(
			cache,
			data.id,
			data.name,
			data.course,
			data.domains,
			data.subjects,
			data.lectures,
			data.links
		)
	}

	/**
	 * Check if this graph represents the serialized data
	 * @param data Serialized data to compare against
	 * @returns Whether this graph represents the serialized data
	 */

	represents(data: SerializedGraph): boolean {

		// Check the easy stuff
		if (
			this.id !== data.id ||
			this.trimmed_name !== data.name ||
			this.course_id !== data.course
		) {
			return false
		}

		// Check domains
		if (
			this.domain_ids.length !== data.domains.length ||
			this.domain_ids.some(id => !data.domains.includes(id)) ||
			data.domains.some(id => !this.domain_ids.includes(id))
		) {
			return false
		}

		// Check subjects
		if (
			this.subject_ids.length !== data.subjects.length ||
			this.subject_ids.some(id => !data.subjects.includes(id)) ||
			data.subjects.some(id => !this.subject_ids.includes(id))
		) {
			return false
		}

		// Check lectures
		if (
			this.lecture_ids.length !== data.lectures.length ||
			this.lecture_ids.some(id => !data.lectures.includes(id)) ||
			data.lectures.some(id => !this.lecture_ids.includes(id))
		) {
			return false
		}

		// Check links
		if (
			this.link_ids.length !== data.links.length ||
			this.link_ids.some(id => !data.links.includes(id)) ||
			data.links.some(id => !this.link_ids.includes(id))
		) {
			return false
		}

		return true
	}

	/**
	 * Serialize this graph
	 * @returns Serialized graph
	 */

	reduce(): SerializedGraph {
		return {
			id: this.id,
			name: this.trimmed_name,
			course: this.course_id,
			domains: this.domain_ids,
			subjects: this.subject_ids,
			lectures: this.lecture_ids,
			links: this.link_ids
		}
	}

	/**
	 * Save this graph
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Call API to save the graph
		await fetch(`/api/graph`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/graph PUT): ${error}`)
		})
	}

	/**
	 * Delete this graph, and all related domains, subjects, and lectures
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Unassign from course and links
		this.cache.find(CourseController, this.course_id)
			?.unassignGraph(this)

		for (const id of this.link_ids) {
			this.cache.find(LinkController, id)
				?.unassignGraph(false)
		}

		// Delete all related domains, subjects, and lectures
		const domains = await this.getDomains()
		await Promise.all(domains.map(domain => domain.delete()))

		const subjects = await this.getSubjects()
		await Promise.all(subjects.map(subject => subject.delete()))

		const lectures = await this.getLectures()
		await Promise.all(lectures.map(lecture => lecture.delete()))

		// Call API to delete the graph
		await fetch(`/api/graph/${this.id}`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/graph/${this.id} DELETE): ${error}`)
			})

		// Remove from cache
		this.cache.remove(this)
	}

	// --------------------> Validation

	/**
	 * Check if this graph has a name
	 * @returns Whether this graph has a name
	 */

	private hasName(): boolean {
		return this.trimmed_name !== ''
	}

	/**
	 * Check if this graph has a duplicate name
	 * @returns Whether this graph has a duplicate name
	 */

	private async duplicateName(): Promise<boolean> {
		const graphs = await this.getCourse()
			.then(course => course.getGraphs())

		return graphs.some(graph => graph.id !== this.id && graph.trimmed_name === this.trimmed_name)
	}

	/**
	 * Check if this graph has domains
	 * @returns Whether this graph has domains
	 */

	private hasDomains(): boolean {
		return this.domain_ids.length > 0
	}

	/**
	 * Check if this graph has subjects
	 * @returns Whether this graph has subjects
	 */

	private hasSubjects(): boolean {
		return this.subject_ids.length > 0
	}

	/**
	 * Check if this graph has lectures
	 * @returns Whether this graph has lectures
	 */

	private hasLectures(): boolean {
		return this.lecture_ids.length > 0
	}

	/**
	 * Validate this graph
	 * @returns Validation result
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		if (!this.hasName()) {
			validation.add({
				severity: Severity.error,
				short: 'Graph has no name',
				tab: 0,
				uuid: 'graph-name'
			})
		}

		else if (await this.duplicateName()) {
			validation.add({
				severity: Severity.error,
				short: 'Graph name is not unique',
				tab: 0,
				uuid: 'graph-name'
			})
		}

		if (!this.hasDomains()) {
			validation.add({
				severity: Severity.warning,
				short: 'Graph has no domains'
			})
		}

		if (!this.hasSubjects()) {
			validation.add({
				severity: Severity.warning,
				short: 'Graph has no subjects'
			})
		}

		if (!this.hasLectures()) {
			validation.add({
				severity: Severity.warning,
				short: 'Graph has no lectures'
			})
		}

		const [domains, subjects, lectures] = await Promise.all([this.getDomains(), this.getSubjects(), this.getLectures()])
		for (const domain of domains)
			validation.add(await domain.validate())
		for (const subject of subjects)
			validation.add(await subject.validate())
		for (const lecture of lectures) {
			validation.add(await lecture.validate())
		}

		return validation
	}

	// --------------------> Assignments

	/**
	 * Assign a course to this graph
	 * @param course Course to assign to the graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignCourse(course: CourseController, mirror: boolean = true): void {
		if (this._course_id === course.id) return

		// Unassign previous course
		if (this._course_id && mirror) {
			this.cache.find(CourseController, this._course_id)
				?.unassignGraph(this)
		}

		// Assign new course
		this._course_id = course.id
		this._course = course

		if (mirror) {
			course.assignGraph(this, false)
		}
	}

	/**
	 * Assign a domain to this graph
	 * @param domain Domain to assign to the graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignDomain(domain: DomainController, mirror: boolean = true): void {
		if (this._domain_ids.includes(domain.id)) return

		// Assign domain
		this._domain_ids.push(domain.id)
		this._domains?.push(domain)

		if (mirror) {
			domain.assignGraph(this, false)
		}
	}

	/**
	 *  Create and assign a domain relation to this graph
	 * @param parent Parent domain
	 * @param child Child domain
	 * @param mirror Whether to mirror the assignment
	 */

	createDomainRelation(parent: DomainController, child: DomainController, mirror: boolean = true): void {
		if (this._domain_relations?.some(relation => relation.parent?.id === parent.id && relation.child?.id === child.id)) return

		// Create relation
		const relation = new DomainRelationController(this, parent, child)
		this._domain_relations?.push(relation)

		// Mirror to parent and child
		if (mirror) {
			parent.assignChild(child, false)
			child.assignParent(parent, false)
		}
	}

	/**
	 * Assign a subject to this graph
	 * @param subject Subject to assign to the graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids.includes(subject.id)) return

		// Assign subject
		this._subject_ids.push(subject.id)
		this._subjects?.push(subject)

		if (mirror) {
			subject.assignGraph(this, false)
		}
	}

	/**
	 * Create and assign a subject relation to this graph
	 * @param parent Parent subject
	 * @param child Child subject
	 * @param mirror Whether to mirror the assignment
	 */

	createSubjectRelation(parent: SubjectController, child: SubjectController, mirror: boolean = true): void {
		if (this._subject_relations?.some(relation => relation.parent?.id === parent.id && relation.child?.id === child.id)) return

		// Create relation
		const relation = new SubjectRelationController(this, parent, child)
		this._subject_relations?.push(relation)

		// Mirror to parent and child
		if (mirror) {
			parent.assignChild(child, false)
			child.assignParent(parent, false)
		}
	}

	/**
	 * Assign a lecture to this graph
	 * @param lecture Lecture to assign to the graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignLecture(lecture: LectureController, mirror: boolean = true): void {
		if (this._lecture_ids.includes(lecture.id)) return

		// Assign lecture
		this._lecture_ids.push(lecture.id)
		this._lectures?.push(lecture)

		if (mirror) {
			lecture.assignGraph(this, false)
		}
	}

	/**
	 * Assign a link to this graph
	 * @param link Link to assign to the graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignLink(link: LinkController, mirror: boolean = true): void {
		if (this._links_ids.includes(link.id)) return

		// Assign link
		this._links_ids.push(link.id)
		this._links?.push(link)

		if (mirror) {
			link.assignGraph(this, false)
		}
	}

	/**
	 * Unassign a domain from this graph
	 * @param domain Domain to unassign from the graph
	 */

	unassignDomain(domain: DomainController): void {
		if (!this._domain_ids.includes(domain.id)) return

		// Unassign domain
		this._domain_ids = this._domain_ids.filter(id => id !== domain.id)
		this._domains = this._domains?.filter(known => known !== domain)
	}

	/**
	 * Unassign and delete a domain relation from this graph
	 * @param parent Parent domain of the relation
	 * @param child Child domain of the relation
	 * @param mirror Whether to mirror the unassignment
	 */

	deleteDomainRelation(parent: DomainController, child: DomainController, mirror: boolean = true): void {
		const relation = this._domain_relations?.find(relation => relation.parent?.id === parent.id && relation.child?.id === child.id)
		if (!relation) return

		// Unassign relation
		this._domain_relations = this._domain_relations?.filter(known => known !== relation)

		// Mirror to parent and child
		if (mirror) {
			parent.unassignChild(child, false)
			child.unassignParent(parent, false)
		}
	}

	/**
	 * Unassign a subject from this graph
	 * @param subject Subject to unassign from the graph
	 */

	unassignSubject(subject: SubjectController): void {
		if (!this._subject_ids.includes(subject.id)) return

		// Unassign subject
		this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(known => known !== subject)
	}

	/**
	 * Unassign and delete a subject relation from this graph
	 * @param parent Parent subject of the relation
	 * @param child Child subject of the relation
	 * @param mirror Whether to mirror the unassignment
	 */

	deleteSubjectRelation(parent: SubjectController, child: SubjectController, mirror: boolean = true): void {
		const relation = this._subject_relations?.find(relation => relation.parent?.id === parent.id && relation.child?.id === child.id)
		if (!relation) return

		// Unassign relation
		this._subject_relations = this._subject_relations?.filter(known => known !== relation)

		// Mirror to parent and child
		if (mirror) {
			parent.unassignChild(child, false)
			child.unassignParent(parent, false)
		}
	}

	/**
	 * Unassign a lecture from this graph
	 * @param lecture Lecture to unassign from the graph
	 */

	unassignLecture(lecture: LectureController): void {
		if (!this._lecture_ids.includes(lecture.id)) return

		// Unassign lecture
		this._lecture_ids = this._lecture_ids.filter(id => id !== lecture.id)
		this._lectures = this._lectures?.filter(known => known !== lecture)
	}

	/**
	 * Unassign a link from this graph
	 * @param link Link to unassign from the graph\
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignLink(link: LinkController, mirror: boolean = true): void {
		if (!this._links_ids.includes(link.id)) return

		// Unassign link
		this._links_ids = this._links_ids.filter(id => id !== link.id)
		this._links = this._links?.filter(known => known !== link)

		if (mirror) {
			link.unassignGraph(false)
		}
	}

	// --------------------> Utility

	/**
	 * Sort this graph
	 * @param option Sort option
	 * @throws `GraphError` if the sort option is invalid
	 */

	async sort(option: number): Promise<void> {
		let descending: boolean
		if (option & SortOption.descending) {
			descending = true
		} else if (option & SortOption.ascending) {
			descending = false
		} else {
			throw new Error('GraphError: Invalid sort option')
		}

		if (option & SortOption.relations) {
			if (option & SortOption.domains) {
				if (option & SortOption.index) {
					// Sort domain relations by index
				} else if (option & SortOption.parents) {
					// Sort domain relations by parents
				} else if (option & SortOption.children) {
					// Sort domain relations by children
				} else {
					throw new Error('GraphError: Invalid sort option')
				}
			} else if (option & SortOption.subjects) {
				if (option & SortOption.index) {
					// Sort subject relations by index
				} else if (option & SortOption.parents) {
					// Sort subject relations by parents
				} else if (option & SortOption.children) {
					// Sort subject relations by children
				} else {
					throw new Error('GraphError: Invalid sort option')
				}
			} else {
				throw new Error('GraphError: Invalid sort option')
			}
		} else {
			if (option & SortOption.subjects) {
				const subjects = await this.getSubjects()
				let comparable: { value: string, subject: SubjectController }[]

				// Sort subjects by index
				if (option & SortOption.index) {
					comparable = await Promise.all(
						subjects.map(async subject => ({
							value: String(await subject.getIndex()),
							subject
						}))
					)
				}

				// Sort subjects by name
				else if (option & SortOption.name) {
					comparable = subjects.map(subject => ({
						value: subject.trimmed_name,
						subject
					}))
				}

				// Sort subjects by domain
				else if (option & SortOption.domains) {
					comparable = await Promise.all(
						subjects.map(async subject => ({
							value: await subject.getDomain().then(domain => domain?.trimmed_name || ''),
							subject
						}))
					)
				}

				else {
					throw new Error('GraphError: Invalid sort option')
				}

				// Sort the subjects
				comparable.sort((a, b) => a.value.localeCompare(b.value))
				if (descending) comparable.reverse()
				this._subjects = comparable.map(pair => pair.subject)

			} else if (option & SortOption.domains) {
				const domains = await this.getDomains()
				let comparable: { value: string, domain: DomainController }[]

				// Sort domains by index
				if (option & SortOption.index) {
					comparable = await Promise.all(
						domains.map(async domain => ({
							value: String(await domain.getIndex()),
							domain
						}))
					)
				}

				// Sort domains by name
				else if (option & SortOption.name) {
					comparable = domains.map(domain => ({
						value: domain.trimmed_name,
						domain
					}))
				}

				// Sort domains by style
				else if (option & SortOption.style) {
					comparable = await Promise.all(
						domains.map(async domain => ({
							value: await domain.getStyle() || '',
							domain
						}))
					)
				}

				else {
					throw new Error('GraphError: Invalid sort option')
				}

				// Sort the domains
				comparable.sort((a, b) => a.value.localeCompare(b.value))
				if (descending) comparable.reverse()
				this._domains = comparable.map(pair => pair.domain)

			} else {
				throw new Error('GraphError: Invalid sort option')
			}
		}
	}
}