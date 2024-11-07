
const BASE_URL = 'http://localhost:5432'

// Internal dependencies
import { ValidationData, Severity } from "$scripts/validation"

import {
	ControllerCache,
	CourseController,
	GraphController
} from "$scripts/controllers"

import type {
	SerializedLink,
	SerializedCourse,
	SerializedGraph
} from "$scripts/types"

// Exports
export { LinkController }


// --------------------> Controller


class LinkController {
	private _course?: CourseController
	private _pending_course?: Promise<CourseController>
	private _graph?: GraphController | null
	private _pending_graph?: Promise<GraphController | null>

	private constructor(
		public cache: ControllerCache,
		public id: number,
		public name: string,
		private _course_id: number,
		private _graph_id: number | null
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	get trimmed_name(): string {
		return this.name.trim()
	}

	get course_id(): number {
		return this._course_id
	}

	set course_id(id: number) {

		// Unassign previous course
		this.cache.find(CourseController, this._course_id)
			?.unassignLink(this)

		// Assign new course
		this._course = undefined
		this._course_id = id

		this.cache.find(CourseController, this._course_id)
			?.assignLink(this, false)
	}

	get graph_id(): number | null {
		return this._graph_id
	}

	set graph_id(id: number | null) {

		// Unassign previous graph
		if (this._graph_id) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignLink(this, false)
		}

		// Assign new graph
		this._graph = undefined
		this._graph_id = id

		if (this._graph_id) {
			this.cache.find(GraphController, this._graph_id)
				?.assignLink(this)
		}
	}

	// --------------------> API Getters

	/**
	 * Get the course associated to this link
	 * @returns The associated course
	 * @throws `APIError` if the API call fails
	 */

	async getCourse(): Promise<CourseController> {

		// Check if the course is pending
		if (this._pending_course !== undefined) {
			return await this._pending_course
		}

		// Check if the course is known
		if (this._course !== undefined) {
			return this._course
		}

		// Check if the course is cached
		this._course = this.cache.find(CourseController, this._course_id)
		if (this._course !== undefined) {
			return this._course
		}

		// Call API to fetch the course data
		this._pending_course = this.cache
			.fetch(`/api/link/${this.id}/course`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedCourse
					this._course = CourseController.revive(this.cache, data)
					this._pending_course = undefined
					return this._course
				},
				error => {
					this._pending_course = undefined
					throw new Error(`APIError (/api/link/${this.id}/course GET): ${error}`)
				}
			)
		
