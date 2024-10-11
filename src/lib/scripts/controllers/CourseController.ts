
// External dependencies
import { browser } from '$app/environment'

// Internal dependencies
import  {
	ControllerEnvironment,
	UserController,
	ProgramController,
	GraphController
} from '$scripts/controllers'

import { ValidationData, Severity } from '$scripts/validation'
import type { SerializedCourse, SerializedGraph, SerializedProgram, SerializedUser } from '$scripts/types'

// Exports
export { CourseController }


// --------------------> Controller


class CourseController {
	private _graphs?: GraphController[]
	private _admins?: UserController[]
	private _editors?: UserController[]
	private _programs?: ProgramController[]

	private constructor(
		public environment: ControllerEnvironment,
		public id: number,
		public code: string,
		public name: string,
		public archived: boolean,
		private _graph_ids: number[],
		private _editor_ids: number[],
		private _admin_ids: number[],
		private _program_ids: number[]
	) {
		this.environment.add(this)
	}

	get graphs(): Promise<GraphController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if graphs are already loaded
		if (this._graphs) {
			return Promise.resolve(this._graphs)
		}

		// Call API to get the courses
		return fetch(`/api/course/${this.id}/graphs`, { method: 'GET' })
			.then(
				response => response.json() as Promise<SerializedGraph[]>,
				error => { throw new Error(`APIError (/api/course/${this.id}/graphs GET): ${error}`) }
			)

