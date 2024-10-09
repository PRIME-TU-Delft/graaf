
// Internal dependencies
import {
	ControllerEnvironment,
	UserController,
	CourseController
} from '$scripts/controllers'
 
import { ValidationData, Severity } from '$scripts/validation'

import type { SerializedCourse, SerializedProgram, SerializedUser } from '$scripts/types'
import { error } from '@sveltejs/kit'

// Exports
export { ProgramController }


// --------------------> Controller


class ProgramController {
	private _courses?: CourseController[]
	private _admins?: UserController[]
	private _editors?: UserController[]

	private constructor(
		public environment: ControllerEnvironment,
		public id: number,
		public name: string,
		private _course_ids: number[],
		private _editor_ids: number[],
		private _admin_ids: number[]
	) {
		this.environment.add(this)
	}

	get courses(): Promise<CourseController[]> {

		// Check if courses are already loaded
		if (this._courses) {
			return Promise.resolve(this._courses)
		}
					
		// Call API to get the courses
		return fetch(`/api/program/${this.id}/courses`, { method: 'GET' })
			.then(
				response => response.json() as Promise<SerializedCourse[]>,
				error => { throw new Error(`APIError (/api/program/${this.id}/courses GET): ${error}`) }
			)
		
		// Parse the data
		.then(course_data => {

			// Get the courses from the environment
			this._courses = course_data.map(course => this.environment.get(course))

			// Check if client is in sync with the server
			const client = JSON.stringify(this._course_ids.concat().sort())
			const server = JSON.stringify(this._courses.map(course => course.id).sort())
			if (client !== server) {
				throw new Error('ProgramError: Courses are not in sync with the server')
			}

			return this._courses
		})
	}

	get admins(): Promise<UserController[]> {
		
		// Check if admins are already loaded
		if (this._admins) {
			return Promise.resolve(this._admins)
		}
					
		// Call API to get the admins
		return fetch(`/api/program/${this.id}/admins`, { method: 'GET' })
			.then(
				response => response.json() as Promise<SerializedUser[]>,
				error => { throw new Error(`APIError (/api/program/${this.id}/admins GET): ${error}`) }
			)
		
		// Parse the data
		.then(admin_data => {

			// Get the admins from the environment
			this._admins = admin_data.map(user => this.environment.get(user))

			// Check if client is in sync with the server
			const client = JSON.stringify(this._admin_ids.concat().sort())
			const server = JSON.stringify(this._admins.map(admin => admin.id).sort())
			if (client !== server) {
				throw new Error('ProgramError: Admins are not in sync with the server')
			}

			return this._admins
		})
	}

	get editors(): Promise<UserController[]> {

		// Check if editors are already loaded
		if (this._editors) {
			return Promise.resolve(this._editors)
		}

		// Call API to get the editors
		return fetch(`/api/program/${this.id}/editors`, { method: 'GET' })
			.then(
				response => response.json() as Promise<SerializedUser[]>,
				error => { throw new Error(`APIError (/api/program/${this.id}/editors GET): ${error}`) }
			)

		// Parse the data
		.then(editor_data => {

			// Get the editors from the environment
			this._editors = editor_data.map(user => this.environment.get(user))

			// Check if client is in sync with the server
			const client = JSON.stringify(this._editor_ids.concat().sort())
			const server = JSON.stringify(this._editors.map(editor => editor.id).sort())
			if (client !== server) {
				throw new Error('ProgramError: Editors are not in sync with the server')
			}

			return this._editors
		})
	}

	/**
	 * Get a program
	 * @param environment Environment to fetch the program in
	 * @param id ID of the program to fetch
	 * @returns `Promise<ProgramController>` The fetched ProgramController
	 * @throws `APIError` if the API call fails
	 */

