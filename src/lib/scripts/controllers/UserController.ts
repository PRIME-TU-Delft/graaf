
// Internal dependencies
import {
	ControllerEnvironment,
	ProgramController,
	CourseController
} from '$scripts/controllers'

import type { SerializedUser } from '$scripts/types'

// Exports
export { UserController }


// --------------------> Controller


class UserController {
	private _program_admins?: ProgramController[]
	private _program_editors?: ProgramController[]
	private _course_admins?: CourseController[]
	private _course_editors?: CourseController[]

	constructor(
		public environment: ControllerEnvironment,
		public id: number,
		public role: string,
		public netid: string,
		public first_name: string,
		public last_name: string,
		public email: string,
		private _program_admin_ids: number[],
		private _program_editor_ids: number[],
		private _course_admin_ids: number[],
		private _course_editor_ids: number[]
	) {
		this.environment.add(this)
	}

	get program_admins(): ProgramController[] {
		if (this._program_admins) return this._program_admins
		throw new Error('UserError: Program admins not loaded')
	}

	get program_editors(): ProgramController[] {
		if (this._program_editors) return this._program_editors
		throw new Error('UserError: Program editors not loaded')
	}

	get course_admins(): CourseController[] {
		if (this._course_admins) return this._course_admins
		throw new Error('UserError: Course admins not loaded')
	}

	get course_editors(): CourseController[] {
		if (this._course_editors) return this._course_editors
		throw new Error('UserError: Course editors not loaded')
	}

	/**
	 * Create a new user
	 * @param environment Environment to create the user in
	 * @param netid User netid
	 * @param first_name User first name
	 * @param last_name User last name
	 * @param email User email
	 * @returns `Promise<UserController>` The newly created UserController
	 * @throws `APIError` if the API call fails
	 */

