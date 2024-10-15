
// Internal dependencies
import {
	ControllerCache,
	GraphController,
	SubjectController
} from '$scripts/controllers'

import { ValidationData, Severity } from '$scripts/validation'

import type { SerializedLecture } from '$scripts/types'

// External dependencies
import * as uuid from 'uuid'

// Exports
export { LectureController }


// --------------------> Classes


class LectureController {
	private _graph?: GraphController
	private _subjects?: SubjectController[]

	uuid: string

	constructor(
		public environment: ControllerCache,
		public id: number,
		public name: string,
		private _graph_id: number,
		private _subject_ids: number[]
	) {
		this.uuid = uuid.v4()
		this.environment.add(this)
	}

	get subjects(): Promise<SubjectController[]> {
		return (async () => {
			if (this._subjects) return this._subjects
			this._subjects = await this.environment.getSubjects(this._subject_ids)
			return this._subjects
		})()
	}

	get graph(): Promise<GraphController> {
		return (async () => {
			if (this._graph) return this._graph
			this._graph = await this.environment.getGraph(this._graph_id) as GraphController
			return this._graph
		})()
	}

	get index(): Promise<number> {
		return this.graph.then(graph => graph.lectureIndex(this))
	}

	/**
	 * Create a new lecture
	 * @param environment Environment to create the lecture in
	 * @param graph Graph to assign the lecture to
	 * @returns `Promise<LectureController>` The newly created LectureController
	 * @throws `APIError` if the API call fails
	 */

	static async create(environment: ControllerCache, graph: GraphController): Promise<LectureController> {

		// Call API to create a new lecture
		const response = await fetch(`/api/lecture`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ graph: graph.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/lecture POST): ${error}`)
		})

		// Revive the lecture
		const data = await response.json()
		const lecture = LectureController.revive(environment, data)
		graph.assignLecture(lecture)

		return lecture
	}

	/**
	 * Revive a lecture from serialized data
	 * @param environment Environment to revive the lecture in
	 * @param data Serialized data to revive
	 * @returns `LectureController` The revived LectureController
	 */

	static revive(environment: ControllerCache, data: SerializedLecture): LectureController {
		return new LectureController(environment, data.id, data.name, data.graph, data.subjects)
	}

	/**
	 * Validate the lecture
	 * @returns `Promise<ValidationData>` Validation data
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		if (!this.hasName()) {
			validation.add({
				severity: Severity.error,
				short: 'Lecture has no name',
				tab: 3,
				uuid: this.uuid
			})
		}

		else {
			const original = await this.findOriginalName()
			if (original !== -1) {
				validation.add({
					severity: Severity.warning,
					short: 'Lecture name is already in use',
					long: `Name first used by Lecture nr. ${original + 1}`,
					tab: 3,
					uuid: this.uuid
				})
			}
		}

		if (!this.hasSubjects()) {
			validation.add({
				severity: Severity.warning,
				short: 'Lecture has no subjects',
				tab: 3,
				uuid: this.uuid
			})
		}

		return validation
	}

	/**
	 * Serialize the lecture
	 * @returns `SerializedLecture` Serialized lecture
	 */

	reduce(): SerializedLecture {
		return {
			id: this.id,
			name: this.name,
			graph: this._graph_id,
			subjects: this._subject_ids
		}
	}

	/**
	 * Save the lecture
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Call API to save the lecture
		await fetch(`/api/lecture`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/lecture PUT): ${error}`)
		})
	}

	/**
	 * Delete the lecture
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Call API to delete the lecture
		await fetch(`/api/lecture`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: this.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/lecture DELETE): ${error}`)
		})

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		const graph = await this.environment.getGraph(this._graph_id, false)
		graph?.unassignLecture(this)

		const subjects = await this.environment.getSubjects(this._subject_ids, false)
		subjects.forEach(subject => subject.unassignFromLecture(this, false))

		// Remove from environment
		this.environment.remove(this)
	}

	/**
	 * Check if the lecture has a name
	 * @returns `boolean` Whether the lecture has a name
	 */

	private hasName(): boolean {
		return this.name.trim() !== ''
	}

	/**
	 * Find the first occurrence of the lecture's name in the graph
	 * @returns `Promise<number>` Index of the original name in the graph, or -1 if the name is unique/nonexistant
	 */

	private async findOriginalName(): Promise<number> {
		const lectures = await this.graph.then(graph => graph.lectures)
		const first = lectures.findIndex(item => item.name === this.name)
		const second = lectures.indexOf(this, first + 1)

		return first < second ? lectures[first].index : -1
	}

	/**
	 * Check if the lecture has subjects
	 * @returns `boolean` Whether the lecture has subjects
	 */

	private hasSubjects(): boolean {
		return this._subject_ids.length > 0
	}

	/**
	 * Assign a subject to the lecture
	 * @param subject Subject to assign to the lecture
	 * @param mirror Whether to mirror the assignment
	 * @throws `LectureError` if the subject is already assigned to the lecture
	 */

	assignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids.includes(subject.id))
			throw new Error(`LectureError: Lecture is already assigned to Subject with ID ${subject.id}`)
		this._subject_ids.push(subject.id)
		this._subjects?.push(subject)

		if (mirror) {
			subject.assignToLecture(this, false)
		}
	}

	/**
	 * Unassign a subject from the lecture
	 * @param subject Subject to unassign from the lecture
	 * @param mirror Whether to mirror the unassignment
	 * @throws `LectureError` if the subject is not assigned to the lecture
	 */

	unassignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (!this._subject_ids.includes(subject.id))
			throw new Error(`LectureError: Lecture is not assigned to Subject with ID ${subject.id}`)
		this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(subject => subject.id !== subject.id)

		if (mirror) {
			subject.unassignFromLecture(this, false)
		}
	}
}