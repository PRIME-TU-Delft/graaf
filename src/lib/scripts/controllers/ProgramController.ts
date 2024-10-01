
// Internal imports
import { CourseController } from '$scripts/controllers'
import type { SerializedProgram, SerializedCourse } from '$scripts/types'

// Exports
export { ProgramController }


// --------------------> Classes


class ProgramController {
	constructor(
		public id: number,
		public name: string,
		private _courses: CourseController[]= [],
		private _compact: boolean = true
		// public coordinators: User[] = [],
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

	get courses() {

		// Check if the courses are expanded
		if (this.compact) throw new Error('Failed to get courses: Program is too compact')
		return this._courses
	}

	set courses(value: CourseController[]) {
		this._courses = value
	}

	static async create(name: string, depth: number = 0): Promise<ProgramController> {
		/* Create a new program */

		// Call the API
		const response = await fetch(`/api/program`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		})
		
		// Check the response
		.catch(error => {
			throw new Error(`Failed to create program: ${error}`)
		})
		
		// Revive the program
		const data: SerializedProgram = await response.json()
		return await ProgramController.revive(data, depth)
	}

	static async revive(data: SerializedProgram, depth: number = 0): Promise<ProgramController> {
		/* Load the program from a POGO */

		const program = new ProgramController(data.id, data.name)
		await program.expand(depth)
		return program
	}

	async expand(depth: number = 1): Promise<ProgramController> {
		/* Expand the program */

		// Check if expansion depth is reached
		if (depth < 1) return this

		// Check if the course is already expanded
		if (this.expanded) {
			await Promise.all(this.courses.map(course => course.expand(depth - 1)))
		}

		else {
	
			this.expanded = true

			// Call the API
			const response = await fetch(`/api/program/${this.id}/course`, { method: 'GET' })
				.catch(error => { throw new Error(`Failed to load course: ${error}`) })
			const data: SerializedCourse[] = await response.json()

			// Revive the courses
			this.courses = await Promise.all(data.map(graph => CourseController.revive(graph, depth - 1)))
		}

		return this
	}
}
