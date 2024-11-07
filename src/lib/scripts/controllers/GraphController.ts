
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
	SerializedLink,
	DropdownOption
} from '$scripts/types'

// Exports
export { GraphController, SortOption }


// --------------------> Enums


enum SortOption {
	ascending  = 0b1000000000,
	descending = 0b0100000000,
	relation  = 0b0010000000,
	subject   = 0b0001000000,
	domain    = 0b0000100000,
	index      = 0b0000010000,
	name       = 0b0000001000,
	style      = 0b0000000100,
	parent    = 0b0000000010,
	child   = 0b0000000001
}


// --------------------> Controller


class GraphController {
	private _course?: CourseController
	private _pending_course?: Promise<CourseController>
	private _domains?: DomainController[]
	private _pending_domains?: Promise<DomainController[]>
	private _domain_relations: DomainRelationController[] = []
	private _subjects?: SubjectController[]
	private _pending_subjects?: Promise<SubjectController[]>
	private _subject_relations: SubjectRelationController[] = []
	private _lectures?: LectureController[]
	private _pending_lectures?: Promise<LectureController[]>
	private _links?: LinkController[]
	private _pending_links?: Promise<LinkController[]>

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

		// Check if course is pending
		if (this._pending_course !== undefined) {
			return await this._pending_course
		}

		// Check if course is known
		if (this._course !== undefined) {
			return this._course
		}

		// Get the course from the cache
		this._course = this.cache.find(CourseController, this.course_id)
		if (this._course !== undefined) {
			return this._course
		}

