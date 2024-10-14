
// External dependencies
import { browser } from "$app/environment"

// Internal dependencies
import {
	ControllerEnvironment,
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


// --------------------> Controller


class LinkController {
	private _course?: CourseController
	private _graph?: GraphController | null

	private constructor(
		public environment: ControllerEnvironment,
		public id: number,
		public name: string,
		private _course_id: number,
		private _graph_id: number | null
	) {
		this.environment.remember(this)
	}

	get course_id(): number {
		return this._course_id
	}

	set course_id(value: number) {
		if (this._course_id === value) return

		// Unassign
		this.environment.courses
			.find(course => course.id === this._course_id)
			?.unassignLink(this)
		
		// Assign
		this._course_id = value
		this._course = this.environment.courses
			.find(course => course.id === value)
		this._course?.assignLink(this, false)
	}

	get graph_id(): number | null {
		return this._graph_id
	}

	set graph_id(value: number | null) {
		if (this._graph_id === value) return

		// Unassign
		this.environment.graphs
			.find(graph => graph.id === this._graph_id)
			?.unassignLink(this)
		
		// Assign
		this._graph_id = value || null
		if (this.graph_id === null) {
			this._graph = null
		} else {
			this._graph = this.environment.graphs
				.find(graph => graph.id === value)
			this._graph?.assignLink(this, false)
		}
	}

	/**
	 * Creates a new link
	 * @param environment Controller environment
	 * @param name Link name
	 * @param course Course id
	 * @param graph Graph id
	 * @returns `Promise<LinkController>` The newly created LinkController
	 * @throws `APIError` If the API request fails
	 */

	static async create(environment: ControllerEnvironment, course: number, name: string, graph: number | null): Promise<LinkController> {

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
		const link = LinkController.revive(environment, data)

		// Assign to course
		environment.courses
			.find(course => course.id === link._course_id)
			?.assignLink(link, false)

		return link
	}

	/**
	 * Revives a link from serialized data
	 * @param environment Controller environment
	 * @param data Serialized link data
	 * @returns `LinkController` The revived LinkController
	 */

	static revive(environment: ControllerEnvironment, data: SerializedLink): LinkController {
		return new LinkController(
			environment, 
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

		if (this._graph_id === undefined) {
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

		// Call API to delete the link
		await fetch(`/api/link/${this.id}`, {
			method: 'DELETE'
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/link/${this.id} DELETE): ${error}`)
		})

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		this.environment.courses
			.find(course => course.id === this._course_id)
			?.unassignLink(this)
		
		this.environment.graphs
			.find(graph => graph.id === this._graph_id)
			?.unassignLink(this, false)

		// Remove from environment
		this.environment.forget(this)
	}

	/**
	 * Get the course associated to this link
	 * @returns `CourseController` The associated course
	 * @throws `APIError` if the API call fails
	 * @throws `LinkError` if the course is out of sync with the server
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

		// Fetch the course
		const response = await fetch(`/api/course/${this._course_id}`)
			.catch(error => {
				throw new Error(`APIError (/api/course/${this._course_id}): ${error}`)
			})

		// Revive the course
		const data = await response.json() as SerializedCourse
		this._course = this.environment.get(data)

		// Check if the course is in sync
		if (this._course.id !== data.id) {
			throw new Error('LinkError: Course is out of sync with the server')
		}

		return this._course
	}

	/**
	 * Get the graph associated to this link
	 * @returns `GraphController | undefined` The associated graph
	 * @throws `APIError` if the API call fails
	 * @throws `LinkError` if the graph is out of sync with the server
	 */

	async getGraph(): Promise<GraphController | undefined> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if the graph is already loaded
		if (this._graph) {
			return this._graph
		}

		// Fetch the graph
		const response = await fetch(`/api/link/${this.id}/graph`)
			.catch(error => {
				throw new Error(`APIError (/api/link/${this.id}/graph): ${error}`)
			})

		// Parse the response
		const data = await response.json() as SerializedGraph
		if (data === null) {
			
			// Check if the graph is in sync
			if (this._graph_id !== undefined) {
				throw new Error('LinkError: Graph is out of sync with the server')
			}

			return undefined
		} 

		// Revive the graph
		this._graph = this.environment.get(data)

		// Check if the graph is in sync
		if (this._graph.id !== data.id) {
			throw new Error('LinkError: Graph is out of sync with the server')
		}

		return this._graph
	}

	/**
	 * Assign a course to this link
	 * @param course Target course
	 * @mirror Whether to mirror the assignment
	 */

	assignToCourse(course: CourseController, mirror: boolean = true): void {
		if (this._course_id === course.id) return
		if (this._course_id && mirror) {
			this.environment.courses
				.find(course => course.id === this._course_id)
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
			this.environment.graphs
				.find(graph => graph.id === this._graph_id)
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
			this.environment.graphs
				.find(graph => graph.id === this._graph_id)
				?.unassignLink(this, false)
		}

		this._graph_id = null
		this._graph = null
	}
}