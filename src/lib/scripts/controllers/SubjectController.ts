
// Internal dependencies
import * as settings from '$scripts/settings'
import { compareArrays } from '$scripts/utility'
import { Validation, Severity } from '$scripts/validation'

import {
	ControllerCache,
	NodeController,
	DomainController,
	LectureController,
	GraphController
} from '$scripts/controllers'

import { validSerializedSubject } from '$scripts/types'

import type {
	DomainStyle,
	DropdownOption,
	SerializedSubject
} from '$scripts/types'

// Exports
export { SubjectController }


// --------------------> Subject Controller


class SubjectController extends NodeController<SubjectController> {
	private _domain_id?: number | null
	private _domain?: DomainController | null
	private _lecture_ids?: number[]
	private _lectures?: LectureController[]

	private constructor(
		cache: ControllerCache,
		id: number,
		name: string,
		order: number,
		x: number,
		y: number,
		_domain_id?: number | null,
		_graph_id?: number,
		_parent_ids?: number[],
		_child_ids?: number[],
		_lecture_ids?: number[]

	) {
		super(cache, id, name, order, x, y, _graph_id, _parent_ids, _child_ids)

		this._domain_id = _domain_id
		this._lecture_ids = _lecture_ids

		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Style properties
	get style(): DomainStyle | null {
		return this.domain?.style || null
	}

	// Parent properties
	get parents(): SubjectController[] {
		if (this._parent_ids === undefined)
			throw new Error('SubjectError: Parent data unknown')
		if (this._parents !== undefined)
			return Array.from(this._parents)

		// Fetch parents from cache
		this._parents = this._parent_ids.map(id => this.cache.findOrThrow(SubjectController, id))
		return Array.from(this._parents)
	}

	// Child properties
	get children(): SubjectController[] {
		if (this._child_ids === undefined)
			throw new Error('SubjectError: Child data unknown')
		if (this._children !== undefined)
			return Array.from(this._children)

		// Fetch children from cache
		this._children = this._child_ids.map(id => this.cache.findOrThrow(SubjectController, id))
		return Array.from(this._children)
	}

	// Domain properties
	get domain_id(): number | null {
		if (this._domain_id === undefined)
			throw new Error('SubjectError: Domain data unknown')
		return this._domain_id
	}

	get domain(): DomainController | null {
		if (this._domain_id === undefined)
			throw new Error('SubjectError: Domain data unknown')
		if (this._domain !== undefined)
			return this._domain

		// Fetch domain from cache
		this._domain = this._domain_id ? this.cache.findOrThrow(DomainController, this._domain_id) : null
		return this._domain
	}

	set domain(domain: DomainController | null) {
		this.domain?.removeSubject(this)
		this._domain_id = domain ? domain.id : null
		this._domain = domain
		this.domain?.addSubject(this)
		this._untouched = false
	}

	// Lecture properties
	get lecture_ids(): number[] {
		if (this._lecture_ids === undefined)
			throw new Error('SubjectError: Lecture data unknown')
		return Array.from(this._lecture_ids)
	}

	get lectures(): LectureController[] {
		if (this._lecture_ids === undefined)
			throw new Error('SubjectError: Lecture data unknown')
		if (this._lectures !== undefined)
			return Array.from(this._lectures)

		// Fetch lectures from cache
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

	// Untouched state
	get untouched(): boolean {
		return this._untouched
	}

	// --------------------> Assignments

	addParent(parent: SubjectController) {
		if (this._parent_ids === undefined)
			return
		if (this._parent_ids.includes(parent.id))
			throw new Error(`SubjectError: Parent with ID ${parent.id} already assigned to subject with ID ${this.id}`)
		this._parent_ids?.push(parent.id)
		this._parents?.push(parent)
	}

	addChild(child: SubjectController) {
		if (this._child_ids === undefined)
			return
		if (this._child_ids.includes(child.id))
			throw new Error(`SubjectError: Child with ID ${child.id} already assigned to subject with ID ${this.id}`)
		this._child_ids?.push(child.id)
		this._children?.push(child)
	}

	addLecture(lecture: LectureController) {
		if (this._lecture_ids === undefined)
			return
		if (this._lecture_ids.includes(lecture.id))
			throw new Error(`SubjectError: Lecture with ID ${lecture.id} already assigned to subject with ID ${this.id}`)
		this._lecture_ids?.push(lecture.id)
		this._lectures?.push(lecture)
		this._untouched = false
	}

	removeParent(parent: SubjectController): void {
		if (this._parent_ids === undefined)
			return
		if (!this._parent_ids.includes(parent.id))
			throw new Error(`SubjectError: Parent with ID ${parent.id} not assigned to subject with ID ${this.id}`)
		this._parent_ids = this._parent_ids?.filter(id => id !== parent.id)
		this._parents = this._parents?.filter(p => p.id !== parent.id)
	}


	removeChild(child: SubjectController): void {
		if (this._child_ids === undefined)
			return
		if (!this._child_ids.includes(child.id))
			throw new Error(`SubjectError: Child with ID ${child.id} not assigned to subject with ID ${this.id}`)
		this._child_ids = this._child_ids?.filter(id => id !== child.id)
		this._children = this._children?.filter(c => c.id !== child.id)
	}

	removeLecture(lecture: LectureController): void {
		if (this._lecture_ids === undefined)
			return
		if (!this._lecture_ids.includes(lecture.id))
			throw new Error(`SubjectError: Lecture with ID ${lecture.id} not assigned to subject with ID ${this.id}`)
		this._lecture_ids = this._lecture_ids?.filter(id => id !== lecture.id)
		this._lectures = this._lectures?.filter(l => l.id !== lecture.id)
		this._untouched = false
	}

	// --------------------> Validation

	validateName(strict: boolean): Validation {
		const validation = new Validation()
		if (!strict && this._untouched) {
			return validation
		}

		if (this.trimmed_name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Subject has no name',
				url: `/app/graph/${this.graph_id}/settings?tab=subjects`,
				uuid: this.uuid
			})
		} else if (this.trimmed_name.length > settings.MAX_NODE_NAME_LENGTH) {
			validation.add({
				severity: Severity.error,
				short: 'Subject name is too long',
				long: `Subject name cannot exceed ${settings.MAX_NODE_NAME_LENGTH} characters`,
				url: `/app/graph/${this.graph_id}/settings?tab=subjects`,
				uuid: this.uuid
			})
		} else if (this.cache.all(SubjectController)
			.find(subject => subject.id !== this.id && subject.trimmed_name === this.trimmed_name)
		) {
			validation.add({
				severity: Severity.warning,
				short: 'Subject name is not unique',
				url: `/app/graph/${this.graph_id}/settings?tab=subjects`,
				uuid: this.uuid
			})
		}

		return validation
	}