		// Call API to get the course data
		this._pending_course = this.cache
			.fetch(`/api/graph/${this.id}/course`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedCourse
					this._course = CourseController.revive(this.cache, data)
					this._pending_course = undefined
					return this._course
				},
				error => {
					this._pending_course = undefined
					throw new Error(`APIError (/api/graph/${this.id}/course GET): ${error}`)
				}
			)

		return await this._pending_course
	}

	/**
	 * Get the domains assigned to this graph, from the cache or the API
	 * @returns The domains assigned to this graph
	 * @throws `APIError` if the API call fails
	 */

	async getDomains(): Promise<DomainController[]> {

		// Check if domains are pending
		if (this._pending_domains !== undefined) {
			return await this._pending_domains
		}

		// Check if domains are known
		if (this._domains !== undefined) {
			return this._domains
		}

		// Check if domains are cached
		const cached = this._domain_ids.map(id => this.cache.find(DomainController, id))
		if (!cached.includes(undefined)) {
			this._domains = cached as DomainController[]
			return this._domains
		}

		// Call API to get the domain data
		this._pending_domains = this.cache
			.fetch(`/api/graph/${this.id}/domains`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedDomain[]
					this._domains = data.map(domain => DomainController.revive(this.cache, domain))
					this._domains.forEach((domain, index) => domain.index = index + 1)
					this._pending_domains = undefined
					return this._domains
				},
				error => {
					this._pending_domains = undefined
					throw new Error(`APIError (/api/graph/${this.id}/domains GET): ${error}`)
				}
			)

		return await this._pending_domains
	}

	/**
	 * Get the domain relations assigned to this graph
	 * @returns The domain relations assigned to this graph
	 */

	async getDomainRelations(): Promise<DomainRelationController[]> {
		const domains = await this.getDomains()
		for (const domain of domains) {
			const children = await domain.getChildren()
			for (const child of children) {
				if (!this._domain_relations.some(relation => relation.parent === domain && relation.child === child)) {
					DomainRelationController.create(this, domain, child)
				}
			}
		}

		return this._domain_relations
	}

	/**
	 * Get the subjects assigned to this graph, from the cache or the API
	 * @returns The subjects assigned to this graph
	 * @throws `APIError` if the API call fails
	 */

	async getSubjects(): Promise<SubjectController[]> {

		// Check if subjects are pending
		if (this._pending_subjects !== undefined) {
			return await this._pending_subjects
		}

		// Check if subjects are known
		if (this._subjects !== undefined) {
			return this._subjects
		}

		// Check if subjects are cached
		const cached = this._subject_ids.map(id => this.cache.find(SubjectController, id))
		if (!cached.includes(undefined)) {
			this._subjects = cached as SubjectController[]
			return this._subjects
		}

		// Call API to get the subject data
		this._pending_subjects = this.cache
			.fetch(`/api/graph/${this.id}/subjects`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedSubject[]
					this._subjects = data.map(subject => SubjectController.revive(this.cache, subject))
					this._subjects.forEach((subject, index) => subject.index = index + 1)
					this._pending_subjects = undefined
					return this._subjects
				},
				error => {
					this._pending_subjects = undefined
					throw new Error(`APIError (/api/graph/${this.id}/subjects GET): ${error}`)
				}
			)

		return await this._pending_subjects
	}

	/**
	 * Get the subject relations assigned to this graph
	 * @returns The subject relations assigned to this graph
	 */

	async getSubjectRelations(): Promise<SubjectRelationController[]> {
		const subjects = await this.getSubjects()
		for (const subject of subjects) {
			const children = await subject.getChildren()
			for (const child of children) {
				if (!this._subject_relations.some(relation => relation.parent === subject && relation.child === child)) {
					SubjectRelationController.create(this, subject, child)
				}
			}
		}

		return this._subject_relations
	}

	/**
	 * Get the lectures assigned to this graph, from the cache or the API
	 * @returns The lectures assigned to this graph
	 * @throws `APIError` if the API call fails
	 */

	async getLectures(): Promise<LectureController[]> {

		// Check if lectures are pending
		if (this._pending_lectures !== undefined) {
			return await this._pending_lectures
		}

		// Check if lectures are known
		if (this._lectures !== undefined) {
			return this._lectures
		}

		// Check if lectures are cached
		const cached = this._lecture_ids.map(id => this.cache.find(LectureController, id))
		if (!cached.includes(undefined)) {
			this._lectures = cached as LectureController[]
			return this._lectures
		}

		// Call API to get the lectures
		this._pending_lectures = this.cache
			.fetch(`/api/graph/${this.id}/lectures`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedLecture[]
					this._lectures = data.map(lecture => LectureController.revive(this.cache, lecture))
					this._pending_lectures = undefined
					return this._lectures
				},
				error => {
					this._pending_lectures = undefined
					throw new Error(`APIError (/api/graph/${this.id}/lectures GET): ${error}`)
				}
			)

		return await this._pending_lectures
	}

	/**
	 * Get the lectures assigned to this graph as dropdown options
	 * @returns The lectures assigned to this graph as dropdown options
	 */

	async getLectureOptions(): Promise<DropdownOption<LectureController>[]> {
		const lectures = await this.getLectures()
		return await Promise.all(
			lectures.map(async lecture => ({
				value: lecture,
				label: lecture.trimmed_name,
				validation: ValidationData.success()
			}))
		)
	}


	/**
	 * Get the links assigned to this graph, from the cache or the API
	 * @returns The links assigned to this graph
	 * @throws `APIError` if the API call fails
	 */

	async getLinks(): Promise<LinkController[]> {

		// Check if links are pending
		if (this._pending_links !== undefined) {
			return await this._pending_links
		}

		// Check if links are known
		if (this._links !== undefined) {
			return this._links
		}

		// Check if links are cached
		const cached = this._links_ids.map(id => this.cache.find(LinkController, id))
		if (!cached.includes(undefined)) {
			this._links = cached as LinkController[]
			return this._links
		}

		// Call API to get the link data
		this._pending_links = this.cache
			.fetch(`/api/graph/${this.id}/links`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedLink[]
					this._links = data.map(link => LinkController.revive(this.cache, link))
					this._pending_links = undefined
					return this._links
				},
				error => {
					this._pending_links = undefined
					throw new Error(`APIError (/api/graph/${this.id}/links GET): ${error}`)
				}
			)

		return await this._pending_links
	}

	// --------------------> API actions

	/**
	 * Create a new graph
	 * @param cache Cache to create the graph with
	 * @param course_id Course to assign the graph to
	 * @returns The newly created GraphController
	 * @throws `APIError` if the API call fails
	 */

	static async create(cache: ControllerCache, course_id: number, name: string): Promise<GraphController> {

		// Call API to create a new graph
		const response = await cache.fetch(`/api/graph`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ course: course_id, name })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/graph POST): ${error}`)
		})

		// Revive the graph
		const data = await response.json()
		const graph = GraphController.revive(cache, data)

		// Assign to course
		cache.find(CourseController, course_id)
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

		// Call API to save the graph
		await this.cache.fetch(`/api/graph`, {
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
		await this.cache.fetch(`/api/graph/${this.id}`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/graph/${this.id} DELETE): ${error}`)
			})

		// Remove from cache
		this.cache.remove(this)
	}

	/**
	 * Copy this graph and all its members to another course
	 */

	async copy(target_course: CourseController): Promise<GraphController> {
		const course = await this.getCourse()

		// Copy the graph
		const graph_copy = await GraphController.create(this.cache, target_course.id, this.name)
		graph_copy.name = `${this.name} (Copied from ${course.code})`

		// Copy domains
		const domain_map = new Map<number, DomainController>()
		const domains = await this.getDomains()
		for (const domain of domains) {
			const domain_copy = await domain.copy(graph_copy)
			domain_map.set(domain.id, domain_copy)
		}

		// Copy domain relations
		const domain_relations = await this.getDomainRelations()
		for (const relation of domain_relations) {

			// Find the parent and child in the map
			if (!relation.parent || !relation.child) continue
			const parent_copy = domain_map.get(relation.parent.id)
			const child_copy = domain_map.get(relation.child.id)

			// Create the relation
			if (!parent_copy || !child_copy) throw new Error('GraphError: Domain not found in map')
			DomainRelationController.create(graph_copy, parent_copy, child_copy)
		}

		// Copy subjects
		const subject_map = new Map<number, SubjectController>()
		const subjects = await this.getSubjects()
		for (const subject of subjects) {
			const subject_copy = await subject.copy(graph_copy)
			subject_map.set(subject.id, subject_copy)

			// Assign the copied domain to the copied subject
			if (!subject.domain_id) continue
			const domain_copy = domain_map.get(subject.domain_id)
			if (!domain_copy) throw new Error('GraphError: Domain not found in map')
			subject_copy.assignDomain(domain_copy)

		}

		// Copy subject relations
		const subject_relations = await this.getSubjectRelations()
		for (const relation of subject_relations) {

			// Find the parent and child in the map
			if (!relation.parent || !relation.child) continue
			const parent_copy = subject_map.get(relation.parent.id)
			const child_copy = subject_map.get(relation.child.id)

			// Create the relation
			if (!parent_copy || !child_copy) throw new Error('GraphError: Subject not found in map')
			SubjectRelationController.create(graph_copy, parent_copy, child_copy)
		}

		// Copy lectures
		const lectures = await this.getLectures()
		for (const lecture of lectures) {
			const lecture_copy = await lecture.copy(graph_copy)

			// Assign the copied subjects to the copied lecture
			const subjects = await lecture.getSubjects()
			for (const subject of subjects) {
				const subject_copy = subject_map.get(subject.id)
				if (!subject_copy) throw new Error('GraphError: Subject not found in map')
				lecture_copy.assignSubject(subject_copy)
			}
		}

		await graph_copy.save()
		return graph_copy
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

		const [
			domains,
			domain_relations,
			subjects,
			subject_relations,
			lectures
		] = await Promise.all([
			this.getDomains(),
			this.getDomainRelations(),
			this.getSubjects(),
			this.getSubjectRelations(),
			this.getLectures()
		])

		for (const domain of domains)
			validation.add(await domain.validate())
		for (const relation of domain_relations)
			validation.add(await relation.validate())
		for (const subject of subjects)
			validation.add(await subject.validate())
		for (const relation of subject_relations)
			validation.add(await relation.validate())
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
		if (this._domains) {
			this._domains.push(domain)
			domain.index = this._domains.length
		}

		if (mirror) {
			domain.assignGraph(this, false)
		}
	}

	/**
	 * Assign a domain relation to this graph
	 * @param relation Domain relation to assign to the graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignDomainRelation(relation: DomainRelationController, mirror: boolean = true): void {
		if (this._domain_relations.includes(relation)) return

		// Assign domain relation
		this._domain_relations.push(relation)
		relation.index = this._domain_relations.length

		if (mirror) {
			relation.assignGraph(this, false)
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
		if (this._subjects) {
			this._subjects.push(subject)
			subject.index = this._subjects.length
		}

		if (mirror) {
			subject.assignGraph(this, false)
		}
	}

	/**
	 * Assign a subject relation to this graph
	 * @param relation Subject relation to assign to the graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignSubjectRelation(relation: SubjectRelationController, mirror: boolean = true): void {
		if (this._subject_relations.includes(relation)) return

		// Assign subject relation
		this._subject_relations.push(relation)
		relation.index = this._subject_relations.length

		if (mirror) {
			relation.assignGraph(this, false)
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

		// Shift domain indices
		this._domains?.forEach(other => {
			if (other.index > domain.index) {
				other.index--
			}
		})

		// Unassign domain
		this._domain_ids = this._domain_ids.filter(id => id !== domain.id)
		this._domains = this._domains?.filter(known => known !== domain)
	}

	/**
	 * Unassign a domain relation from this graph
	 * @param relation Domain relation to unassign from the graph
	 */

	unassignDomainRelation(relation: DomainRelationController): void {
		if (!this._domain_relations.includes(relation)) return

		// Shift relation indices
		this._domain_relations.forEach(other => {
			if (other.index > relation.index) {
				other.index--
			}
		})

		// Unassign domain relation
		this._domain_relations = this._domain_relations.filter(known => known !== relation)
	}

	/**
	 * Unassign a subject from this graph
	 * @param subject Subject to unassign from the graph
	 */

	unassignSubject(subject: SubjectController): void {
		if (!this._subject_ids.includes(subject.id)) return

		// Shift subject indices
		this._subjects?.forEach(other => {
			if (other.index > subject.index) {
				other.index--
			}
		})

		// Unassign subject
		this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(known => known !== subject)
	}

	/**
	 * Unassign a subject relation from this graph
	 * @param relation Subject relation to unassign from the graph
	 */

	unassignSubjectRelation(relation: SubjectRelationController): void {
		if (!this._subject_relations.includes(relation)) return

		// Shift relation indices
		this._subject_relations.forEach(other => {
			if (other.index > relation.index) {
				other.index--
			}
		})

		// Unassign subject relation
		this._subject_relations = this._subject_relations.filter(known => known !== relation)
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

		if (option & SortOption.relation) {
			if (option & SortOption.domain) {
				if (option & SortOption.index) {
					// Sort domain relations by index
				} else if (option & SortOption.parent) {
					// Sort domain relations by parents
				} else if (option & SortOption.child) {
					// Sort domain relations by children
				} else {
					throw new Error('GraphError: Invalid sort option')
				}
			} else if (option & SortOption.subject) {
				if (option & SortOption.index) {
					// Sort subject relations by index
				} else if (option & SortOption.parent) {
					// Sort subject relations by parents
				} else if (option & SortOption.child) {
					// Sort subject relations by children
				} else {
					throw new Error('GraphError: Invalid sort option')
				}
			} else {
				throw new Error('GraphError: Invalid sort option')
			}
		} else {
			if (option & SortOption.subject) {
				const subjects = await this.getSubjects()
				let comparable: { value: string | number, subject: SubjectController }[]

				// Sort subjects by index
				if (option & SortOption.index) {
					comparable = await Promise.all(
						subjects.map(async subject => ({
							value: subject.index,
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
				else if (option & SortOption.domain) {
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
				if (comparable.some(pair => typeof pair.value === 'number')) {
					comparable.sort((a, b) => (a.value as number) - (b.value as number))
				} else {
					comparable.sort((a, b) => (a.value as string).localeCompare(b.value as string))
				}

				if (descending) comparable.reverse()
				this._subjects = comparable.map(pair => pair.subject)

			} else if (option & SortOption.domain) {
				const domains = await this.getDomains()
				let comparable: { value: string | number, domain: DomainController }[]

				// Sort domains by index
				if (option & SortOption.index) {
					comparable = await Promise.all(
						domains.map(async domain => ({
							value: domain.index,
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
				if (comparable.some(pair => typeof pair.value === 'number')) {
					comparable.sort((a, b) => (a.value as number) - (b.value as number))
				} else {
					comparable.sort((a, b) => (a.value as string).localeCompare(b.value as string))
				}

				if (descending) comparable.reverse()
				this._domains = comparable.map(pair => pair.domain)

			} else {
				throw new Error('GraphError: Invalid sort option')
			}
		}
	}
}