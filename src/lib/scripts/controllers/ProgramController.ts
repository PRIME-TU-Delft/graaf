
// Internal dependencies
import { ValidationData, Severity } from '$scripts/validation'

import {
	ControllerCache,
	CourseController,
	UserController
} from '$scripts/controllers'

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
	private _pending_courses?: Promise<CourseController[]>
	private _admins?: UserController[]
	private _pending_admins?: Promise<UserController[]>
	private _editors?: UserController[]
	private _pending_editors?: Promise<UserController[]>

	private constructor(
		public cache: ControllerCache,
		public id: number,
		public name: string,
		private _course_ids: number[],
		private _editor_ids: number[],
		private _admin_ids: number[]
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	get trimmed_name(): string {
		return this.name.trim()
	}

	get course_ids(): number[] {
		return this._course_ids
	}

	get admin_ids(): number[] {
		return this._admin_ids
	}

	get editor_ids(): number[] {
		return this._editor_ids
	}

	// --------------------> API Getters

	/**
	 * Get all programs from the cache or the API
	 * @param cache Cache to get the programs from
	 * @returns Array of all programs
	 * @throws `APIError` if the API call fails
	 */

	static async getAll(cache: ControllerCache): Promise<ProgramController[]> {

		// Call API to get all programs
		const response = await cache.fetch(`/api/program`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/program GET): ${error}`)
			})

		// Revive the programs
		const data = await response.json() as SerializedProgram[]
		return data.map(program => ProgramController.revive(cache, program))
	}

	/**
	 * Get the courses of this program, from the cache or the API
	 * @returns Courses of the program
	 * @throws `APIError` if the API call fails
	 */

	async getCourses(): Promise<CourseController[]> {

		// Check if courses are pending
		if (this._pending_courses !== undefined) {
			return await this._pending_courses
		}

		// Check if courses are known
		if (this._courses !== undefined) {
			return this._courses
		}

		// Check if courses are cached
		const cached = this._course_ids.map(id => this.cache.find(CourseController, id))
		if (!cached.includes(undefined)) {
			this._courses = cached as CourseController[]
			return this._courses
		}

		// Call API to get the course data
		this._pending_courses = this.cache
			.fetch(`/api/program/${this.id}/courses`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedCourse[]
					this._courses = data.map(course => CourseController.revive(this.cache, course))
					this._pending_courses = undefined
					return this._courses
				},
				error => {
					this._pending_courses = undefined
					throw new Error(`APIError (/api/program/${this.id}/courses GET): ${error}`)
				}
			)

		return await this._pending_courses
	}

	/**
	 * Get the admins of this program, from the cache or the API
	 * @returns Admins of the program
	 * @throws `APIError` if the API call fails
	 */

	async getAdmins(): Promise<UserController[]> {

		// Check if admins are pending
		if (this._pending_admins !== undefined) {
			return await this._pending_admins
		}

		// Check if admins are known
		if (this._admins !== undefined) {
			return this._admins
		}

		// Check if admins are cached
		const cached = this._admin_ids.map(id => this.cache.find(UserController, id))
		if (!cached.includes(undefined)) {
			this._admins = cached as UserController[]
			return this._admins
		}

		// Call API to get the admin data
		this._pending_admins = this.cache
			.fetch(`/api/program/${this.id}/admins`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedUser[]
					this._admins = data.map(user => UserController.revive(this.cache, user))
					this._pending_admins = undefined
					return this._admins
				},
				error => {
					this._pending_admins = undefined
					throw new Error(`APIError (/api/program/${this.id}/admins GET): ${error}`)
				}
			)

		return await this._pending_admins
	}

	/**
	 * Get the editors of this program, from the cache or the API
	 * @returns Editors of the program
	 * @throws `APIError` if the API call fails
	 */

	async getEditors(): Promise<UserController[]> {

		// Check if editors are pending
		if (this._pending_editors !== undefined) {
			return await this._pending_editors
		}

		// Check if editors are known
		if (this._editors !== undefined) {
			return this._editors
		}

		// Check if editors are cached
		const cached = this._editor_ids.map(id => this.cache.find(UserController, id))
		if (!cached.includes(undefined)) {
			this._editors = cached as UserController[]
			return this._editors
		}

		// Call API to get the editor data
		this._pending_editors = this.cache
			.fetch(`/api/program/${this.id}/editors`, { method: 'GET' })
			.then(
				async response => {
					const data = await response.json() as SerializedUser[]
					this._editors = data.map(user => UserController.revive(this.cache, user))
					this._pending_editors = undefined
					return this._editors
				},
				error => {
					this._pending_editors = undefined
					throw new Error(`APIError (/api/program/${this.id}/editors GET): ${error}`)
				}
			)

		return await this._pending_editors
	}

	// --------------------> API actions

	/**
	 * Create a new program
	 * @param cache Cache to create the program with
	 * @param name Program name
	 * @returns The newly created ProgramController
	 * @throws `APIError` If the API call fails
	 */

	static async create(cache: ControllerCache, name: string): Promise<ProgramController> {

		// Call API to create a new program
		const response = await cache.fetch(`/api/program`, {
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
		return ProgramController.revive(cache, data)
	}

	/**
	 * Revive a program from serialized data or the cache
	 * @param cache Cache to revive the program with
	 * @param data Serialized data to revive
	 * @returns The revived ProgramController
	 * @throws `ProgramError` if the server data is out of sync with the cache
	 */

	static revive(cache: ControllerCache, data: SerializedProgram): ProgramController {
		const program = cache.find(ProgramController, data.id)
		if (program) {
			if (!program.represents(data))
				throw new Error(`ProgramError: Attempted to revive Program with ID ${data.id}, but server data is out of sync with cache`)
			return program
		}

		return new ProgramController(
			cache,
			data.id,
			data.name,
			data.courses,
			data.editors,
			data.admins
		)
	}

	/**
	 * Check if this program is equal to a serialized program
	 * @param data Serialized program to compare against
	 * @returns Whether the program is equal to the serialized program
	 */

	represents(data: SerializedProgram): boolean {

		// Check the easy stuff
		if (
			this.id !== data.id ||
			this.trimmed_name !== data.name
		) {
			return false
		}

		// Check courses
		if (
			this._course_ids.length !== data.courses.length ||
			this._course_ids.some(id => !data.courses.includes(id)) ||
			data.courses.some(id => !this._course_ids.includes(id))
		) {
			return false
		}

		// Check admins
		if (
			this._admin_ids.length !== data.admins.length ||
			this._admin_ids.some(id => !data.admins.includes(id)) ||
			data.admins.some(id => !this._admin_ids.includes(id))
		) {
			return false
		}

		// Check editors
		if (
			this._editor_ids.length !== data.editors.length ||
			this._editor_ids.some(id => !data.editors.includes(id)) ||
			data.editors.some(id => !this._editor_ids.includes(id))
		) {
			return false
		}

		return true
	}

	/**
	 * Serialize this program
	 * @returns `SerializedProgram` Serialized program
	 */

	reduce(): SerializedProgram {
		return {
			id: this.id,
			name: this.trimmed_name,
			courses: this._course_ids,
			admins: this._admin_ids,
			editors: this._editor_ids
		}
	}

	/**
	 * Save this program
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Call API to save the program
		await this.cache.fetch(`/api/program`, {
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
	 * Delete this program
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		for (const id of this._course_ids) {
			this.cache.find(CourseController, id)
				?.unassignProgram(this, false)
		}

		for (const id of this._admin_ids) {
			this.cache.find(UserController, id)
				?.resignAsProgramAdmin(this, false)
		}

		for (const id of this._editor_ids) {
			this.cache.find(UserController, id)
				?.resignAsProgramEditor(this, false)
		}

		// Call API to delete the program
		await this.cache.fetch(`/api/program/${this.id}`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/program/${this.id} DELETE): ${error}`)
			})

		// Remove from cache
		this.cache.remove(this)
	}

	// --------------------> Validation

	/**
	 * Check if this program has a name
	 * @returns Whether the program has a name
	 */

	private hasName(): boolean {
		return this.trimmed_name !== ''
	}

	/**
	 * Check if this program has admins
	 * @returns Whether the program has admins
	 */

	private hasAdmins(): boolean {
		return this._admin_ids.length > 0
	}

	/**
	 * Validate this program
	 * @returns Validation result
	 */

	validate(): ValidationData {
		const validation = new ValidationData()

		if (!this.hasName()) {
			validation.add({
				severity: Severity.error,
				short: 'Program has no name'
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

	// --------------------> Assignments

	/**
	 * Assign a course to this program
	 * @param course Course to assign to the program
	 * @param mirror Whether to mirror the assignment
	 */

	assignCourse(course: CourseController, mirror: boolean = true): void {
		if (this._course_ids.includes(course.id)) return

		// Assign course
		this._course_ids.push(course.id)
		this._courses?.push(course)

		if (mirror) {
			course.assignProgram(this, false)
		}
	}

	/**
	 * Assign a user as an admin of this program. Unassigns the user as an editor if they are one
	 * @param user User to assign as an admin
	 * @param mirror Whether to mirror the assignment
	 */

	assignAdmin(user: UserController, mirror: boolean = true): void {
		if (this._admin_ids.includes(user.id)) return

		// Unassign as editor
		if (this._editor_ids.includes(user.id)) {
			this.unassignEditor(user, mirror)
		}

		// Assign as admin
		this._admin_ids.push(user.id)
		this._admins?.push(user)

		if (mirror) {
			user.becomeProgramAdmin(this, false)
		}
	}

	/**
	 * Assign a user as an editor of this program. Unassigns the user as an admin if they are one
	 * @param user User to assign as an editor
	 * @param mirror Whether to mirror the assignment
	 */

	assignEditor(user: UserController, mirror: boolean = true): void {
		if (this._editor_ids.includes(user.id)) return

		// Unassign as admin
		if (this._admin_ids.includes(user.id)) {
			this.unassignAdmin(user, mirror)
		}

		// Assign as editor
		this._editor_ids.push(user.id)
		this._editors?.push(user)

		if (mirror) {
			user.becomeProgramEditor(this, false)
		}
	}

	/**
	 * Unassign a course from this program
	 * @param course Course to unassign from the program
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignCourse(course: CourseController, mirror: boolean = true): void {
		if (!this._course_ids.includes(course.id)) return

		// Unassign course
		this._course_ids = this._course_ids.filter(id => id !== course.id)
		this._courses = this._courses?.filter(known => known.id !== course.id)

		if (mirror) {
			course.unassignProgram(this, false)
		}
	}

	/**
	 * Unassign an admin from this program
	 * @param user User to unassign as an admin
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignAdmin(user: UserController, mirror: boolean = true): void {
		if (!this._admin_ids.includes(user.id)) return

		// Unassign admin
		this._admin_ids = this._admin_ids.filter(id => id !== user.id)
		this._admins = this._admins?.filter(known => known.id !== user.id)

		if (mirror) {
			user.resignAsProgramAdmin(this, false)
		}
	}

	/**
	 * Unassign an editor from this program
	 * @param user User to unassign as an editor
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignEditor(user: UserController, mirror: boolean = true): void {
		if (!this._editor_ids.includes(user.id)) return

		// Unassign editor
		this._editor_ids = this._editor_ids.filter(id => id !== user.id)
		this._editors = this._editors?.filter(known => known.id !== user.id)

		if (mirror) {
			user.resignAsProgramEditor(this, false)
		}
	}

	// --------------------> Utility

	/**
	 * Checks if this program matches a query
	 * @param query Query to match against
	 * @returns Whether the program matches the query
	 */

	matchesQuery(query: string): boolean {
		return this.trimmed_name.toLowerCase().includes(query.toLowerCase())
	}
}
