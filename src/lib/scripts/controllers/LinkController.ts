
// Internal dependencies
import * as settings from '$scripts/settings'

import { Validation, Severity } from '$scripts/validation'
import { debounce, customError } from '$scripts/utility'

import {
	ControllerCache,
	CourseController,
	GraphController
} from '$scripts/controllers'

import { validSerializedLink } from '$scripts/types'

import type { SerializedLink } from '$scripts/types'
import type SaveStatus from '$components/SaveStatus.svelte'

// Exports
export { LinkController }


// --------------------> Link Controller


class LinkController {
	private _name_unchanged: boolean = false
	private _graph_unchanged: boolean = false
	private _graph?: GraphController | null
	private _course?: CourseController

	public save = debounce(this._save, settings.DEBOUNCE_DELAY)

	private constructor(
		public cache: ControllerCache,
		public id: number,
		private _name: string,
		private _course_id?: number,
		private _graph_id?: number | null,
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Is empty property
	get is_empty(): boolean {
		return this.trimmed_name === ''
			&& this.graph_id === null
	}

	// Name properties
	get name(): string {
		return this._name
	}

	set name(name: string) {
		this._name = name
		this._name_unchanged = false
	}

	get trimmed_name(): string {
		return this._name.trim()
	}

	get display_name(): string {
		return this.trimmed_name === '' ? 'Untitled link' : this.trimmed_name
	}

	// Course properties
	get course_id(): number {
		if (this._course_id === undefined)
			throw customError('LinkError', 'Course data unknown')
		return this._course_id
	}

	get course(): CourseController {
		if (this._course_id === undefined)
			throw customError('LinkError', 'Course data unknown')
		if (this._course !== undefined)
			return this._course

		// Fetch course from cache
		this._course = this.cache.findOrThrow(CourseController, this._course_id)
		return this._course
	}

	// Graph properties
	get graph_id(): number | null {
		if (this._graph_id === undefined)
			throw customError('LinkError', 'Graph data unknown')
		return this._graph_id
	}

	get graph(): GraphController | null {
		if (this._graph_id === undefined)
			throw customError('LinkError', 'Graph data unknown')
		if (this._graph !== undefined)
			return this._graph

		// Fetch graph from cache
		this._graph = this._graph_id ? this.cache.findOrThrow(GraphController, this._graph_id) : null
		return this._graph
	}

	set graph(graph: GraphController | null) {
		this.graph?.unassignFromLink(this, false)
		this._graph_id = graph ? graph.id : null
		this._graph = graph
		this.graph?.assignToLink(this, false)
		this._graph_unchanged = false
	}

	// URL properties
	get url(): string {
		if (this.validate().severity === Severity.error)
			return ''
		return `${settings.ROOT_URL}/app/course/${this.course.trimmed_code}/${this.trimmed_name}?view=subjects`
	}

	// --------------------> Assignments

	assignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_id !== undefined) {
			if (this._graph_id === graph.id)
				throw customError('LinkError', `Graph with ID ${graph.id} already assigned to link with ID ${this.id}`)
			if (this._graph_id !== null && mirror)
				this.graph?.unassignFromLink(this, false)
			this._graph_unchanged = false
			this._graph_id = graph.id
			this._graph = graph
		}