	validateDomain(strict: boolean): Validation {
		const validation = new Validation()
		if (!strict && this._untouched) {
			return validation
		}

		if (this.domain === null) {
			validation.add({
				severity: Severity.error,
				short: 'Subject has no domain',
				url: `/app/graph/${this.graph_id}/settings?tab=subjects`,
				uuid: this.uuid
			})
		}

		return validation
	}

	validateLectures(strict: boolean): Validation {
		const validation = new Validation()
		if (!strict && this._untouched) {
			return validation
		}

		if (this.lecture_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Subject has no lectures',
				url: `/app/graph/${this.graph_id}/settings?tab=subjects`,
				uuid: this.uuid
			})
		}

		return validation
	}

	validate(strict: boolean = true): Validation {
		const validation = new Validation()

		validation.add(this.validateName(strict))
		validation.add(this.validateDomain(strict))
		validation.add(this.validateLectures(strict))

		return validation
	}

	// --------------------> Actions

	static async create(cache: ControllerCache, graph: GraphController): Promise<SubjectController> {

		// Call the API to create a new subject
		const response = await fetch('/api/subject', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ graph_id: graph.id })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/subject POST): ${response.status} ${response.statusText}`)
		}

		// Revive the subject
		const data = await response.json()
		if (validSerializedSubject(data)) {
			const subject = SubjectController.revive(cache, data)
			subject._untouched = true
			graph.addSubject(subject)
			return subject
		}

		throw new Error(`SubjectError: Invalid subject data received from API`)
	}

	static revive(cache: ControllerCache, data: SerializedSubject): SubjectController {
		const subject = cache.find(SubjectController, data.id)
		if (subject !== undefined) {

			// Throw error if subject data is inconsistent
			if (!subject.represents(data)) {
				throw new Error(`SubjectError: Subject with ID ${data.id} already exists, and is inconsistent with new data`)
			}

			// Update subject where necessary
			if (subject._graph_id === undefined)
				subject._graph_id = data.graph_id
			if (subject._parent_ids === undefined)
				subject._parent_ids = data.parent_ids
			if (subject._child_ids === undefined)
				subject._child_ids = data.child_ids
			if (subject._lecture_ids === undefined)
				subject._lecture_ids = data.lecture_ids

			return subject
		}

		return new SubjectController(
			cache,
			data.id,
			data.name,
			data.order,
			data.x,
			data.y,
			data.domain_id,
			data.graph_id,
			data.parent_ids,
			data.child_ids,
			data.lecture_ids
		)
	}

	represents(data: SerializedSubject): boolean {
		return this.id === data.id
			&& this.trimmed_name === data.name
			&& this.order === data.order
			&& this.x === data.x
			&& this.y === data.y
			&& (this._domain_id === undefined   || data.domain_id === undefined   || this._domain_id === data.domain_id)
			&& (this._graph_id === undefined    || data.graph_id === undefined    || this._graph_id === data.graph_id)
			&& (this._parent_ids === undefined  || data.parent_ids === undefined  || compareArrays(this._parent_ids, data.parent_ids))
			&& (this._child_ids === undefined   || data.child_ids === undefined   || compareArrays(this._child_ids, data.child_ids))
			&& (this._lecture_ids === undefined || data.lecture_ids === undefined || compareArrays(this._lecture_ids, data.lecture_ids))
	}

	reduce(): SerializedSubject {
		return {
			id: this.id,
			name: this.trimmed_name,
			order: this.order,
			x: this.x,
			y: this.y,
			domain_id: this._domain_id,
			graph_id: this._graph_id,
			parent_ids: this._parent_ids,
			child_ids: this._child_ids,
			lecture_ids: this._lecture_ids
		}
	}

	async save() {

		// Call the API to save the subject
		const response = await fetch('/api/subject', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/subject PUT): ${response.status} ${response.statusText}`)
		}
	}

	async delete() {

		// Unassign graph, domain, parents, children, and lectures
		if (this._graph_id !== undefined)
			this.graph.removeSubject(this)
		if (this._domain_id !== undefined)
			this.domain?.removeSubject(this)
		if (this._parent_ids !== undefined)
			for (const parent of this.parents)
				parent.removeChild(this)
		if (this._child_ids !== undefined)
			for (const child of this.children)
				child.removeParent(this)
		if (this._lecture_ids !== undefined)
			for (const lecture of this.lectures)
				lecture.removeSubject(this)

		// Call the API to delete the subject
		const response = await fetch(`/api/subject/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/subject/${this.id} DELETE): ${response.status} ${response.statusText}`)
		}

		// Remove the subject from the cache
		this.cache.remove(this)
	}

	
	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = this.trimmed_name.toLowerCase()
		const lower_domain = this.domain?.trimmed_name.toLowerCase() || ''

		return lower_name.includes(lower_query) || lower_domain.includes(lower_query)
	}
}