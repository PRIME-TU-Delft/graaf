
// Internal imports
import { GraphController, ProgramController } from '$scripts/controllers'
import { ValidationData, Severity } from '$scripts/validation'
import type { SerializedCourse, SerializedGraph } from '$scripts/types'

// Exports
export { CourseController }


// --------------------> Classes


class CourseController {
	constructor(
		public id: number,
		public code: string,
		public name: string,
		private _graphs: GraphController[] = [],
		private _compact: boolean = true
		// public links: Link[] = [],
		// public contributors: User[] = [],
		// public programs: ProgramController[]= [],
	) { }

	get compact() {
		return this._compact
	}

	private set compact(value: boolean) {
		this._compact = value
	}

	get expanded() {
		return !this._compact
	}

	private set expanded(value: boolean) {
		this._compact = !value
	}

	get graphs() {
		
		// Check if the graphs are expanded
		if (this.compact) throw new Error('Failed to get graphs: Course is too compact')
		return this._graphs
	}

	set graphs(value: GraphController[]) {
		this._graphs = value
	}

	static async create(code: string, name: string, program?: ProgramController, depth: number = 0): Promise<CourseController> {
		/* Create a new course */

		// TODO for now we assume that the program is always provided
		if (!program) throw new Error('Failed to create course: Program is required')

		// Call the API
		const response = await fetch(`/api/program/${program.id}/course`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, name })
		})

		// Check the response
		.catch(error => {
			throw new Error(`Failed to create course: ${error}`)
		})

		// Revive the course
		const data: SerializedCourse = await response.json()
		const course = await CourseController.revive(data, depth)
		program.courses.push(course)

		return course
	}

	static async revive(data: SerializedCourse, depth: number = 0): Promise<CourseController> {
		/* Load the course from a POGO */

		const course = new CourseController(data.id, data.code, data.name)
		await course.expand(depth)
		return course
	}

	async expand(depth: number = 1): Promise<CourseController> {
		/* Expand the program */

		// Check if expansion depth is reached
		if (depth < 1) return this

		// Check if the program is already expanded
		if (this.expanded) {
			await Promise.all(this.graphs.map(graph => graph.expand(depth - 1)))
		}

		else {

			// Call the API
			const response = await fetch(`/api/course/${this.id}/graph`, { method: 'GET' })
				.catch(error => { throw new Error(`Failed to load course: ${error}`) })
			const data: SerializedGraph[] = await response.json()

			// Revive the courses
			this.graphs = await Promise.all(data.map(graph => GraphController.revive(graph, depth - 1)))
			this.expanded = true
		}

		return this
	}

	async save() {
		/* Save the course to the database */

		// Call the API
		await fetch(`/api/course`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		.catch(error => { 
			throw new Error(`Failed to save course: ${error}`) 
		})
	}

	async delete(): Promise<void> {
		/* Delete the graph from the database */

		// Call the API
		await fetch(`/api/course/${this.id}`, { method: 'DELETE' })
			.catch(error => { throw new Error(`Failed to delete course: ${error}`) })
	}

	validate(): ValidationData {
		/* Validate the course */

		const result = new ValidationData()

		// Check if the course code is valid
		if (this.code === '') {
			result.add({
				severity: Severity.error,
				short: 'Course has no code',
				tab: 0,
				anchor: 'code'
			})
		}

		// Check if the course name is valid
		if (this.name === '') {
			result.add({
				severity: Severity.error,
				short: 'Course has no name',
				tab: 0,
				anchor: 'name'
			})
		}

		return result
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
