
// Internal dependencies
import {
	ControllerEnvironment,
	CourseController,
	DomainController,
	SubjectController,
	LectureController
} from '$scripts/controllers'

import { ValidationData, Severity } from '$scripts/validation'

import type { SerializedGraph, DropdownOption } from '$scripts/types'

// Exports
export { GraphController }


// --------------------> Controller


class GraphController {
	private _course?: CourseController
	private _domains?: DomainController[]
	private _subjects?: SubjectController[]
	private _lectures?: LectureController[]

	constructor(
		public environment: ControllerEnvironment,
		public id: number,
		public name: string,
		private _course_id: number,
		private _domain_ids: number[],
		private _subject_ids: number[],
		private _lecture_ids: number[]
	) {
		this.environment.add(this)
	}

	get course(): Promise<CourseController> {
		return (async () => {
			if (this._course) return this._course
			this._course = await this.environment.getCourse(this._course_id) as CourseController
			return this._course
		})()
	}

	get domains(): Promise<DomainController[]> {
		return (async () => {
			if (this._domains) return this._domains
			this._domains = await this.environment.getDomains(this._domain_ids)
			return this._domains
		})()
	}

	get subjects(): Promise<SubjectController[]> {
		return (async () => {
			if (this._subjects) return this._subjects
			this._subjects = await this.environment.getSubjects(this._subject_ids)
			return this._subjects
		})()
	}

	get lectures(): Promise<LectureController[]> {
		return (async () => {
			if (this._lectures) return this._lectures
			this._lectures = await this.environment.getLectures(this._lecture_ids)
			return this._lectures
		})()
	}

	get lecture_options(): Promise<DropdownOption<LectureController>[]> {
		return (async () => {
			const lectures = await this.lectures
			return Promise.all(
				lectures.map(
					async lecture => ({
						value: lecture,
						label: lecture.name,
						validation: await lecture.validate()
					})
				)
			)
		})()
	}

	get index(): Promise<number> {
		return this.course.then(course => course.graphIndex(this))
	}

	/**
	 * Create a new graph
	 * @param environment Environment to create the graph in
	 * @param course Course to assign the graph to
	 * @returns `Promise<GraphController>` The newly created GraphController
	 * @throws `APIError` if the API call fails
	 */

