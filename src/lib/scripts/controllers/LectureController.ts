
// Internal dependencies
import * as settings from '$scripts/settings'

import { oxfordCommaList, compareArrays, customError, debounce } from '$scripts/utility'
import { Validation, Severity } from '$scripts/validation'

import {
	ControllerCache,
	GraphController,
	SubjectController,
	SubjectRelationController
} from '$scripts/controllers'

import { validSerializedLecture } from '$scripts/types'
import type SaveStatus from '$components/SaveStatus.svelte'

import type {
	DropdownOption,
	SerializedLecture
} from '$scripts/types'

// Exports
export { LectureController }


// --------------------> Domain Controller


class LectureController {
	private _name_unchanged: boolean = false
	private _subjects_unchanged: boolean = false
	private _present_subjects?: SubjectController[]
	private _graph?: GraphController

	public save = debounce(this._save, settings.DEBOUNCE_DELAY)

	private constructor(
		public cache: ControllerCache,
		public id: number,
		private _name: string,
		public order: number,
		private _graph_id?: number,
		private _present_subject_ids?: number[]
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Is Empty property
	get is_empty(): boolean {
		return this.trimmed_name === ''
			&& this.present_subject_ids.length === 0
	}

	// Name properties
	get name(): string {
		return this._name
	}

	set name(value: string) {
		this._name = value
		this._name_unchanged = false
	}

	get trimmed_name(): string {
		return this._name.trim()
	}

	get display_name(): string {
		return this.trimmed_name === '' ? 'Untitled lecture' : this.trimmed_name
	}

	// Graph properties
	get graph_id(): number {
		if (this._graph_id === undefined)
			throw customError('LectureError', 'Graph data unknown')
		return this._graph_id
	}

	get graph(): GraphController {
		if (this._graph_id === undefined)
			throw customError('LectureError', 'Graph data unknown')
		if (this._graph !== undefined)
			return this._graph

		// Fetch graph from cache
		this._graph = this.cache.findOrThrow(GraphController, this._graph_id)
		return this._graph
	}

	// Present subject properties
	get present_subject_ids(): number[] {
		if (this._present_subject_ids === undefined)
			throw customError('LectureError', 'Subject data unknown')
		return Array.from(this._present_subject_ids)
	}

	get present_subjects(): SubjectController[] {
		if (this._present_subject_ids === undefined)
			throw customError('LectureError', 'Subject data unknown')
		if (this._present_subjects !== undefined)
			return Array.from(this._present_subjects)

		// Fetch subjects from cache
		this._present_subjects = this._present_subject_ids.map(id => this.cache.findOrThrow(SubjectController, id))
		return Array.from(this._present_subjects)
	}

	get subject_options(): DropdownOption<SubjectController>[] {
		return this.graph.subjects.map(subject => ({
			value: subject,
			label: subject.display_name,
			validation: this.validateOption(subject)
		}))
	}

	// Past subject properties
	get past_subjects(): SubjectController[] {
		const result: SubjectController[] = []
		for (const subject of this.present_subjects) {
			for (const parent of subject.parents) {
				if (!result.includes(parent) && !this.present_subjects.includes(parent))
					result.push(parent)
			}
		}

		return result
	}

	// Future subject properties
	get future_subjects(): SubjectController[] {
		const result: SubjectController[] = []
		for (const subject of this.present_subjects) {
			for (const child of subject.children) {
				if (!result.includes(child) && !this.present_subjects.includes(child))
					result.push(child)
			}
		}

		return result
	}

	// Subject properties
	get subjects(): SubjectController[] {
		return this.present_subjects
			.concat(this.past_subjects)
			.concat(this.future_subjects)
	}

	// Relation properties
	get relations(): SubjectRelationController[] {
		return this.graph.subject_relations
			.filter(relation => relation.parent !== null && relation.child !== null)
			.filter(relation => this.past_subjects.includes(relation.parent!) && this.present_subjects.includes(relation.child!)
							 || this.present_subjects.includes(relation.parent!) && this.future_subjects.includes(relation.child!)
			)
	}

	// Height properties
	get max_height(): number {
		return Math.max(this.present_subjects.length, this.past_subjects.length, this.future_subjects.length)
	}

	// --------------------> Assignments

	assignSubject(subject: SubjectController, mirror: boolean = true) {
		if (this._present_subject_ids !== undefined) {
			if (this._present_subject_ids.includes(subject.id))
				throw customError('LectureError', `Subject with ID ${subject.id} already assigned to lecture with ID ${this.id}`)
			this._present_subject_ids.push(subject.id)
			this._present_subjects?.push(subject)
			this._subjects_unchanged = false
		}

		if (mirror) {
			subject.assignToLecture(this, false)
		}
	}

	unassignSubject(subject: SubjectController, mirror: boolean = true) {
		if (this._present_subject_ids !== undefined) {
			if (!this._present_subject_ids.includes(subject.id))
				throw customError('LectureError', `Subject with ID ${subject.id} not assigned to lecture with ID ${this.id}`)
			this._present_subject_ids = this._present_subject_ids.filter(id => id !== subject.id)
			this._present_subjects = this._present_subjects?.filter(s => s.id !== subject.id)
			this._subjects_unchanged = false
		}

		if (mirror) {
			subject.unassignFromLecture(this, false)
		}
	}

	// --------------------> Validation

	private hasNoName(): boolean {
		return this.trimmed_name === ''
	}

	private nameTooLong(): boolean {
		return this.trimmed_name.length > settings.MAX_LECTURE_NAME_LENGTH
	}

	private otherLectureWithDuplicateName(): LectureController | undefined {
		return this.graph.lectures
			.find(lecture => lecture.id !== this.id && lecture.trimmed_name === this.trimmed_name)
	}

	private hasNoSubjects(): boolean {
		return this.present_subject_ids.length === 0
	}

	private subjectAlreadyCoveredHere(subject: SubjectController): boolean {
		return this.present_subject_ids.includes(subject.id)
	}

	private otherLecturesCoveringSubject(subject: SubjectController): LectureController[] {
		return this.graph.lectures
			.filter(lecture => lecture.id !== this.id && lecture.present_subject_ids.includes(subject.id))
	}

	private missingSubjectPrerequisites(subject: SubjectController): SubjectController[] {
		const covered_subjects = this.graph.lectures
			.filter(lecture => lecture.order <= this.order)
			.flatMap(lecture => lecture.present_subjects)

		const stack = [subject]
		const missing_prerequisites = []
		while (stack.length > 0) {
			const current = stack.pop() as SubjectController

			for (const parent of current.parents) {
				stack.push(parent)
				if (!covered_subjects.includes(parent)) {
					missing_prerequisites.push(parent)
				}
			}
		}

		return missing_prerequisites
	}

	private validateOption(subject: SubjectController): Validation {
		const validation = new Validation()

		if (this.subjectAlreadyCoveredHere(subject)) {
			validation.add({
				severity: Severity.error,
				short: 'Duplicate'
			})
		}

		else if (this.otherLecturesCoveringSubject(subject).length > 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Covered elsewhere'
			})
		}

