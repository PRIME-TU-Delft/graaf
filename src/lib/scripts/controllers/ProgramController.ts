
// External dependencies
import { browser } from '$app/environment'

// Internal dependencies
import {
	ControllerEnvironment,
	CourseController,
	UserController
} from '$scripts/controllers'

import { ValidationData, Severity } from '$scripts/validation'
import type {
	SerializedProgram,
	SerializedCourse,
	SerializedUser
} from '$scripts/types'

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
		this.environment.remember(this)
	}

	get course_ids(): number[] {
		return this._course_ids.concat()
	}

	get admin_ids(): number[] {
		return this._admin_ids.concat()
	}

	get editor_ids(): number[] {
		return this._editor_ids.concat()
	}

	/**
	 * Create a new program
	 * @param environment Environment to create the program in
	 * @param name Program name
	 * @returns `Promise<ProgramController>` The newly created ProgramController
	 * @throws `APIError` If the API call fails
	 */

	static async create(environment: ControllerEnvironment, name: string): Promise<ProgramController> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

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
		return new ProgramController(
			environment,
			data.id,
			data.name,
			data.courses,
			data.editors,
			data.admins
		)
	}

	/**
	 * Validate the program
	 * @returns `boolean` Whether the program is valid
	 */

	validate(): ValidationData {
		const validation = new ValidationData()

		if (this.name.trim() === '') {
			validation.add({
				severity: Severity.error,
				short: 'Program has no name'
			})

		}

		if (this.admin_ids.length === 0) {
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
			name: this.name.trim(),
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

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

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

		// Guard against SSR
		if (!browser) {
			return Promise.resolve()
		}

		// Call API to delete the program
		await fetch(`/api/program/${this.id}`, {
			method: 'DELETE'
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/program/${this.id} DELETE): ${error}`)
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
		this.environment.forget(this)
	}

	/**
	 * Get the courses of the program
	 * @returns `Promise<CourseController[]>` Courses of the program
	 * @throws `APIError` if the API call fails
	 * @throws `ProgramError` if the client is not in sync with the server
	 */

	async getCourses(): Promise<CourseController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if courses are already loaded
		if (this._courses) {
			return this._courses.concat()
		}

		// Call API to get the courses
		const response = await fetch(`/api/program/${this.id}/courses`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/program/${this.id}/courses GET): ${error}`)
			})

		// Parse the data
		const data = await response.json() as SerializedCourse[]
		this._courses = data.map(course => this.environment.get(course))

		// Check if client is in sync with the server
		const client = JSON.stringify(this._course_ids.concat().sort())
		const server = JSON.stringify(this._courses.map(course => course.id).sort())
		if (client !== server) {
			throw new Error('ProgramError: Courses are not in sync with the server')
		}

		return this._courses.concat()
	}

	/**
	 * Get the Admins of the program
	 * @returns `Promise<UserController[]>` Admins of the program
	 * @throws `APIError` if the API call fails
	 * @throws `ProgramError` if the client is not in sync with the server
	 */

	async getAdmins(): Promise<UserController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if admins are already loaded
		if (this._admins) {
			return this._admins.concat()
		}

		// Call API to get the admins
		const response = await fetch(`/api/program/${this.id}/admins`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/program/${this.id}/admins GET): ${error}`)
			})

		// Parse the data
		const data = await response.json() as SerializedUser[]
		this._admins = data.map(user => this.environment.get(user))

		// Check if client is in sync with the server
		const client = JSON.stringify(this._admin_ids.concat().sort())
		const server = JSON.stringify(this._admins.map(admin => admin.id).sort())
		if (client !== server) {
			throw new Error('ProgramError: Admins are not in sync with the server')
		}

		return this._admins.concat()
	}

	/**
	 * Get the editors of the program
	 * @returns `Promise<UserController[]>` Editors of the program
	 * @throws `APIError` if the API call fails
	 * @throws `ProgramError` if the client is not in sync with the server
	 */

	async getEditors(): Promise<UserController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if editors are already loaded
		if (this._editors) {
			return this._editors.concat()
		}

		// Call API to get the editors
		const response = await fetch(`/api/program/${this.id}/editors`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/program/${this.id}/editors GET): ${error}`)
			})

		// Parse the data
		const data = await response.json() as SerializedUser[]
		this._editors = data.map(user => this.environment.get(user))

		// Check if client is in sync with the server
		const client = JSON.stringify(this._editor_ids.concat().sort())
		const server = JSON.stringify(this._editors.map(editor => editor.id).sort())
		if (client !== server) {
			throw new Error('ProgramError: Editors are not in sync with the server')
		}

		return this._editors.concat()
	}

	/**
	 * Assign a course to the program
	 * @param course Course to assign to the program
	 * @param mirror Whether to mirror the assignment
	 */

	assignCourse(course: CourseController, mirror: boolean = true): void {
		if (this._course_ids.includes(course.id)) return
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
	 */

	assignAdmin(user: UserController, mirror: boolean = true): void {
		if (this._admin_ids.includes(user.id)) return
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
	 */

	assignEditor(user: UserController, mirror: boolean = true): void {
		if (this._editor_ids.includes(user.id)) return
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
	 */

	unassignCourse(course: CourseController, mirror: boolean = true): void {
		if (!this._course_ids.includes(course.id)) return
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
	 */

	unassignAdmin(user: UserController, mirror: boolean = true): void {
		if (!this._admin_ids.includes(user.id)) return
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
	 */

	unassignEditor(user: UserController, mirror: boolean = true): void {
		if (!this._editor_ids.includes(user.id)) return
		this._editor_ids = this._editor_ids.filter(id => id !== user.id)
		this._editors = this._editors?.filter(editor => editor.id !== user.id)

		if (mirror) {
			user.resignAsProgramEditor(this, false)
		}
	}
}