	static async create(environment: ControllerEnvironment, course: CourseController): Promise<GraphController> {

		// Call API to create a new graph
		const response = await fetch(`/api/graph`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ course: course.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/graph POST): ${error}`)
		})

		// Revive the graph
		const data = await response.json()
		const graph = GraphController.revive(environment, data)
		course.assignGraph(graph)

		return graph
	}

	/**
	 * Revive a graph from serialized data
	 * @param environment Environment to revive the graph in
	 * @param data Serialized data to revive
	 * @returns `GraphController` The revived GraphController
	 */

	static revive(environment: ControllerEnvironment, data: SerializedGraph): GraphController {
		return new GraphController(environment, data.id, data.name, data.course, data.domains, data.subjects, data.lectures)
	}

	/**
	 * Validate the graph
	 * @returns `Promise<ValidationData>` Validation data
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
		} else {

			const original = await this.findOriginalName()
			if (original !== -1) {
				validation.add({
					severity: Severity.error,
					short: 'Graph name is not unique',
					long: `Name first used by Graph nr. ${original + 1}`,
					tab: 0,
					uuid: 'graph-name'
				})
			}
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

		const [domains, subjects, lectures] = await Promise.all([this.domains, this.subjects, this.lectures])
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
			name: this.name,
			course: this._course_id,
			domains: this._domain_ids,
			subjects: this._subject_ids,
			lectures: this._lecture_ids
		}
	}

	/**
	 * Save the graph
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

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
		
		// Call API to delete the graph
		await fetch(`/api/graph`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: this.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/graph DELETE): ${error}`)
		})

		// Unassign from course
		const course = await this.environment.getCourse(this._course_id, false)
		course?.unassignGraph(this)

		// Delete all related domains, subjects, and lectures
		const domains = await this.domains
		await Promise.all(domains.map(domain => domain.delete()))

		const subjects = await this.subjects
		await Promise.all(subjects.map(subject => subject.delete()))

		const lectures = await this.lectures
		await Promise.all(lectures.map(lecture => lecture.delete()))

		// Remove from environment
		this.environment.remove(this)
	}

	/**
	 * Check if the graph has a name
	 * @returns `boolean` Whether the graph has a name
	 */

	private hasName(): boolean {
		return this.name.trim() !== ''
	}

	/**
	 * Find the first occurrence of the graph's name in the course
	 * @returns `Promise<number>` Index of the original name in the course, or -1 if the name is unique/nonexistant
	 */

	private async findOriginalName(): Promise<number> {
		const graphs = await this.course.then(course => course.graphs)
		const first = graphs.findIndex(graph => graph.name === this.name)
		const second = graphs.indexOf(this, first + 1)

		return first < second ? graphs[first].index : -1
	}

	/**
	 * Check if the graph has domains
	 * @returns `boolean` Whether the graph has domains
	 */

	private hasDomains(): boolean {
		return this._domain_ids.length > 0
	}

	/**
	 * Check if the graph has subjects
	 * @returns `boolean` Whether the graph has subjects
	 */

	private hasSubjects(): boolean {
		return this._subject_ids.length > 0
	}

	/**
	 * Check if the graph has lectures
	 * @returns `boolean` Whether the graph has lectures
	 */

	private hasLectures(): boolean {
		return this._lecture_ids.length > 0
	}

	/**
	 * Get the index of a domain in the graph
	 * @param domain Domain to get the index of
	 * @returns `number` Index of the domain in the graph
	 * @throws `GraphError` if the domain is not assigned to the graph
	 */

	domainIndex(domain: DomainController): number {
		const index = this._domain_ids.indexOf(domain.id)
		if (index === -1) throw new Error(`GraphError: Domain with ID ${domain.id} is not assigned to Graph`)
		return index
	}

	/**
	 * Get the index of a subject in the graph
	 * @param subject Subject to get the index of
	 * @returns `number` Index of the subject in the graph
	 * @throws `GraphError` if the subject is not assigned to the graph
	 */

	subjectIndex(subject: SubjectController): number {
		const index = this._subject_ids.indexOf(subject.id)
		if (index === -1) throw new Error(`GraphError: Subject with ID ${subject.id} is not assigned to Graph`)
		return index
	}

	/**
	 * Get the index of a lecture in the graph
	 * @param lecture Lecture to get the index of
	 * @returns `number` Index of the lecture in the graph
	 * @throws `GraphError` if the lecture is not assigned to the graph
	 */

	lectureIndex(lecture: LectureController): number {
		const index = this._lecture_ids.indexOf(lecture.id)
		if (index === -1) throw new Error(`GraphError: Lecture with ID ${lecture.id} is not assigned to Graph`)
		return index
	}

	/**
	 * Assign a domain to the graph
	 * @param domain Domain to assign to the graph
	 * @throws `GraphError` if the domain is already assigned to the graph
	 */

	assignDomain(domain: DomainController): void {
		if (this._domain_ids.includes(domain.id))
			throw new Error(`GraphError: Graph is already assigned to Domain with ID ${domain.id}`)
		this._domain_ids.push(domain.id)
		this._domains?.push(domain)
	}

	/**
	 * Assign a subject to the graph
	 * @param subject Subject to assign to the graph
	 * @throws `GraphError` if the subject is already assigned to the graph
	 */

	assignSubject(subject: SubjectController): void {
		if (this._subject_ids.includes(subject.id))
			throw new Error(`GraphError: Graph is already assigned to Subject with ID ${subject.id}`)
		this._subject_ids.push(subject.id)
		this._subjects?.push(subject)
	}

	/**
	 * Assign a lecture to the graph
	 * @param lecture Lecture to assign to the graph
	 * @throws `GraphError` if the lecture is already assigned to the graph
	 */

	assignLecture(lecture: LectureController): void {
		if (this._lecture_ids.includes(lecture.id))
			throw new Error(`GraphError: Graph is already assigned to Lecture with ID ${lecture.id}`)
		this._lecture_ids.push(lecture.id)
		this._lectures?.push(lecture)
	}

	/**
	 * Unassign a domain from the graph
	 * @param domain Domain to unassign from the graph
	 * @throws `GraphError` if the domain is not assigned to the graph
	 */

	unassignDomain(domain: DomainController): void {
		if (!this._domain_ids.includes(domain.id))
			throw new Error(`GraphError: Graph is not assigned to Domain with ID ${domain.id}`)
		this._domain_ids = this._domain_ids.filter(id => id !== domain.id)
		this._domains = this._domains?.filter(domain => domain.id !== domain.id)
	}

	/**
	 * Unassign a subject from the graph
	 * @param subject Subject to unassign from the graph
	 * @throws `GraphError` if the subject is not assigned to the graph
	 */

	unassignSubject(subject: SubjectController): void {
		if (!this._subject_ids.includes(subject.id))
			throw new Error(`GraphError: Graph is not assigned to Subject with ID ${subject.id}`)
		this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(subject => subject.id !== subject.id)
	}

	/**
	 * Unassign a lecture from the graph
	 * @param lecture Lecture to unassign from the graph
	 * @throws `GraphError` if the lecture is not assigned to the graph
	 */

	unassignLecture(lecture: LectureController): void {
		if (!this._lecture_ids.includes(lecture.id))
			throw new Error(`GraphError: Graph is not assigned to Lecture with ID ${lecture.id}`)
		this._lecture_ids = this._lecture_ids.filter(id => id !== lecture.id)
		this._lectures = this._lectures?.filter(lecture => lecture.id !== lecture.id)
	}
}