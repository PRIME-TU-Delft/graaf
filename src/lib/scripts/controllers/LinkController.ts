
// External dependencies
import { browser } from "$app/environment"

// Internal dependencies
import {
	ControllerCache,
	CourseController,
	GraphController
} from "$scripts/controllers"

import { ValidationData, Severity } from "$scripts/validation"
import type { 
	SerializedLink, 
	SerializedCourse, 
	SerializedGraph
} from "$scripts/types"

// Exports
export { LinkController }

const BASE_URL = 'http://localhost:5432'

// --------------------> Controller


class LinkController {
	private _course?: CourseController
	private _graph?: GraphController | null

	private constructor(
		public cache: ControllerCache,
		public id: number,
		public name: string,
		private _course_id: number,
		private _graph_id: number | null
	) {
		this.cache.add(this)
	}

	get course_id(): number {
		return this._course_id
	}

	set course_id(value: number) {
		if (this._course_id === value) return

		// Unassign
		this.cache.find(CourseController, this._course_id)
			?.unassignLink(this)
		
		// Assign
		this._course_id = value
		this._course = this.cache.find(CourseController, value)
		this._course?.assignLink(this, false)
	}

	get graph_id(): number | null {
		return this._graph_id
	}

	set graph_id(value: number | null) {
		if (this._graph_id === value) return

		// Unassign
		if (this._graph_id) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignLink(this, false)
		}
		
		// Assign
		this._graph_id = value
		if (this._graph_id) {
			this._graph = this.cache.find(GraphController, this._graph_id)
			this._graph?.assignLink(this, false)
		} else {
			this._graph = null
		}
	}

	/**
	 * Creates a new link
	 * @param cache Controller cache
	 * @param name Link name
	 * @param course Course id
	 * @param graph Graph id
	 * @returns `Promise<LinkController>` The newly created LinkController
	 * @throws `APIError` If the API request fails
	 */

	static async create(cache: ControllerCache, course: number, name: string, graph: number | null): Promise<LinkController> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Call API to create a new link
		const response = await fetch('/api/link', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, course, graph })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/link POST): ${error}`)
		})

		// Revive the course
		const data = await response.json() as SerializedLink
		const link = LinkController.revive(cache, data)

		// Assign to course and graph
		cache.find(CourseController, course)
			?.assignLink(link, false)

		if (graph) {
			cache.find(GraphController, graph)
				?.assignLink(link, false)
		}

		return link
	}

	/**
	 * Revives a link from serialized data
	 * @param cache Controller cache
	 * @param data Serialized link data
	 * @returns `LinkController` The revived LinkController
	 */

	static revive(cache: ControllerCache, data: SerializedLink): LinkController {
		const link = cache.find(LinkController, data.id)

		if (link) return link
		return new LinkController(
			cache, 
			data.id, 
			data.name, 
			data.course, 
			data.graph
		)
	}

	/**
	 * Validate the link
	 * @returns `ValidationData` Validation data
	 */

	validate(): ValidationData {
		const validation = new ValidationData()

		if (this.name.trim() === '') {
			validation.add({
				severity: Severity.error,
				short: 'Link has no name'
			})
		}

		if (this._graph_id === null) {
			validation.add({
				severity: Severity.error,
				short: 'Link has no associated graph'
			})
		}

		return validation
	}

	/**
	 * Serialize the link
	 * @returns `SerializedLink` Serialized link data
	 */

	reduce(): SerializedLink {
		return {
			id: this.id,
			name: this.name.trim(),
			course: this._course_id,
			graph: this._graph_id
		}
	}

	/**
	 * Save the link
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Call API to save the link
		await fetch(`/api/link`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/link PUT): ${error}`)
		})
	}

	/**
	 * Delete the link
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		this.cache.find(CourseController, this._course_id)
			?.unassignLink(this)

		if (this._graph_id) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignLink(this, false)
		}

		// Call API to delete the link
		await fetch(`/api/link/${this.id}`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/link/${this.id} DELETE): ${error}`)
			})
			
		// Remove from cache
		this.cache.remove(this)
	}

	/**
	 * Get the course associated to this link
	 * @returns `CourseController` The associated course
	 * @throws `APIError` if the API call fails
	 */

	async getCourse(): Promise<CourseController> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if the course is already loaded
		if (this._course) {
			return this._course
		}

		// Call API to fetch the course data
		const response = await fetch(`/api/course/${this._course_id}`)
			.catch(error => {
				throw new Error(`APIError (/api/course/${this._course_id}): ${error}`)
			})

		// Revive the course
		const data = await response.json() as SerializedCourse
		this._course = CourseController.revive(this.cache, data)

		return this._course
	}

	/**
	 * Get the graph associated to this link
	 * @returns `GraphController | undefined` The associated graph
	 * @throws `APIError` if the API call fails
	 */

	async getGraph(): Promise<GraphController | null> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if the graph is already loaded
		if (this._graph) {
			return this._graph
		}

		// Call API to fetch the graph data
		const response = await fetch(`/api/link/${this.id}/graph`)
			.catch(error => {
				throw new Error(`APIError (/api/link/${this.id}/graph): ${error}`)
			})

		// Revive the graph
		const data = await response.json() as SerializedGraph
		if (data === null) return null
		this._graph = GraphController.revive(this.cache, data)

		return this._graph
	}

	/**
	 * Get the URL of the link
	 * @returns `Promise<string>` The URL of the link
	 */

	async getURL(): Promise<string> {
		if (!this.validate().ok()) return Promise.reject()
		const course = await this.getCourse()
		return `${BASE_URL}/graph/${course.code}/${this.name}`
	}

	/**
	 * Assign a course to this link
	 * @param course Target course
	 * @mirror Whether to mirror the assignment
	 */

	assignToCourse(course: CourseController, mirror: boolean = true): void {
		if (this._course_id === course.id) return
		if (this._course_id && mirror) {
			this.cache.find(CourseController, this._course_id)
				?.unassignLink(this)
		}

		this._course_id = course.id
		this._course = course

		if (mirror) {
			course.assignLink(this, false)
		}
	}

	/**
	 * Assign a graph to this link
	 * @param graph Target graph
	 * @mirror Whether to mirror the assignment
	 */

	assignToGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_id === graph?.id) return
		if (this._graph_id && mirror) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignLink(this, false)
		}

		this._graph_id = graph?.id
		this._graph = graph

		if (mirror) {
			graph.assignLink(this, false)
		}
	}

	/**
	 * Unassign a graph from this link
	 * @mirror Whether to mirror the unassignment
	 */

	unassignFromGraph(mirror: boolean = true): void {
		if (!this._graph_id) return
		if (mirror) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignLink(this, false)
		}

		this._graph_id = null
		this._graph = null
	}
}