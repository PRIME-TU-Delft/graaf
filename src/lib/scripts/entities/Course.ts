
// Internal imports
import { ValidationData, Severity } from "./Validation"
import { Graph, type SerializedGraph } from "./Graph"

// Exports
export { Course }
export type { SerializedCourse }


// --------------------> Types


type ID = number

type SerializedCourse = {
	id: ID,
	code: string,
	name: string
}


// --------------------> Classes


class Course {
	constructor(
		public id: ID,
		public code: string,
		public name: string,
		// public links: Link[]l = [],
		public graphs: Graph[]= [],
		// public contributors: User[] = [],
		private _lazy: boolean = true
	) { }

	get lazy() {
		return this._lazy
	}

	static async revive(data: SerializedCourse, lazy: boolean = true, cascade: boolean = false): Promise<Course> {
		/* Load the course from a POGO */

		const course = new Course(data.id, data.code, data.name)
		if (!lazy) await course.unlazify(cascade)
		return course
	}

	async unlazify(cascade: boolean = false): Promise<void> {
		/* Load the course's graphs */

		// Check if the course is already loaded
		if (!this.lazy) return

		// Call the API
		const response = await fetch(`/api/courses/${this.id}/graphs`, { method: 'GET' })

		// Check the response
		if (!response.ok) throw new Error('Failed to delete graph')

		// Parse the response
		const data: SerializedGraph[] = await response.json()
		this.graphs = await Promise.all(data.map(graph => Graph.revive(graph, cascade)))


		// Unlazify
		this._lazy = false
	}

	async save() {
		/* Save the course to the database */

		// Call the API
		const response = await fetch(`/api/course`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		if (!response.ok) throw new Error('Failed to save course')
	}

	async delete(): Promise<void> {
		/* Delete the graph from the database */

		// Call the API
		const response = await fetch(`/api/course/${this.id}`, {
			method: 'DELETE'
		})

		// Check the response
		if (!response.ok) throw new Error('Failed to delete course')
	}

	validate(): ValidationData {
		/* Validate the course */

		const response = new ValidationData()

		// Check if the course code is valid
		if (this.code === '') {
			response.add({
				severity: Severity.error,
				short: 'Course has no code',
				tab: 0,
				anchor: 'code'
			})
		}

		// Check if the course name is valid
		if (this.name === '') {
			response.add({
				severity: Severity.error,
				short: 'Course has no name',
				tab: 0,
				anchor: 'name'
			})
		}

		return response
	}

	reduce(): SerializedCourse {
		/* Reduce the course to a POJO */

		return {
			id: this.id,
			code: this.code,
			name: this.name
		}
	}
}
