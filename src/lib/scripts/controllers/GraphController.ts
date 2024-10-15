
// External dependencies
import { browser } from '$app/environment'

// Internal dependencies
import {
	ControllerEnvironment,
	CourseController,
	DomainController,
	SubjectController,
	LectureController,
	LinkController
} from '$scripts/controllers'

import { ValidationData, Severity } from '$scripts/validation'
import type {
	SerializedGraph,
	SerializedDomain,
	SerializedCourse,
	SerializedSubject,
	SerializedLecture,
	SerializedLink
} from '$scripts/types'

// Exports
export { GraphController }


// --------------------> Controller


class GraphController {
	private _course?: CourseController
	private _domains?: DomainController[]
	private _subjects?: SubjectController[]
	private _lectures?: LectureController[]
	private _links?: LinkController[]

	constructor(
		public environment: ControllerEnvironment,
		public id: number,
		public name: string,
		private _course_id: number,
		private _domain_ids: number[],
		private _subject_ids: number[],
		private _lecture_ids: number[],
		private _links_ids: number[]
	) {
		this.environment.remember(this)
	}

	get course_id(): number {
		return this._course_id
	}

	set course_id(value: number) {
		if (this._course_id === value) return

		// Unnasign
		this.environment.courses
			.find(course => course.id === this._course_id)
			?.unassignGraph(this)

		// Assign
		this._course_id = value
		this._course = this.environment.courses
			.find(course => course.id === value)
		this._course?.assignGraph(this, false)
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

	/**
	 * Create a new graph
	 * @param environment Environment to create the graph in
	 * @param course Course to assign the graph to
	 * @returns `Promise<GraphController>` The newly created GraphController
	 * @throws `APIError` if the API call fails
	 */

	static async create(environment: ControllerEnvironment, course: number, name: string): Promise<GraphController> {

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
		const graph = GraphController.revive(environment, data)

		// Assign to course
		environment.courses
			.find(course => course.id === graph._course_id)
			?.assignGraph(graph)

		return graph
	}

	/**
	 * Revive a graph from serialized data
	 * @param environment Environment to revive the graph in
	 * @param data Serialized data to revive
	 * @returns `GraphController` The revived GraphController
	 */

	static revive(environment: ControllerEnvironment, data: SerializedGraph): GraphController {
		return new GraphController(
			environment,
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
	 * Validate the graph
	 * @returns `Promise<ValidationData>` Validation data
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		if (this.name.trim() === '') {
			validation.add({
				severity: Severity.error,
				short: 'Graph has no name',
				tab: 0,
				uuid: 'graph-name'
			})
		} else {

			const graphs = await this.getCourse().then(course => course.getGraphs())
			if (graphs.some(graph => graph.id !== this.id && graph.name === this.name)) {
				validation.add({
					severity: Severity.error,
					short: 'Graph name is not unique',
					tab: 0,
					uuid: 'graph-name'
				})
			}
		}

		if (this._domain_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Graph has no domains'
			})
		}

		if (this._subject_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Graph has no subjects'
			})
		}

		if (this._lecture_ids.length === 0) {
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

	/**
	 * Serialize the graph
	 * @returns `SerializedGraph` Serialized graph
	 */

	reduce(): SerializedGraph {
		return {
			id: this.id,
			name: this.name.trim(),
			course: this._course_id,
			domains: this._domain_ids,
			subjects: this._subject_ids,
			lectures: this._lecture_ids,
			links: this._links_ids
		}
	}

	/**
	 * Save the graph
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
	 * Delete the graph, and all related domains, subjects, and lectures
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Unassign from course and links
		this.environment.courses
			.find(course => course.id === this._course_id)
			?.unassignGraph(this)

		this.environment.links
			.filter(link => link.graph_id === this.id)
			.forEach(link => link.unassignFromGraph(false))

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

		// Remove from environment
		this.environment.forget(this)
	}

	/**
	 * Get the course this graph is assigned to
	 * @returns `Promise<CourseController>` The course this graph is assigned to
	 * @throws `APIError` if the API call fails
	 * @throws `GraphError` if the course is not in sync with the server
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

		// Call API to get the course
		const response = await fetch(`/api/course/${this._course_id}`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/course/${this._course_id} GET): ${error}`)
			})

		// Parse the data
		const data = await response.json() as SerializedCourse
		this._course = this.environment.get(data)

		// Check if client and server are in sync
		if (this._course.id !== this._course_id) {
			throw new Error('GraphError: Course is not in sync with server')
		}

		return this._course
	}

	/**
	 * Get the domains assigned to this graph
	 * @returns `Promise<DomainController[]>` The domains assigned to this graph
	 * @throws `APIError` if the API call fails
	 * @throws `GraphError` if the domains are not in sync with the server
	 */

	async getDomains(): Promise<DomainController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if domains are already loaded
		if (this._domains) {
			return this._domains.concat()
		}

		// Call API to get the domains
		const response = await fetch(`/api/graph/${this.id}/domains`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/graph/${this.id}/domains GET): ${error}`)
			})

		// Parse the data
		const data = await response.json() as SerializedDomain[]
		this._domains = data.map(domain => this.environment.get(domain))

		// Check if client and server are in sync
		const client = JSON.stringify(this._domains.map(domain => domain.id).sort())
		const server = JSON.stringify(this._domain_ids.concat().sort())
		if (client !== server) {
			throw new Error('GraphError: Domains are not in sync with server')
		}

		return this._domains.concat()
	}

	/**
	 * Get the subjects assigned to this graph
	 * @returns `Promise<SubjectController[]>` The subjects assigned to this graph
	 * @throws `APIError` if the API call fails
	 * @throws `GraphError` if the subjects are not in sync with the server
	 */

	async getSubjects(): Promise<SubjectController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if subjects are already loaded
		if (this._subjects) {
			return this._subjects.concat()
		}

		// Call API to get the subjects
		const response = await fetch(`/api/graph/${this.id}/subjects`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/graph/${this.id}/subjects GET): ${error}`)
			})

		// Parse the data
		const data = await response.json() as SerializedSubject[]
		this._subjects = data.map(subject => this.environment.get(subject))

		// Check if client and server are in sync
		const client = JSON.stringify(this._subjects.map(subject => subject.id).sort())
		const server = JSON.stringify(this._subject_ids.concat().sort())
		if (client !== server) {
			throw new Error('GraphError: Subjects are not in sync with server')
		}

		return this._subjects.concat()
	}

	/**
	 * Get the lectures assigned to this graph
	 * @returns `Promise<LectureController[]>` The lectures assigned to this graph
	 * @throws `APIError` if the API call fails
	 * @throws `GraphError` if the lectures are not in sync with the server
	 */

	async getLectures(): Promise<LectureController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if lectures are already loaded
		if (this._lectures) {
			return this._lectures.concat()
		}

		// Call API to get the lectures
		const response = await fetch(`/api/graph/${this.id}/lectures`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/graph/${this.id}/lectures GET): ${error}`)
			})

		// Parse the data
		const data = await response.json() as SerializedLecture[]
		this._lectures = data.map(lecture => this.environment.get(lecture))

		// Check if client and server are in sync
		const client = JSON.stringify(this._lectures.map(lecture => lecture.id).sort())
		const server = JSON.stringify(this._lecture_ids.concat().sort())
		if (client !== server) {
			throw new Error('GraphError: Lectures are not in sync with server')
		}

		return this._lectures.concat()
	}

	/**
	 * Get the links assigned to this graph
	 * @returns `Promise<LinkController[]>` The links assigned to this graph
	 * @throws `APIError` if the API call fails
	 * @throws `GraphError` if the links are not in sync with the server
	 */

	async getLinks(): Promise<LinkController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if links are already loaded
		if (this._links) {
			return this._links.concat()
		}

		// Call API to get the links
		const response = await fetch(`/api/graph/${this.id}/links`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/graph/${this.id}/links GET): ${error}`)
			})

		// Parse the data
		const data = await response.json() as SerializedLink[]
		this._links = data.map(link => this.environment.get(link))

		// Check if client and server are in sync
		const client = JSON.stringify(this._links.map(link => link.id).sort())
		const server = JSON.stringify(this._links_ids.concat().sort())
		if (client !== server) {
			throw new Error('GraphError: Links are not in sync with server')
		}

		return this._links.concat()
	}

	/**
	 * Assign a course to this graph
	 * @param course Target course
	 * @param mirror Whether to mirror the assignment
	 */

	assignToCourse(course: CourseController, mirror: boolean = true): void {
		if (this._course_id === course.id) return
		this._course_id = course.id
		this._course = course

		if (mirror) {
			course.assignGraph(this, false)
		}
	}

	/**
	 * Assign a domain to this graph
	 * @param domain Target domain
	 * @param mirror Whether to mirror the assignment
	 */

	assignDomain(domain: DomainController, mirror: boolean = true): void {
		if (this._domain_ids.includes(domain.id)) return
		this._domain_ids.push(domain.id)
		this._domains?.push(domain)

		if (mirror) {
			domain.assignToGraph(this, false)
		}
	}

	/**
	 * Assign a subject to this graph
	 * @param subject Target subject
	 * @param mirror Whether to mirror the assignment
	 */

	assignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids.includes(subject.id)) return
		this._subject_ids.push(subject.id)
		this._subjects?.push(subject)

		if (mirror) {
			subject.assignToGraph(this, false)
		}
	}

	/**
	 * Assign a lecture to this graph
	 * @param lecture Target lecture
	 * @param mirror Whether to mirror the assignment
	 */

	assignLecture(lecture: LectureController, mirror: boolean = true): void {
		if (this._lecture_ids.includes(lecture.id)) return
		this._lecture_ids.push(lecture.id)
		this._lectures?.push(lecture)

		if (mirror) {
			lecture.assignToGraph(this, false)
		}
	}

	/**
	 * Assign a link to this graph
	 * @param link Target link
	 * @param mirror Whether to mirror the assignment
	 */

	assignLink(link: LinkController, mirror: boolean = true): void {
		if (this._links_ids.includes(link.id)) return
		this._links_ids.push(link.id)
		this._links?.push(link)

		if (mirror) {
			link.assignToGraph(this, false)
		}
	}

	/**
	 * Unassign a domain from this graph
	 * @param domain Target domain
	 */

	unassignDomain(domain: DomainController): void {
		if (!this._domain_ids.includes(domain.id)) return
		this._domain_ids = this._domain_ids.filter(id => id !== domain.id)
		this._domains = this._domains?.filter(known => known.id !== domain.id)
	}

	/**
	 * Unassign a subject from this graph
	 * @param subject Target subject
	 */

	unassignSubject(subject: SubjectController): void {
		if (!this._subject_ids.includes(subject.id)) return
		this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(known => known.id !== subject.id)
	}

	/**
	 * Unassign a lecture from this graph
	 * @param lecture Target lecture
	 */

	unassignLecture(lecture: LectureController): void {
		if (!this._lecture_ids.includes(lecture.id)) return
		this._lecture_ids = this._lecture_ids.filter(id => id !== lecture.id)
		this._lectures = this._lectures?.filter(known => known.id !== lecture.id)
	}

	/**
	 * Unassign a link from this graph
	 * @param link Target link
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignLink(link: LinkController, mirror: boolean = true): void {
		if (!this._links_ids.includes(link.id)) return
		this._links_ids = this._links_ids.filter(id => id !== link.id)
		this._links = this._links?.filter(known => known.id !== link.id)

		if (mirror) {
			link.unassignFromGraph(false)
		}
	}
}