	static async create(environment: ControllerEnvironment, netid: string, first_name: string, last_name: string, email: string): Promise<UserController> {

		// Call API to create a new user
		const response = await fetch(`/api/user`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ netid, first_name, last_name, email })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/user POST): ${error}`)
		})

		// Revive the user
		const data = await response.json() as SerializedUser
		return UserController.revive(environment, data)
	}

	/**
	 * Revive a user from serialized data
	 * @param environment Environment to revive the user in
	 * @param data Serialized data to revive
	 * @returns `UserController` The revived UserController
	 */

	static revive(environment: ControllerEnvironment, data: SerializedUser): UserController {
		return new UserController(environment, data.id, data.role, data.netid, data.first_name, data.last_name, data.email, data.program_admin, data.program_editor, data.course_admin, data.course_editor)
	}

	/**
	 * Load the user's properties
	 * @param properties Properties to load
	 * @throws `UserError` if a property is already loaded or invalid
	 */

	async load(...properties: ('program_admins' | 'program_editors' | 'course_admins' | 'course_editors')[]): Promise<void> {
		if (properties.length === 0) {
			return await this.load('program_admins', 'program_editors', 'course_admins', 'course_editors')
		}

		for (const property of properties) {
			switch (property) {
				case 'program_admins':
					if (this._program_admins) throw new Error('UserError: Program admins already loaded')
					this._program_admins = await this.environment.getPrograms(this._program_admin_ids)
					break

				case 'program_editors':
					if (this._program_editors) throw new Error('UserError: Program editors already loaded')
					this._program_editors = await this.environment.getPrograms(this._program_editor_ids)
					break

				case 'course_admins':
					if (this._course_admins) throw new Error('UserError: Course admins already loaded')
					this._course_admins = await this.environment.getCourses(this._course_admin_ids)
					break

				case 'course_editors':
					if (this._course_editors) throw new Error('UserError: Course editors already loaded')
					this._course_editors = await this.environment.getCourses(this._course_editor_ids)
					break
				
				default:
					throw new Error(`UserError: Property '${property}' is not valid`)
			}
		}
	}

	/**
	 * Serialize the user
	 * @returns `SerializedUser` Serialized user
	 */

	reduce(): SerializedUser {
		return {
			id: this.id,
			role: this.role,
			netid: this.netid,
			first_name: this.first_name,
			last_name: this.last_name,
			email: this.email,
			program_admin: this._program_admin_ids,
			program_editor: this._program_editor_ids,
			course_admin: this._course_admin_ids,
			course_editor: this._course_editor_ids
		}
	}

	/**
	 * Save the user
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Call API to save the user
		await fetch(`/api/user`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/user PUT): ${error}`)
		})
	}

	/**
	 * Delete the user
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Call API to delete the user
		await fetch(`/api/user`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: this.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/user DELETE): ${error}`)
		})

		// Resign everywhere (mirroring is not necessary, as this object will be deleted)
		const program_admins = await this.environment.getPrograms(this._program_admin_ids, false)
		program_admins.forEach(program => program.unassignAdmin(this, false))

		const program_editors = await this.environment.getPrograms(this._program_editor_ids, false)
		program_editors.forEach(program => program.unassignEditor(this, false))

		const course_admins = await this.environment.getCourses(this._course_admin_ids, false)
		course_admins.forEach(course => course.unassignAdmin(this, false))

		const course_editors = await this.environment.getCourses(this._course_editor_ids, false)
		course_editors.forEach(course => course.unassignEditor(this, false))

		// Remove from environment
		this.environment.remove(this)
	}

	/**
	 * Assign a user as an admin of a program. Resigns the user as an editor if they are one
	 * @param program Program to assign the user as an admin of
	 * @param mirror Whether to mirror the assignment
	 * @throws `UserError` if the user is already an admin of the program
	 */

	becomeProgramAdmin(program: ProgramController, mirror: boolean = true): void {
		if (this._program_admin_ids.includes(program.id))
			throw new Error(`UserError: User is already an admin of Program with ID ${program.id}`)
		this._program_admin_ids.push(program.id)
		this._program_admins?.push(program)

		if (this._program_editor_ids.includes(program.id)) {
			this.resignAsProgramEditor(program)
		}

		if (mirror) {
			program.assignAdmin(this, false)
		}
	}

	/**
	 * Assign a user as an editor of a program. Resigns the user as an admin if they are one
	 * @param program Program to assign the user as an editor of
	 * @param mirror Whether to mirror the assignment
	 * @throws `UserError` if the user is already an editor of the program
	 */

	becomeProgramEditor(program: ProgramController, mirror: boolean = true): void {
		if (this._program_editor_ids.includes(program.id))
			throw new Error(`UserError: User is already an editor of Program with ID ${program.id}`)
		this._program_editor_ids.push(program.id)
		this._program_editors?.push(program)

		if (this._program_admin_ids.includes(program.id)) {
			this.resignAsProgramAdmin(program)
		}

		if (mirror) {
			program.assignEditor(this, false)
		}
	}

	/**
	 * Assign a user as an admin of a course. Resigns the user as an editor if they are one
	 * @param course Course to assign the user as an admin of
	 * @param mirror Whether to mirror the assignment
	 * @throws `UserError` if the user is already an admin of the course
	 */

	becomeCourseAdmin(course: CourseController, mirror: boolean = true): void {
		if (this._course_admin_ids.includes(course.id))
			throw new Error(`UserError: User is already an admin of Course with ID ${course.id}`)
		this._course_admin_ids.push(course.id)
		this._course_admins?.push(course)

		if (this._course_editor_ids.includes(course.id)) {
			this.resignAsCourseEditor(course)
		}

		if (mirror) {
			course.assignAdmin(this, false)
		}
	}

	/**`
	 * Assign a user as an editor of a course. Resigns the user as an admin if they are one
	 * @param course Course to assign the user as an editor of
	 * @param mirror Whether to mirror the assignment
	 * @throws `UserError` if the user is already an editor of the course
	 */

	becomeCourseEditor(course: CourseController, mirror: boolean = true): void {
		if (this._course_editor_ids.includes(course.id))
			throw new Error(`UserError: User is already an editor of Course with ID ${course.id}`)
		this._course_editor_ids.push(course.id)
		this._course_editors?.push(course)

		if (this._course_admin_ids.includes(course.id)) {
			this.resignAsCourseAdmin(course)
		}

		if (mirror) {
			course.assignEditor(this, false)
		}
	}

	/**
	 * Unassign a user as an admin of a program
	 * @param program Program to unassign the user as an admin of
	 * @param mirror Whether to mirror the unassignment
	 * @throws `UserError` if the user is not an admin of the program
	 */

	resignAsProgramAdmin(program: ProgramController, mirror: boolean = true): void {
		if (!this._program_admin_ids.includes(program.id))
			throw new Error(`UserError: User is not an admin of Program with ID ${program.id}`)
		this._program_admin_ids = this._program_admin_ids.filter(id => id !== program.id)
		this._program_admins = this._program_admins?.filter(admin => admin.id !== program.id)

		if (mirror) {
			program.unassignAdmin(this, false)
		}
	}

	/**
	 * Unassign a user as an editor of a program
	 * @param program Program to unassign the user as an editor of
	 * @param mirror Whether to mirror the unassignment
	 * @throws `UserError` if the user is not an editor of the program
	 */

	resignAsProgramEditor(program: ProgramController, mirror: boolean = true): void {
		if (!this._program_editor_ids.includes(program.id))
			throw new Error(`UserError: User is not an editor of Program with ID ${program.id}`)
		this._program_editor_ids = this._program_editor_ids.filter(id => id !== program.id)
		this._program_editors = this._program_editors?.filter(editor => editor.id !== program.id)

		if (mirror) {
			program.unassignEditor(this, false)
		}
	}

	/**
	 * Unassign a user as an admin of a course
	 * @param course Course to unassign the user as an admin of
	 * @param mirror Whether to mirror the unassignment
	 * @throws `UserError` if the user is not an admin of the course
	 */

	resignAsCourseAdmin(course: CourseController, mirror: boolean = true): void {
		if (!this._course_admin_ids.includes(course.id))
			throw new Error(`UserError: User is not an admin of Course with ID ${course.id}`)
		this._course_admin_ids = this._course_admin_ids.filter(id => id !== course.id)
		this._course_admins = this._course_admins?.filter(admin => admin.id !== course.id)

		if (mirror) {
			course.unassignAdmin(this, false)
		}
	}

	/**
	 * Unassign a user as an editor of a course
	 * @param course Course to unassign the user as an editor of
	 * @param mirror Whether to mirror the unassignment
	 * @throws `UserError` if the user is not an editor of the course
	 */

	resignAsCourseEditor(course: CourseController, mirror: boolean = true): void {
		if (!this._course_editor_ids.includes(course.id))
			throw new Error(`UserError: User is not an editor of Course with ID ${course.id}`)
		this._course_editor_ids = this._course_editor_ids.filter(id => id !== course.id)
		this._course_editors = this._course_editors?.filter(editor => editor.id !== course.id)

		if (mirror) {
			course.unassignEditor(this, false)
		}
	}
}