		// Parse the data
		.then(data => {

			// Revive courses
			this._graphs = data.map(graph => {
				const existing = this.environment.graphs.find(existing => existing.id === graph.id)
				return existing ? existing : GraphController.revive(this.environment, graph)
			})

			// Check if graphs are in sync
			const client = JSON.stringify(this._graph_ids.concat().sort())
			const server = JSON.stringify(this._graphs.map(graph => graph.id).sort())
			if (client !== server) {
				throw new Error('CourseError: Graphs are not in sync')
			}

			return this._graphs
		})
	}

	get admins(): Promise<UserController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if admins are already loaded
		if (this._admins) {
			return Promise.resolve(this._admins)
		}

		// Call API to get the courses
		return fetch(`/api/course/${this.id}/admins`, { method: 'GET' })
			.then(
				response => response.json() as Promise<SerializedUser[]>,
				error => { throw new Error(`APIError (/api/course/${this.id}/admins GET): ${error}`) }
			)

		// Parse the data
		.then(data => {

			// Revive courses
			this._admins = data.map(admin => {
				const existing = this.environment.users.find(existing => existing.id === admin.id)
				return existing ? existing : UserController.revive(this.environment, admin)
			})

			// Check if admins are in sync
			const client = JSON.stringify(this._admin_ids.concat().sort())
			const server = JSON.stringify(this._admins.map(admin => admin.id).sort())
			if (client !== server) {
				throw new Error('CourseError: Admins are not in sync')
			}

			return this._admins
		})
	}

	get editors(): Promise<UserController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if editors are already loaded
		if (this._editors) {
			return Promise.resolve(this._editors)
		}

		// Call API to get the courses
		return fetch(`/api/course/${this.id}/editors`, { method: 'GET' })
			.then(
				response => response.json() as Promise<SerializedUser[]>,
				error => { throw new Error(`APIError (/api/course/${this.id}/editors GET): ${error}`) }
			)

		// Parse the data
		.then(data => {

			// Revive courses
			this._editors = data.map(editor => {
				const existing = this.environment.users.find(existing => existing.id === editor.id)
				return existing ? existing : UserController.revive(this.environment, editor)
			})

			// Check if editors are in sync
			const client = JSON.stringify(this._editor_ids.concat().sort())
			const server = JSON.stringify(this._editors.map(editor => editor.id).sort())
			if (client !== server) {
				throw new Error('CourseError: Editors are not in sync')
			}

			return this._editors
		})
	}

	get programs(): Promise<ProgramController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if programs are already loaded
		if (this._programs) {
			return Promise.resolve(this._programs)
		}

		// Call API to get the courses
		return fetch(`/api/course/${this.id}/programs`, { method: 'GET' })
			.then(
				response => response.json() as Promise<SerializedProgram[]>,
				error => { throw new Error(`APIError (/api/course/${this.id}/programs GET): ${error}`) }
			)

		// Parse the data
		.then(data => {

			// Revive courses
			this._programs = data.map(program => {
				const existing = this.environment.programs.find(existing => existing.id === program.id)
				return existing ? existing : ProgramController.revive(this.environment, program)
			})

			// Check if programs are in sync
			const client = JSON.stringify(this._program_ids.concat().sort())
			const server = JSON.stringify(this._programs.map(program => program.id).sort())
			if (client !== server) {
				throw new Error('CourseError: Programs are not in sync')
			}

			return this._programs
		})
	}

	/**
	 * Get a course
	 * @param environment Environment to get the course from
	 * @param id ID of the course to get
	 * @returns `Promise<CourseController>` The requested CourseController
	 * @throws `APIError` if the API call fails
	 */

	static async get(environment: ControllerEnvironment, id: number): Promise<CourseController> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if the course is already loaded
		const existing = environment.courses.find(existing => existing.id === id)
		if (existing) return existing

		// Call API to get the course
		const response = await fetch(`/api/course/${id}`, { method: 'GET' })

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/course/${id} GET): ${error}`)
		})

		// Revive the course
		const data = await response.json() as SerializedCourse
		return CourseController.revive(environment, data)
	}

	/**
	 * Get all courses
	 * @param environment Environment to get the courses from
	 * @returns `Promise<CourseController[]>` All CourseControllers
	 * @throws `APIError` if the API call fails
	 */

	static async getAll(environment: ControllerEnvironment): Promise<CourseController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Call API to get the courses
		const response = await fetch(`/api/course`, { method: 'GET' })

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/course GET): ${error}`)
		})

		// Parse the response
		const data = await response.json() as SerializedCourse[]
		return data.map(course => {
			const existing = environment.courses.find(existing => existing.id === course.id)
			return existing ? existing : CourseController.revive(environment, course)
		})
	}

	/**
	 * Create a new course
	 * @param environment Environment to create the course in
	 * @param code Course code
	 * @param name Course name
	 * @returns `Promise<CourseController>` The newly created CourseController
	 * @throws `APIError` if the API call fails
	 */

	static async create(environment: ControllerEnvironment, code: string, name: string): Promise<CourseController> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Call API to create a new course
		const response = await fetch(`/api/course`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, name })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/course POST): ${error}`)
		})

		// Revive the course
		const data = await response.json()
		return CourseController.revive(environment, data)
	}

	/**
	 * Revive a course from serialized data
	 * @param environment Environment to revive the course in
	 * @param data Serialized data to revive
	 * @returns `CourseController` The revived Course
	 */

	static revive(environment: ControllerEnvironment, data: SerializedCourse): CourseController {
		return new CourseController(environment, data.id, data.code, data.name, data.archived, data.graphs, data.editors, data.admins, data.programs)
	}

	/**
	 * Validate the course
	 * @returns `Promise<ValidationData>` Validation data
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		if (!this.hasName()) {
			validation.add({
				severity: Severity.error,
				short: 'Course has no name',
				long: 'Please provide a name for the course'
			})
		}

		if (!this.hasCode()) {
			validation.add({
				severity: Severity.error,
				short: 'Course has no code',
				long: 'Please provide a code for the course'
			})
		}

		else if (await this.hasDuplicateCode()) {
			validation.add({
				severity: Severity.error,
				short: 'Course code is already in use',
				long: 'Please provide a unique code for the course'
			})
		}

		if (!this.hasAdmins()) {
			validation.add({
				severity: Severity.warning,
				short: 'Course has no admins',
				long: 'Please assign at least one admin to the course'
			})
		}

		return validation
	}

	/**
	 * Serialize the course
	 * @returns `SerializedCourse` Serialized course
	 */

	reduce(): SerializedCourse {
		return {
			id: this.id,
			code: this.code,
			name: this.name,
			archived: this.archived,
			graphs: this._graph_ids,
			admins: this._admin_ids,
			editors: this._editor_ids,
			programs: this._program_ids
		}
	}

	/**
	 * Save the course
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Call API to save the course
		await fetch(`/api/course`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/course PUT): ${error}`)
		})
	}

	/**
	 * Delete the course, and all related graphs
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Call API to delete the course
		await fetch(`/api/course`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: this.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/course DELETE): ${error}`)
		})

		// Delete all related graphs
		const graphs = await this.graphs
		await Promise.all(graphs.map(graph => graph.delete()))

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		this.environment.users
			.filter(user => this._admin_ids.includes(user.id))
			.forEach(user => user.resignAsCourseAdmin(this, false))

		this.environment.users
			.filter(user => this._editor_ids.includes(user.id))
			.forEach(user => user.resignAsCourseEditor(this, false))

		this.environment.programs
			.filter(program => this._program_ids.includes(program.id))
			.forEach(program => program.unassignCourse(this, false))

		// Remove from environment
		this.environment.remove
	}

	/**
	 * Check if the course has a name
	 * @returns `boolean` Whether the course has a name
	 */

	private hasName(): boolean {
		return this.name.trim() !== ''
	}

	/**
	 * Check if the course has a code
	 * @returns `boolean` Whether the course has a code
	 */

	private hasCode(): boolean {
		return this.code.trim() !== ''
	}

	/**
	 * Check if the course has a duplicate code
	 * @returns `Promise<boolean>` Whether the course has a duplicate code
	 */

	private async hasDuplicateCode(): Promise<boolean> {
		const courses = await CourseController.getAll(this.environment)
		return courses.some(course => course.id !== this.id && course.code === this.code)
	}

	/**
	 * Check if the course has admins
	 * @returns `boolean` Whether the course has admins
	 */

	private hasAdmins(): boolean {
		return this._admin_ids.length > 0
	}

	/**
	 * Get the index of a graph in the course
	 * @param graph Graph to get the index of
	 * @returns `number` Index of the graph
	 * @throws `CourseError` if the graph is not assigned to the course
	 */

	graphIndex(graph: GraphController): number {
		const index = this._graph_ids.indexOf(graph.id)
		if (index === -1) throw new Error(`CourseError: Graph with ID ${graph.id} is not assigned to Course`)
		return index
	}

	/**
	 * Assign the course to a program
	 * @param program Program to assign the course to
	 * @param mirror Whether to mirror the assignment
	 * @throws `CourseError` if the course is already assigned to the program
	 */

	assignToProgram(program: ProgramController, mirror: boolean = true): void {
		if (this._program_ids.includes(program.id))
			throw new Error(`CourseError: Course is already assigned to Program with ID ${program.id}`)
		this._program_ids.push(program.id)
		this._programs?.push(program)

		if (mirror) {
			program.assignCourse(this, false)
		}
	}

	/**
	 * Assign a graph to the course
	 * @param graph Graph to assign to the course
	 * @throws `CourseError` if the graph is already assigned to the course
	 */

	assignGraph(graph: GraphController): void {
		if (this._graph_ids.includes(graph.id))
			throw new Error(`CourseError: Course is already assigned to Graph with ID ${graph.id}`)
		this._graph_ids.push(graph.id)
		this._graphs?.push(graph)
	}

	/**
	 * Assign a user as an admin of the course. Unassigns the user as an editor if they are one
	 * @param user User to assign as an admin
	 * @param mirror Whether to mirror the assignment
	 * @throws `CourseError` if the user is already an admin of the course
	 */

	assignAdmin(user: UserController, mirror: boolean = true): void {
		if (this._admin_ids.includes(user.id))
			throw new Error(`CourseError: User with ID ${user.id} is already an admin of Course with ID ${this.id}`)
		this._admin_ids.push(user.id)
		this._admins?.push(user)

		if (this._editor_ids.includes(user.id)) {
			this.unassignEditor(user)
		}

		if (mirror) {
			user.becomeCourseAdmin(this, false)
		}
	}

	/**
	 * Assign a user as an editor of the course. Unassigns the user as an admin if they are one
	 * @param user User to assign as an editor
	 * @param mirror Whether to mirror the assignment
	 * @throws `CourseError` if the user is already an editor of the course
	 */

	assignEditor(user: UserController, mirror: boolean = true): void {
		if (this._editor_ids.includes(user.id))
			throw new Error(`CourseError: User with ID ${user.id} is already an editor of Course with ID ${this.id}`)
		this._editor_ids.push(user.id)
		this._editors?.push(user)

		if (this._admin_ids.includes(user.id)) {
			this.unassignAdmin(user)
		}

		if (mirror) {
			user.becomeCourseEditor(this, false)
		}
	}

	/**
	 * Unassign the course from a program
	 * @param program Program to unassign the course from
	 * @param mirror Whether to mirror the unassignment
	 * @throws `CourseError` if the course is not assigned to the program
	 */

	unassignFromProgram(program: ProgramController, mirror: boolean = true): void {
		if (!this._program_ids.includes(program.id))
			throw new Error(`CourseError: Course is not assigned to Program with ID ${program.id}`)
		this._program_ids = this._program_ids.filter(id => id !== program.id)
		this._programs = this._programs?.filter(program => program.id !== program.id)

		if (mirror) {
			program.unassignCourse(this, false)
		}
	}

	/**
	 * Unassign a graph from the course
	 * @param graph Graph to unassign from the course
	 * @throws `CourseError` if the graph is not assigned to the course
	 */

	unassignGraph(graph: GraphController): void {
		if (!this._graph_ids.includes(graph.id))
			throw new Error(`CourseError: Course is not assigned to Graph with ID ${graph.id}`)
		this._graph_ids = this._graph_ids.filter(id => id !== graph.id)
		this._graphs = this._graphs?.filter(graph => graph.id !== graph.id)
	}

	/**
	 * Unassign an admin from the course
	 * @param user User to unassign as an admin
	 * @param mirror Whether to mirror the unassignment
	 * @throws `CourseError` if the user is not an admin of the course
	 */

	unassignAdmin(user: UserController, mirror: boolean = true): void {
		if (!this._admin_ids.includes(user.id))
			throw new Error(`CourseError: User with ID ${user.id} is not an admin of Course with ID ${this.id}`)
		this._admin_ids = this._admin_ids.filter(id => id !== user.id)
		this._admins = this._admins?.filter(admin => admin.id !== user.id)

		if (mirror) {
			user.resignAsCourseAdmin(this, false)
		}
	}

	/**
	 * Unassign an editor from the course
	 * @param user User to unassign as an editor
	 * @param mirror Whether to mirror the unassignment
	 * @throws `CourseError` if the user is not an editor of the course
	 */

	unassignEditor(user: UserController, mirror: boolean = true): void {
		if (!this._editor_ids.includes(user.id))
			throw new Error(`CourseError: User with ID ${user.id} is not an editor of Course with ID ${this.id}`)
		this._editor_ids = this._editor_ids.filter(id => id !== user.id)
		this._editors = this._editors?.filter(editor => editor.id !== user.id)

		if (mirror) {
			user.resignAsCourseEditor(this, false)
		}
	}
}