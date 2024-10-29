
// External dependencies
import * as uuid from 'uuid'
import { browser } from '$app/environment'

// Internal dependencies
import { ValidationData, Severity } from '$scripts/validation'

import {
	ControllerCache,
	GraphController,
	SubjectController
} from '$scripts/controllers'

import type {
	SerializedLecture,
	SerializedSubject,
	SerializedGraph
} from '$scripts/types'
import type { Graph } from '@prisma/client'

// Exports
export { LectureController }


// --------------------> Classes


class LectureController {
	private _graph?: GraphController
	private _subjects?: SubjectController[]

	uuid: string

	constructor(
		public cache: ControllerCache,
		public id: number,
		public name: string,
		private _graph_id: number,
		private _subject_ids: number[]
	) {
		this.uuid = uuid.v4()
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	get trimmed_name(): string {
		return this.name.trim()
	}

	get graph_id(): number {
		return this._graph_id
	}

	set graph_id(id: number) {

		// Unassign previous graph
		this.cache.find(GraphController, this._graph_id)
			?.unassignLecture(this)

		// Assign new graph
		this._graph_id = id
		this._graph = undefined

		this.cache.find(GraphController, this._graph_id)
			?.assignLecture(this, false)
	}

	get subject_ids(): number[] {
		return Array.from(this._subject_ids)
	}

	// --------------------> API Getters

	/**
	 * Get the graph associated to this lecture
	 * @returns The associated graph
	 * @throws `APIError` if the API call fails
	 */

	async getGraph(): Promise<GraphController> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if the graph is already loaded
		if (this._graph) {
			return this._graph
		}

		// Call API to fetch the course data
		const response = await fetch(`/api/lecture/${this.id}/graph`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/lecture/${this.id}/graph GET): ${error}`)
			})

		// Revive the course
		const data = await response.json() as SerializedGraph
		this._graph = GraphController.revive(this.cache, data)

		return this._graph
	}

	/**
	 * Get the subjects associated to this lecture
	 * @returns The associated subjects
	 * @throws `APIError` if the API
	 */

	async getSubjects(): Promise<SubjectController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if the subjects are already loaded
		if (this._subjects) {
			return Array.from(this._subjects)
		}

		// Call API to fetch the subjects data
		const response = await fetch(`/api/lecture/${this.id}/subjects`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/lecture/${this.id}/subjects GET): ${error}`)
			})

		// Revive the subjects
		const data = await response.json() as SerializedSubject[]
		this._subjects = data.map(item => SubjectController.revive(this.cache, item))

		return Array.from(this._subjects)
	}

	// --------------------> API Actions

	/**
	 * Create a new lecture
	 * @param cache Cache to create the lecture with
	 * @param graph Graph to assign the lecture to
	 * @returns The newly created LectureController
	 * @throws `APIError` if the API call fails
	 */

	static async create(cache: ControllerCache, graph: GraphController): Promise<LectureController> {

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
		const lecture = LectureController.revive(cache, data)

		// Assign the lecture to the graph
		graph.assignLecture(lecture)

		return lecture
	}

	/**
	 * Revive a lecture from serialized data, or retrieves an existing lecture from the cache
	 * @param cache Cache to revive the lecture with
	 * @param data Serialized data to revive
	 * @returns The revived LectureController
	 * @throws `LectureError` if the server data is out of sync with the cache
	 */

	static revive(cache: ControllerCache, data: SerializedLecture): LectureController {
		const existing = cache.find(LectureController, data.id)
		if (existing) {
			if (!existing.represents(data))
				throw new Error(`LectureError: Attempted to revive Lecture with ID ${data.id}, but server data is out of sync with cache`)
			return existing
		}

		return new LectureController(
			cache,
			data.id,
			data.name,
			data.graph,
			data.subjects
		)
	}

	/**
	 * Check if this lecture represents the serialized data
	 * @param data Serialized data to compare against
	 * @returns Whether the lecture represents the serialized data
	 */

	represents(data: SerializedLecture): boolean {

		// Check the easy stuff
		if (
			this.id !== data.id ||
			this.trimmed_name !== data.name ||
			this._graph_id !== data.graph
		) {
			return false
		}

		// Check the subjects
		if (
			this._subject_ids.length !== data.subjects.length ||
			this._subject_ids.some(id => !data.subjects.includes(id)) ||
			data.subjects.some(id => !this._subject_ids.includes(id))
		) {
			return false
		}

		return true
	}

	/**
	 * Serialize the lecture
	 * @returns Serialized lecture
	 */

	reduce(): SerializedLecture {
		return {
			id: this.id,
			name: this.trimmed_name,
			graph: this._graph_id,
			subjects: this._subject_ids
		}
	}

	/**
	 * Save this lecture
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
	 * Delete this lecture
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Call API to delete the lecture
		await fetch(`/api/lecture/${this.id}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: this.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/lecture/${this.id} DELETE): ${error}`)
		})

		// Unassign from graph
		this.cache.find(GraphController, this._graph_id)
			?.unassignLecture(this)

		// Unassign from subjects
		for (const id of this._subject_ids) {
			this.cache.find(SubjectController, id)
				?.unassignLecture(this, false)
		}

		// Remove from environment
		this.cache.remove(this)
	}

	/**
	 * Copy this lecture
	 * @param target_graph Graph to copy the lecture to
	 * @returns The copied lecture
	 */

	async copy(target_graph: GraphController): Promise<LectureController> {
		const lecture_copy = await LectureController.create(this.cache, target_graph)
		
		lecture_copy.name = this.name
		
		await lecture_copy.save()
		return lecture_copy
	}

	// --------------------> Validation

	/**
	 * Check if this lecture has a name
	 * @returns Whether the lecture has a name
	 */

	private hasName(): boolean {
		return this.trimmed_name !== ''
	}

	/**
	 * Find the first occurrence of this lectures's name in the graph, ordered by index
	 * @returns Index of the original name in the graph, or -1 if the name is original/nonexistant
	 * @throws `LectureError` if the lecture is not found in the graph
	 */

	private async findOriginalName(): Promise<number> {
		if (this.trimmed_name === '') {
			return -1
		}

		const graph = await this.getGraph()
		const lectures = await graph.getLectures()

		for (let index = 0; index < graph.lecture_ids.length; index++) {
			if (graph.lecture_ids[index] === this.id) {
				return -1
			}

			const lecture = lectures.find(lecture => lecture.id === graph.lecture_ids[index])
			if (lecture === undefined) throw new Error('LectureError: Lecture not found in graph')
			if (lecture.name === this.trimmed_name) return index
		}

		throw new Error('LectureError: Lecture not found in graph')
	}

	/**
	 * Check if this lecture has subjects
	 * @returns Whether the lecture has subjects
	 */

	private hasSubjects(): boolean {
		return this._subject_ids.length > 0
	}

	/**
	 * Validate this lecture
	 * @returns Validation result
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

	// --------------------> Assignments

	/**
	 * Assign the lecture to a graph
	 * @param graph Graph to assign the lecture to
	 * @param mirror Whether to mirror the assignment
	 */

	assignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_id === graph.id) return

		// Unassign previous graph
		if (mirror) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignLecture(this)
		}

		// Assign new graph
		this._graph_id = graph.id
		this._graph = graph

		if (mirror) {
			graph.assignLecture(this, false)
		}
	}

	/**
	 * Assign a subject to the lecture
	 * @param subject Subject to assign to the lecture
	 * @param mirror Whether to mirror the assignment
	 */

	assignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids.includes(subject.id)) return

		// Assign subject
		this._subject_ids.push(subject.id)
		this._subjects?.push(subject)

		if (mirror) {
			subject.assignLecture(this, false)
		}
	}

	/**
	 * Unassign a subject from the lecture
	 * @param subject Subject to unassign from the lecture
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (!this._subject_ids.includes(subject.id)) return

		// Unassign subject
		this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(subject => subject.id !== subject.id)

		if (mirror) {
			subject.unassignLecture(this, false)
		}
	}
}