		return await this._pending_course
	}

	/**
	 * Get the graph associated to this link
	 * @returns The associated graph
	 * @throws `APIError` if the API call fails
	 */

	async getGraph(): Promise<GraphController | null> {
		
		// Check if the graph is pending
		if (this._pending_graph !== undefined) {
			return await this._pending_graph
		}

		// Check if the graph is known
		if (this._graph !== undefined) {
			return this._graph
		}

		// Check if the graph is cached
		this._graph = this._graph_id === null ? null : this.cache.find(GraphController, this._graph_id)
		if (this._graph !== undefined) {
			return this._graph
		}

		// Call API to fetch the graph data
		this._pending_graph = this.cache
			.fetch(`/api/link/${this.id}/graph`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedGraph
					this._graph = data ? GraphController.revive(this.cache, data) : null
					this._pending_graph = undefined
					return this._graph
				},
				error => {
					this._pending_graph = undefined
					throw new Error(`APIError (/api/link/${this.id}/graph GET): ${error}`)
				}
			)
		
		return await this._pending_graph
	}

	/**
	 * Get the URL of this link
	 * @returns The URL of the link
	 */

	async getURL(): Promise<string> {
		if (!this.validate().okay()) {
			return ''
		}

		// Build the URL
		const course = await this.getCourse()
		return `${BASE_URL}/graph/${course.code}/${this.trimmed_name}`
	}

	// --------------------> API Actions

	/**
	 * Create a new link
	 * @param cache Controller cache to create link with
	 * @param name Link name
	 * @param course_id Course id to assign the link to
	 * @param graph_id Graph id to assign the link to
	 * @returns The newly created LinkController
	 * @throws `APIError` If the API request fails
	 */

	static async create(cache: ControllerCache, course_id: number, graph_id: number | null, name: string): Promise<LinkController> {

		// Call API to create a new link
		const response = await cache.fetch('/api/link', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, course: course_id, graph: graph_id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/link POST): ${error}`)
		})

		// Revive the course
		const data = await response.json() as SerializedLink
		const link = LinkController.revive(cache, data)

		// Assign to course and graph
		cache.find(CourseController, course_id)
			?.assignLink(link, false)

		if (graph_id) {
			cache.find(GraphController, graph_id)
				?.assignLink(link, false)
		}

		return link
	}

	/**
	 * Revive a link from serialized data, or retrieves an existing link from the cache
	 * @param cache Controller cache to revive link with
	 * @param data Serialized link data
	 * @returns The revived LinkController
	 * @throws `LinkError` if the server data is out of sync with the cache
	 */

	static revive(cache: ControllerCache, data: SerializedLink): LinkController {
		const link = cache.find(LinkController, data.id)
		if (link) {
			if (!link.represents(data))
				throw new Error(`LinkError: Attempted to revive Link with ID ${data.id}, but server data is out of sync with cache`)
			return link
		}

		return new LinkController(
			cache,
			data.id,
			data.name,
			data.course,
			data.graph
		)
	}

	/**
	 * Check if this link is equal to a serialized link
	 * @param data Serialized link to compare against
	 * @returns Whether the link is equal to the serialized link
	 */

	represents(data: SerializedLink): boolean {
		return (
			this.id === data.id &&
			this.trimmed_name === data.name &&
			this._course_id === data.course &&
			this._graph_id === data.graph
		)
	}

	/**
	 * Serialize this link
	 * @returns Serialized link data
	 */

	reduce(): SerializedLink {
		return {
			id: this.id,
			name: this.trimmed_name,
			course: this._course_id,
			graph: this._graph_id
		}
	}

	/**
	 * Save this link
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Call API to save the link
		await this.cache.fetch(`/api/link`, {
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
	 * Delete this link
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		this.cache.find(CourseController, this._course_id)
			?.unassignLink(this)

		if (this._graph_id) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignLink(this, false)
		}

		// Call API to delete the link
		await this.cache.fetch(`/api/link/${this.id}`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/link/${this.id} DELETE): ${error}`)
			})

		// Remove from cache
		this.cache.remove(this)
	}

	// --------------------> Validation

	/**
	 * Check if the link has a name
	 * @returns Whether the link has a name
	 */

	private hasName(): boolean {
		return this.trimmed_name !== ''
	}

	/**
	 * Check if the link has a graph
	 * @returns Whether the link has a graph
	 */

	private hasGraph(): boolean {
		return this._graph_id !== null
	}

	/**
	 * Validate the link
	 * @returns `ValidationData` Validation data
	 */

	validate(): ValidationData {
		const validation = new ValidationData()

		if (!this.hasName()) {
			validation.add({
				severity: Severity.error,
				short: 'Link has no name'
			})
		}

		if (!this.hasGraph()) {
			validation.add({
				severity: Severity.error,
				short: 'Link has no associated graph'
			})
		}

		return validation
	}

	// --------------------> Assignments

	/**
	 * Assign a course to this link
	 * @param course Target course
	 * @param Whether to mirror the assignment
	 */

	assignCourse(course: CourseController, mirror: boolean = true): void {
		if (this._course_id === course.id) return

		// Unassign previous course
		if (this._course_id && mirror) {
			this.cache.find(CourseController, this._course_id)
				?.unassignLink(this)
		}

		// Assign new course
		this._course_id = course.id
		this._course = course

		if (mirror) {
			course.assignLink(this, false)
		}
	}

	/**
	 * Assign a graph to this link
	 * @param graph Target graph
	 * @param Whether to mirror the assignment
	 */

	assignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_id === graph?.id) return

		// Unassign previous graph
		if (this._graph_id && mirror) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignLink(this, false)
		}

		// Assign new graph
		this._graph_id = graph?.id
		this._graph = graph

		if (mirror) {
			graph.assignLink(this, false)
		}
	}

	/**
	 * Unassign a graph from this link
	 * @param Whether to mirror the unassignment
	 */

	unassignGraph(mirror: boolean = true): void {
		if (!this._graph_id) return

		// Unassign graph
		if (mirror) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignLink(this, false)
		}

		this._graph_id = null
		this._graph = null
	}
}