	static async get(environment: ControllerEnvironment, id: number): Promise<ProgramController> {
		
		// Check if the program is already loaded
		const existing = environment.programs.find(program => program.id === id)
		if (existing) return existing

		// Call API to get the program
		const response = await fetch(`/api/program/${id}`, { method: 'GET' })

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/program/${id} GET): ${error}`)
		})

		// Parse the response
		const data = await response.json() as SerializedProgram
		return ProgramController.revive(environment, data)
	}

	/**
	 * Get all programs
	 * @param environment Environment to fetch the programs in
	 * @returns `Promise<ProgramController[]>` All fetched ProgramControllers
	 * @throws `APIError` if the API call fails
	 */

	static async getAll(environment: ControllerEnvironment): Promise<ProgramController[]> {

		// Call API to get all programs
		const response = await fetch(`/api/program`, { method: 'GET' })

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/program GET): ${error}`)
		})

		// Parse the response
		const data = await response.json() as SerializedProgram[]
		return data.map(program => environment.get(program))
	}

	/**
	 * Create a new program
	 * @param environment Environment to create the program in
	 * @param name Program name
	 * @returns `Promise<ProgramController>` The newly created ProgramController
	 * @throws `APIError` if the API call fails
	 */

	static async create(environment: ControllerEnvironment, name: string): Promise<ProgramController> {

		// Call API to create a new program
		const response = await fetch(`/api/program`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/program POST): ${error}`)
		})

		// Revive the course
		const data = await response.json() as SerializedProgram
		return ProgramController.revive(environment, data)
	}

	/**
	 * Revive a program from serialized data
	 * @param environment Environment to revive the program in
	 * @param data Serialized data to revive
	 * @returns `ProgramController` The revived ProgramController
	 */

	static revive(environment: ControllerEnvironment, data: SerializedProgram): ProgramController {
		return new ProgramController(environment, data.id, data.name, data.courses, data.editors, data.admins)
	}

	/**
	 * Validate the program
	 * @returns `boolean` Whether the program is valid
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		if (!this.hasName()) {
			validation.add({
				severity: Severity.error,
				short: 'Program has no name'
			})

		} else if (await this.hasDuplicateName()) {
			validation.add({
				severity: Severity.error,
				short: 'Program name is not unique'
			})
		}

		if (!this.hasAdmins()) {
			validation.add({
				severity: Severity.warning,
				short: 'Program has no admins'
			})
		}

		return validation
	}

	/**
	 * Serialize the program
	 * @returns `SerializedProgram` Serialized program
	 */

	reduce(): SerializedProgram {
		return {
			id: this.id,
			name: this.name,
			courses: this._course_ids,
			admins: this._admin_ids,
			editors: this._editor_ids
		}
	}

	/**
	 * Save the program
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Call API to save the program
		await fetch(`/api/program`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/program PUT): ${error}`)
		})
	}

	/**
	 * Delete the program
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Call API to delete the program
		await fetch(`/api/program`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: this.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/program DELETE): ${error}`)
		})

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		this.environment.courses
			.filter(course => this._course_ids.includes(course.id))
			.forEach(course => course.unassignFromProgram(this, false))

		this.environment.users
			.filter(user => this._admin_ids.includes(user.id))
			.forEach(user => user.resignAsProgramAdmin(this, false))
		
		this.environment.users
			.filter(user => this._editor_ids.includes(user.id))
			.forEach(user => user.resignAsProgramEditor(this, false))

		// Remove from environment
		this.environment.remove(this)
	}

	/**
	 * Check if the program has a name
	 * @returns `boolean` Whether the program has a name
	 */

	hasName(): boolean {
		return this.name.trim() !== ''
	}
	
	/**
	 * Check if the program has a duplicate name
	 * @returns `Promise<boolean>` Whether the program has a duplicate name
	 */

	async hasDuplicateName(): Promise<boolean> {
		const programs = await ProgramController.getAll(this.environment)
		return programs.some(program => program.id !== this.id && program.name === this.name)
	}

	/**
	 * Check if the program has admins
	 * @returns `boolean` Whether the program has admins
	 */

	hasAdmins(): boolean {
		return this._admin_ids.length > 0
	}

	/**
	 * Assign a course to the program
	 * @param course Course to assign to the program
	 * @param mirror Whether to mirror the assignment
	 * @throws `ProgramError` if the course is already assigned to the program
	 */

	assignCourse(course: CourseController, mirror: boolean = true): void {
		if (this._course_ids.includes(course.id))
			throw new Error(`ProgramError: Program is already assigned to Course with ID ${course.id}`)
		this._course_ids.push(course.id)
		this._courses?.push(course)

		if (mirror) {
			course.assignToProgram(this, false)
		}
	}

	/**
	 * Assign a user as an admin of the program. Unassigns the user as an editor if they are one
	 * @param user User to assign as an admin
	 * @param mirror Whether to mirror the assignment
	 * @throws `ProgramError` if the user is already an admin of the program
	 */

	assignAdmin(user: UserController, mirror: boolean = true): void {
		if (this._admin_ids.includes(user.id))
			throw new Error(`ProgramError: User with ID ${user.id} is already an admin of Program with ID ${this.id}`)
		this._admin_ids.push(user.id)
		this._admins?.push(user)

		if (this._editor_ids.includes(user.id)) {
			this.unassignEditor(user)
		}

		if (mirror) {
			user.becomeProgramAdmin(this, false)
		}
	}

	/**
	 * Assign a user as an editor of the program. Unassigns the user as an admin if they are one
	 * @param user User to assign as an editor
	 * @param mirror Whether to mirror the assignment
	 * @throws `ProgramError` if the user is already an editor of the program
	 */

	assignEditor(user: UserController, mirror: boolean = true): void {
		if (this._editor_ids.includes(user.id))
			throw new Error(`ProgramError: User with ID ${user.id} is already an editor of Program with ID ${this.id}`)
		this._editor_ids.push(user.id)
		this._editors?.push(user)

		if (this._admin_ids.includes(user.id)) {
			this.unassignAdmin(user)
		}

		if (mirror) {
			user.becomeProgramEditor(this, false)
		}
	}

	/**
	 * Unassign a course from the program
	 * @param course Course to unassign from the program
	 * @param mirror Whether to mirror the unassignment
	 * @throws `ProgramError` if the course is not assigned to the program
	 */

	unassignCourse(course: CourseController, mirror: boolean = true): void {
		if (!this._course_ids.includes(course.id))
			throw new Error(`ProgramError: Program is not assigned to Course with ID ${course.id}`)
		this._course_ids = this._course_ids.filter(id => id !== course.id)
		this._courses = this._courses?.filter(course => course.id !== course.id)

		if (mirror) {
			course.unassignFromProgram(this, false)
		}
	}

	/**
	 * Unassign an admin from the program
	 * @param user User to unassign as an admin
	 * @param mirror Whether to mirror the unassignment
	 * @throws `ProgramError` if the user is not an admin of the program
	 */

	unassignAdmin(user: UserController, mirror: boolean = true): void {
		if (!this._admin_ids.includes(user.id))
			throw new Error(`ProgramError: User with ID ${user.id} is not an admin of Program with ID ${this.id}`)
		this._admin_ids = this._admin_ids.filter(id => id !== user.id)
		this._admins = this._admins?.filter(admin => admin.id !== user.id)

		if (mirror) {
			user.resignAsProgramAdmin(this, false)
		}
	}

	/**
	 * Unassign an editor from the program
	 * @param user User to unassign as an editor
	 * @param mirror Whether to mirror the unassignment
	 * @throws `ProgramError` if the user is not an editor of the program
	 */

	unassignEditor(user: UserController, mirror: boolean = true): void {
		if (!this._editor_ids.includes(user.id))
			throw new Error(`ProgramError: User with ID ${user.id} is not an editor of Program with ID ${this.id}`)
		this._editor_ids = this._editor_ids.filter(id => id !== user.id)
		this._editors = this._editors?.filter(editor => editor.id !== user.id)

		if (mirror) {
			user.resignAsProgramEditor(this, false)
		}
	}
}