		if (mirror) {
			graph.assignToLink(this, false)
		}
	}

	unassignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_id !== undefined) {
			if (this._graph_id !== graph.id)
				throw customError('LinkError', `Graph with ID ${graph.id} not assigned to link with ID ${this.id}`)
			this._graph_unchanged = false
			this._graph_id = null
			this._graph = null
		}

		if (mirror) {
			graph.unassignFromLink(this, false)
		}
	}

	// --------------------> Validation

	validateName(strict: boolean = true): Validation {
		const validation = new Validation()
		if (!strict && this._name_unchanged) return validation

		if (this.trimmed_name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Link has no name'
			})
		} else if (this.trimmed_name.length > settings.MAX_LINK_NAME_LENGTH) {
			validation.add({
				severity: Severity.error,
				short: 'Link name is too long',
				long: `Link name cannot exceed ${settings.MAX_LINK_NAME_LENGTH} characters`
			})
		} else if (!settings.LINK_NAME_REGEX.test(this.trimmed_name)) {
			validation.add({
				severity: Severity.error,
				short: 'Link name is invalid',
				long: 'Link names can only contain letters, numbers, and these special characters: -_.~'
			})
		} else if (this.course.links
			.find(link => link !== this && link.trimmed_name === this.trimmed_name)
		) {
			validation.add({
				severity: Severity.error,
				short: 'Link name is not unique'
			})
		}

		return validation
	}

	validateGraph(strict: boolean = true): Validation {
		const validation = new Validation()
		if (!strict && this._graph_unchanged) return validation

		if (this.graph_id === null) {
			validation.add({
				severity: Severity.error,
				short: 'Link has no graph'
			})
		}

		return validation
	}

	validate(strict: boolean = true): Validation {
		const validation = new Validation()

		validation.add(this.validateName(strict))
		validation.add(this.validateGraph(strict))

		return validation
	}

	// --------------------> Actions

	static async create(cache: ControllerCache, course: CourseController, save_status?: SaveStatus): Promise<LinkController> {
		save_status?.setSaving(true)

		// Call the API to create a new link
		const response = await fetch('/api/link', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ course_id: course.id })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/link POST)', await response.text())
		}

		// Revive the link
		const data = await response.json()
		if (!validSerializedLink(data)) {
			throw customError('LinkError', `Invalid link data received from API`)
		}

		const link = LinkController.revive(cache, data)
		link._name_unchanged = true
		link._graph_unchanged = true
		course.assignLink(link)
		save_status?.setSaving(false)

		return link
	}

	static revive(cache: ControllerCache, data: SerializedLink): LinkController {
		const link = cache.find(LinkController, data.id)
		if (link !== undefined) {

			// Throw error if link data is inconsistent
			if (!link.represents(data)) {
				throw customError('LinkError', `Link with ID ${data.id} already exists, and is inconsistent with new data`)
			}

			// Update link where necessary
			if (link._course_id === undefined)
				link._course_id = data.course_id
			if (link._graph_id === undefined)
				link._graph_id = data.graph_id

			return link
		}

		return new LinkController(
			cache,
			data.id,
			data.name,
			data.course_id,
			data.graph_id
		)
	}

	represents(data: SerializedLink): boolean {
		return this.id === data.id
			&& this.trimmed_name === data.name
			&& (this._graph_id === undefined  || data.graph_id === undefined  || this._graph_id === data.graph_id)
			&& (this._course_id === undefined || data.course_id === undefined || this._course_id === data.course_id)
	}

	reduce(): SerializedLink {
		return {
			id: this.id,
			name: this.trimmed_name,
			course_id: this._course_id,
			graph_id: this._graph_id
		}
	}

	private async _save(save_status?: SaveStatus) {
		save_status?.setSaving(true)

		// Call the API to save the link
		const response = await fetch('/api/link', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/link PUT)', await response.text())
		}

		save_status?.setSaving(false)
	}

	async delete(save_status?: SaveStatus) {
		save_status?.setSaving(true)

		// Unassign course and graph
		if (this._course_id !== undefined)
			this.course.unassignLink(this)
		if (this._graph_id !== undefined)
			this.graph?.unassignFromLink(this, false)

		// Call the API to delete the link
		const response = await fetch(`/api/link/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/link/${this.id} DELETE)', await response.text())
		}

		// Remove the link from the cache
		this.cache.remove(this)
		save_status?.setSaving(false)
	}

	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = this.trimmed_name.toLowerCase()
		const lower_graph = this.graph?.trimmed_name.toLowerCase() || ''

		return lower_name.includes(lower_query) || lower_graph.includes(lower_query)
	}
}