
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
	private _graph?: GraphController

	private constructor(
		public environment: ControllerEnvironment,
		public id: number,
		public name: string,
		private _course_id: number,
		private _graph_id: number
	) {
		this.environment.add(this)
	}

	get course(): Promise<CourseController> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if the course is already loaded
		if (this._course) {
			return Promise.resolve(this._course)
		}

		// Call API to get the course
		return fetch(`/api/link/${this.id}/course`, { method: 'GET' })
			.then(
				response => response.json() as Promise<SerializedCourse>,
				error => { throw new Error(`APIError (/api/link/${this.id}/course): ${error}`) }
			)

		// Parse the data
		.then(course => {
			
			// Get the course from the environment
			this._course = this.environment.get(course)

			// Check if client is in sync with the server
			if (this._course.id !== this._course_id) {
				throw new Error(`ProgramError: Course is not in sync with the server`)
			}

			return this._course
		})
	}

	get graph(): Promise<GraphController> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if the graph is already loaded
		if (this._graph) {
			return Promise.resolve(this._graph)
		}

		// Call API to get the graph
		return fetch(`/api/link/${this.id}/graph`, { method: 'GET' })
			.then(
				response => response.json() as Promise<SerializedGraph>,
				error => { throw new Error(`APIError (/api/link/${this.id}/graph): ${error}`) }
			)

		// Parse the data
		.then(graph => {
			
			// Get the graph from the environment
			this._graph = this.environment.get(graph)

			// Check if client is in sync with the server
			if (this._graph.id !== this._graph_id) {
				throw new Error(`ProgramError: Graph is not in sync with the server`)
			}

			return this._graph
		})
	}

	/**
	 * Creeates a new link
	 * @param environment Controller environment
	 * @param name Link name
	 * @param course Course id
	 * @param graph Graph id
	 * @returns `Promise<LinkController>` The newly created LinkController
	 * @throws `APIError` If the API request fails
	 */

	static async create(environment: ControllerEnvironment, name: string, course: number, graph: number): Promise<LinkController> {

		// Guard against SSR
		if (!browser) {
			throw new Error(`ProgramError: Cannot create link on the server`)
		}

		// Call API to create a new link
		const response = await fetch('/api/link', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, course, graph })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/link): ${error}`)
		})

		// Revive the course
		const data = await response.json() as SerializedLink
		return LinkController.revive(environment, data)
	}

	/**
	 * Revives a link from serialized data
	 * @param environment Controller environment
	 * @param data Serialized link data
	 * @returns `LinkController` The revived LinkController
	 */

	static revive(environment: ControllerEnvironment, data: SerializedLink): LinkController {
		return new LinkController(environment, data.id, data.name, data.course, data.graph)
	}
}