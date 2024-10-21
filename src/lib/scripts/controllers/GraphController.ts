
// External dependencies
import { browser } from '$app/environment'

// Internal dependencies
import {
	ControllerCache,
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
	private _subjects?: SubjectController[]
	private _lectures?: LectureController[]
	private _links?: LinkController[]

	constructor(
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

	get course_id(): number {
		return this._course_id
	}

	set course_id(value: number) {
		if (this._course_id === value) return

		// Unnasign
		this.cache.find(CourseController, this._course_id)
			?.unassignGraph(this)

		// Assign
		this._course_id = value
		this._course = this.cache.find(CourseController, value)
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
	 * @param cache Cache to create the graph in
	 * @param course Course to assign the graph to
	 * @returns `Promise<GraphController>` The newly created GraphController
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
	 * @param cache Cache to revive the graph in
	 * @param data Serialized data to revive
	 * @returns `GraphController` The revived GraphController
	 */

	static revive(cache: ControllerCache, data: SerializedGraph): GraphController {
		const graph = cache.find(GraphController, data.id)

		if (graph) return graph
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
		this.cache.find(CourseController, this._course_id)
			?.unassignGraph(this)

		for (const id of this._links_ids) {
			this.cache.find(LinkController, id)
				?.unassignFromGraph(false)
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
						value: subject.name,
						subject
					}))
				}

				// Sort subjects by domain
				else if (option & SortOption.domains) {
					comparable = await Promise.all(
						subjects.map(async subject => ({
							value: await subject.getDomain().then(domain => domain?.name || ''),
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
				let comparable: { value: any, domain: DomainController }[]

				// Sort domains by index
				if (option & SortOption.index) {
					comparable = await Promise.all(
						domains.map(async domain => ({
							value: await domain.getIndex(),
							domain
						}))
					)

					comparable.sort((a, b) => a.value - b.value)
				} 
				
				// Sort domains by name
				else if (option & SortOption.name) {
					comparable = domains.map(domain => ({
						value: domain.name,
						domain
					}))

					comparable.sort((a, b) => a.value.localeCompare(b.value))
				} 
				
				// Sort domains by style
				else if (option & SortOption.style) {
					comparable = await Promise.all(
						domains.map(async domain => ({
							value: await domain.getStyle() || '',
							domain
						}))
					)

					comparable.sort((a, b) => a.value.localeCompare(b.value))
				} 
				
				else {
					throw new Error('GraphError: Invalid sort option')
				}

				if (descending) comparable.reverse()
				this._domains = comparable.map(pair => pair.domain)
				console.log(this._domains)

			} else {
				throw new Error('GraphError: Invalid sort option')
			}
		}
	}

	/**
	 * Get the course this graph is assigned to
	 * @returns `Promise<CourseController>` The course this graph is assigned to
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
	 * Get the domains assigned to this graph
	 * @returns `Promise<DomainController[]>` The domains assigned to this graph
	 * @throws `APIError` if the API call fails
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

		// Call API to get the domain data
		const response = await fetch(`/api/graph/${this.id}/domains`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/graph/${this.id}/domains GET): ${error}`)
			})

		// Revive the domains
		const data = await response.json() as SerializedDomain[]
		this._domains = data.map(domain => DomainController.revive(this.cache, domain))

		return this._domains.concat()
	}

	/**
	 * Get the subjects assigned to this graph
	 * @returns `Promise<SubjectController[]>` The subjects assigned to this graph
	 * @throws `APIError` if the API call fails
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

		// Call API to get the subject data
		const response = await fetch(`/api/graph/${this.id}/subjects`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/graph/${this.id}/subjects GET): ${error}`)
			})

		// Revive the subjects
		const data = await response.json() as SerializedSubject[]
		this._subjects = data.map(subject => SubjectController.revive(this.cache, subject))

		return this._subjects.concat()
	}

	/**
	 * Get the lectures assigned to this graph
	 * @returns `Promise<LectureController[]>` The lectures assigned to this graph
	 * @throws `APIError` if the API call fails
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
		this._lectures = data.map(lecture => LectureController.revive(this.cache, lecture))

		return this._lectures.concat()
	}

	/**
	 * Get the links assigned to this graph
	 * @returns `Promise<LinkController[]>` The links assigned to this graph
	 * @throws `APIError` if the API call fails
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

		// Call API to get the link data
		const response = await fetch(`/api/graph/${this.id}/links`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/graph/${this.id}/links GET): ${error}`)
			})

		// Revive the links
		const data = await response.json() as SerializedLink[]
		this._links = data.map(link => LinkController.revive(this.cache, link))

		return this._links.concat()
	}

	/**
	 * Get the index of a domain in the graph
	 * @param domain Target domain
	 * @returns `number` The index of the domain in the graph
	 * @throws `Error` if the domain is not found in the graph
	 */

	domainIndex(domain: DomainController): number {
		const index = this._domain_ids.indexOf(domain.id)
		if (index === -1) throw new Error('GraphError: Domain not found in graph')
		return index
	}

	/**
	 * Get the index of a subject in the graph
	 * @param subject Target subject
	 * @returns `number` The index of the subject in the graph
	 * @throws `Error` if the subject is not found in the graph
	 */

	subjectIndex(subject: SubjectController): number {
		const index = this._subject_ids.indexOf(subject.id)
		if (index === -1) throw new Error('GraphError: Subject not found in graph')
		return index
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