		else if (this.missingSubjectPrerequisites(subject).length > 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Misses prerequisites'
			})
		}

		return validation
	}

	validateName(strict: boolean = true): Validation {
		const validation = new Validation()
		if (!strict && this._name_unchanged) return validation

		if (this.hasNoName()) {
			validation.add({
				severity: Severity.error,
				short: 'Lecture has no name'
			})
		} else if (this.nameTooLong()) {
			validation.add({
				severity: Severity.error,
				short: 'Lecture name is too long',
				long: `Lecture name cannot exceed ${settings.MAX_LECTURE_NAME_LENGTH} characters`
			})
		} else if (this.otherLectureWithDuplicateName()) {
			validation.add({
				severity: Severity.warning,
				short: 'Lecture name is not unique'
			})
		}

		return validation
	}

	validateSubjects(strict: boolean = true): Validation {
		const validation = new Validation()
		if (!strict && this._subjects_unchanged) return validation

		if (this.hasNoSubjects()) {
			validation.add({
				severity: Severity.error,
				short: 'Lecture has no subjects'
			})
		}

		for (const subject of this.present_subjects) {
			const other_lectures = this.otherLecturesCoveringSubject(subject)
			if (other_lectures.length > 0) {
				validation.add({
					severity: Severity.warning,
					short: 'Subject covered elsewhere',
					long: `${subject.display_name} is already covered by ${oxfordCommaList(other_lectures.map(lecture => lecture.display_name))}`
				})
			}

			const missing_prerequisites = this.missingSubjectPrerequisites(subject)
			if (missing_prerequisites.length > 0) {
				validation.add({
					severity: Severity.warning,
					short: 'Subject has missing prerequisites',
					long: `${oxfordCommaList(missing_prerequisites.map(subject => subject.display_name))} should be covered before ${subject.display_name}`
				})
			}
		}

		return validation
	}

	validate(strict: boolean = true): Validation {
		const validation = new Validation()

		validation.add(this.validateName(strict))
		validation.add(this.validateSubjects(strict))

		return validation
	}

	// --------------------> Actions

	static async create(cache: ControllerCache, graph: GraphController, save_status?: SaveStatus): Promise<LectureController> {
		save_status?.setSaving()

		// Call the API to create a new lecture
		const response = await fetch('/api/lecture', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ graph_id: graph.id })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/lecture POST)', await response.text())
		}

		// Revive the lecture
		const data = await response.json()
		if (!validSerializedLecture(data)) {
			throw customError('LectureError', `Invalid lecture data received from API`)
		}

		const lecture = LectureController.revive(cache, data)
		lecture._name_unchanged = true
		lecture._subjects_unchanged = true
		graph.assignLecture(lecture)
		save_status?.setIdle()

		return lecture
	}

	static revive(cache: ControllerCache, data: SerializedLecture): LectureController {
		const lecture = cache.find(LectureController, data.id)
		if (lecture !== undefined) {

			// Throw error if lecture data is inconsistent
			if (!lecture.represents(data)) {
				throw customError('LectureError', `Lecture with ID ${data.id} already exists, and is inconsistent with new data`)
			}

			// Update lecture where necessary
			if (lecture._graph_id === undefined)
				lecture._graph_id = data.graph_id
			if (lecture._present_subject_ids === undefined)
				lecture._present_subject_ids = data.subject_ids

			return lecture
		}

		return new LectureController(
			cache,
			data.id,
			data.name,
			data.order,
			data.graph_id,
			data.subject_ids
		)
	}

	represents(data: SerializedLecture): boolean {
		return this.id === data.id
			&& this.trimmed_name === data.name
			&& this.order === data.order
			&& (this._graph_id === undefined    || data.graph_id === undefined    || this._graph_id === data.graph_id)
			&& (this._present_subject_ids === undefined || data.subject_ids === undefined || compareArrays(this._present_subject_ids, data.subject_ids))
	}

	reduce(): SerializedLecture {
		return {
			id: this.id,
			name: this.trimmed_name,
			order: this.order,
			graph_id: this._graph_id,
			subject_ids: this._present_subject_ids
		}
	}

	private async _save(save_status?: SaveStatus) {
		save_status?.setSaving()

		// Call the API to save the lecture
		const response = await fetch('/api/lecture', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/lecture PUT)', await response.text())
		}

		save_status?.setIdle()
	}

	async delete(reorder_graph: boolean = true, save_status?: SaveStatus) {
		save_status?.setSaving()

		// Unassign graph and subjects
		if (this._graph_id !== undefined)
			this.graph.unassignLecture(this)
		if (this._present_subject_ids !== undefined)
			for (const subject of this.present_subjects)
				subject.unassignFromLecture(this, false)

		// Fix order of remaining lectures
		if (reorder_graph) {
			await this.graph.reorderLectures()
		}

		// Call the API to delete the lecture
		const response = await fetch(`/api/lecture/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/lecture/${this.id} DELETE)', await response.text())
		}

		// Remove the graph from the cache
		this.cache.remove(this)
		save_status?.setIdle()
	}

	async copy(graph: GraphController): Promise<LectureController> {
		const lecture_copy = await LectureController.create(this.cache, graph)
		lecture_copy.name = this.trimmed_name
		lecture_copy.order = this.order

		return lecture_copy
	}

	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = this.trimmed_name.toLowerCase()
		const lower_subjects = this.present_subjects.map(subject => subject.trimmed_name.toLowerCase())

		return lower_name.includes(lower_query) || lower_subjects.some(subject => subject.includes(lower_query))
	}
}