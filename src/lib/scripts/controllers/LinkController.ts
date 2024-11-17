
// External dependencies
import * as uuid from 'uuid'

// Internal dependencies
import * as settings from '$scripts/settings'
import { Validation, Severity } from '$scripts/validation'

import {
	ControllerCache,
	CourseController,
	GraphController
} from '$scripts/controllers'

import { validSerializedLink } from '$scripts/types'
import type { SerializedLink } from '$scripts/types'

// Exports
export { LinkController }


// --------------------> Link Controller


class LinkController {
	public uuid: string = uuid.v4()

	private _unsaved: boolean = false
	private _course?: CourseController
	private _graph?: GraphController | null

	private constructor(
		public cache: ControllerCache,
		public id: number,
		private _unchanged: boolean,
		private _name: string,
		private _course_id?: number,
		private _graph_id?: number | null,
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Unchanged properties
	get unchanged(): boolean {
		return this._unchanged
	}

	// Name properties
	get name(): string {
		return this._name
	}

	set name(name: string) {
		this._name = name
		this._unchanged = false
		this._unsaved = true
	}

	get trimmed_name(): string {
		return this._name.trim()
	}

	// Course properties
	get course_id(): number {
		if (this._course_id === undefined)
			throw new Error('LinkError: Course data unknown')
		return this._course_id
	}

	get course(): CourseController {
		if (this._course_id === undefined)
			throw new Error('LinkError: Course data unknown')
		if (this._course !== undefined)
			return this._course

		// Fetch course from cache
		this._course = this.cache.findOrThrow(CourseController, this._course_id)
		return this._course
	}

	// Graph properties
	get graph_id(): number | null {
		if (this._graph_id === undefined)
			throw new Error('LinkError: Graph data unknown')
		return this._graph_id
	}

	get graph(): GraphController | null {
		if (this._graph_id === undefined)
			throw new Error('LinkError: Graph data unknown')
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
		this._unchanged = false
		this._unsaved = true
	}
	
	// URL properties
	get url(): string {
		if (this.validate().severity === Severity.error)
			return ''
		return `/app/course/${this.course.code}/${this.name}`
	}

	// --------------------> Assignments

	assignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_id !== undefined) {
			if (this._graph_id === graph.id)
				throw new Error(`LinkError: Graph with ID ${graph.id} already assigned to link with ID ${this.id}`)
			if (this._graph_id !== null && mirror)
				this.graph?.unassignFromLink(this, false)
			this._graph_id = graph.id
			this._graph = graph
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			graph.assignToLink(this, false)
		}
	}

	unassignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_id !== undefined) {
			if (this._graph_id !== graph.id)
				throw new Error(`LinkError: Graph with ID ${graph.id} not assigned to link with ID ${this.id}`)
			this._graph_id = null
			this._graph = null
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			graph.unassignFromLink(this, false)
		}
	}

	// --------------------> Validation

	validateName(strict: boolean = true): Validation {
		const validation = new Validation()
		if (!strict && this._unchanged) return validation

		if (this.trimmed_name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Link has no name',
				url: `/app/course/${this.course_id}/overview`,
				uuid: this.uuid
			})
		} else if (this.trimmed_name.length > settings.MAX_LINK_NAME_LENGTH) {
			validation.add({
				severity: Severity.error,
				short: 'Link name is too long',
				long: `Link name cannot exceed ${settings.MAX_LINK_NAME_LENGTH} characters`,
				url: `/app/course/${this.course_id}/overview`,
				uuid: this.uuid
			})
		} else if (!settings.LINK_NAME_REGEX.test(this.trimmed_name)) {
			validation.add({
				severity: Severity.error,
				short: 'Link name is invalid',
				long: 'Link names can only contain letters, numbers, and these special characters: -_.~',
				url: `/app/course/${this.course_id}/overview`,
				uuid: this.uuid
			})
		} else if (this.course.links
			.find(link => link !== this && link.trimmed_name === this.trimmed_name)
		) {
			validation.add({
				severity: Severity.error,
				short: 'Link name is not unique',
				url: `/app/course/${this.course_id}/overview`,
				uuid: this.uuid
			})
		}

		return validation
	}

	validateGraph(strict: boolean = true): Validation {
		const validation = new Validation()
		if (!strict && this._unchanged) return validation

		if (this.graph_id === null) {
			validation.add({
				severity: Severity.error,
				short: 'Link has no graph',
				url: `/app/course/${this.course_id}/overview`,
				uuid: this.uuid
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

	static async create(cache: ControllerCache, course: CourseController): Promise<LinkController> {

		// Call the API to create a new link
		const response = await fetch('/api/link', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ course_id: course.id })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/link POST): ${response.status} ${response.statusText}`)
		}

		// Revive the link
		const data = await response.json()
		if (!validSerializedLink(data)) {
			throw new Error(`LinkError: Invalid link data received from API`)
		}

		const link = LinkController.revive(cache, data)
		course.assignLink(link)
		return link
	}

	static revive(cache: ControllerCache, data: SerializedLink): LinkController {
		const link = cache.find(LinkController, data.id)
		if (link !== undefined) {

			// Throw error if link data is inconsistent
			if (!link.represents(data)) {
				throw new Error(`LinkError: Link with ID ${data.id} already exists, and is inconsistent with new data`)
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
			data.unchanged,
			data.name,
			data.course_id,
			data.graph_id
		)
	}

	represents(data: SerializedLink): boolean {
		return this.id === data.id
			&& this._unchanged === data.unchanged
			&& this.trimmed_name === data.name
			&& (this._graph_id === undefined  || data.graph_id === undefined  || this._graph_id === data.graph_id)
			&& (this._course_id === undefined || data.course_id === undefined || this._course_id === data.course_id)
	}

	reduce(): SerializedLink {
		return {
			id: this.id,
			unchanged: this._unchanged,
			name: this.trimmed_name,
			course_id: this._course_id,
			graph_id: this._graph_id
		}
	}

	async save() {
		if (!this._unsaved) return

		// Call the API to save the link
		const response = await fetch('/api/link', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/link PUT): ${response.status} ${response.statusText}`)
		}

		this._unsaved = false
	}

	async delete() {

		// Unassign course and graph
		if (this._course_id !== undefined)
			this.course.unassignLink(this)
		if (this._graph_id !== undefined)
			this.graph?.unassignFromLink(this, false)

		// Call the API to delete the link
		const response = await fetch(`/api/link/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/link/${this.id} DELETE): ${response.status} ${response.statusText}`)
		}

		// Remove the link from the cache
		this.cache.remove(this)
	}
	
	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = this.trimmed_name.toLowerCase()
		const lower_graph = this.graph?.name.toLowerCase() || ''
		return lower_name.includes(lower_query) || lower_graph.includes(lower_query)
	}
}