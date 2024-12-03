
// Internal dependencies
import * as settings from '$scripts/settings'
import { compareArrays, debounce } from '$scripts/utility'

import {
	ControllerCache,
	ProgramController,
	CourseController
} from '$scripts/controllers'

import type {
	SerializedUser,
	UserRole
} from '$scripts/types'

// Exports
export { UserController }


// --------------------> User Controller


class UserController {
	private _unsaved: boolean = false
	private _course_editors?: CourseController[]
	private _course_admins?: CourseController[]
	private _program_editors?: ProgramController[]
	private _program_admins?: ProgramController[]

	public save = debounce(this._save, settings.DEBOUNCE_DELAY)

	private constructor(
		public cache: ControllerCache,
		public id: string,
		private _role: UserRole,
		private _first_name: string | null,
		private _last_name: string | null,
		private _email: string,
		private _course_editor_ids?: number[],
		private _course_admin_ids?: number[],
		private _program_editor_ids?: number[],
		private _program_admin_ids?: number[]
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Unchanged properties
	get role(): UserRole {
		return this._role
	}

	set role(value: UserRole) {
		this._role = value
		this._unsaved = true
	}

	// Name properties
	get first_name(): string | null {
		return this._first_name
	}

	set first_name(value: string | null) {
		this._first_name = value
		this._unsaved = true
	}

	get last_name(): string | null {
		return this._last_name
	}

	set last_name(value: string | null) {
		this._last_name = value
		this._unsaved = true
	}

	get full_name(): string {
		return `${this.first_name} ${this.last_name}`
	}

	// Email properties
	get email(): string {
		return this._email
	}

	set email(value: string) {
		this._email = value
		this._unsaved = true
	}

	// Course properties
	get course_editor_ids(): number[] {
		if (this._course_editor_ids === undefined)
			throw new Error('UserError: Course editor data unknown')
		return this._course_editor_ids
	}

	get course_editors(): CourseController[] {
		if (this._course_editors !== undefined)
			return Array.from(this._course_editors)
		this._course_editors = this.course_editor_ids.map(id => this.cache.findOrThrow(CourseController, id))
		return this._course_editors
	}

	get course_admin_ids(): number[] {
		if (this._course_admin_ids === undefined)
			throw new Error('UserError: Course admin data unknown')
		return this._course_admin_ids
	}

	get course_admins(): CourseController[] {
		if (this._course_admins !== undefined)
			return Array.from(this._course_admins)
		this._course_admins = this.course_admin_ids.map(id => this.cache.findOrThrow(CourseController, id))
		return this._course_admins
	}

	// Program properties
	get program_editor_ids(): number[] {
		if (this._program_editor_ids === undefined)
			throw new Error('UserError: Program editor data unknown')
		return this._program_editor_ids
	}

	get program_editors(): ProgramController[] {
		if (this._program_editors !== undefined)
			return Array.from(this._program_editors)
		this._program_editors = this.program_editor_ids.map(id => this.cache.findOrThrow(ProgramController, id))
		return this._program_editors
	}

	get program_admin_ids(): number[] {
		if (this._program_admin_ids === undefined)
			throw new Error('UserError: Program admin data unknown')
		return this._program_admin_ids
	}

	get program_admins(): ProgramController[] {
		if (this._program_admins !== undefined)
			return Array.from(this._program_admins)
		this._program_admins = this.program_admin_ids.map(id => this.cache.findOrThrow(ProgramController, id))
		return this._program_admins
	}

	// --------------------> Assignments

	becomeCourseEditor(course: CourseController, mirror: boolean = true) {
		if (this._course_editor_ids !== undefined) {
			if (this._course_editor_ids.includes(course.id))
				throw new Error(`UserError: Course editor with ID ${course.id} already assigned to user with ID ${this.id}`)
			this._course_editor_ids.push(course.id)
			this._course_editors?.push(course)
			this._unsaved = true
		}

		if (mirror) {
			course.assignEditor(this, false)
		}
	}

	becomeCourseAdmin(course: CourseController, mirror: boolean = true) {
		if (this._course_admin_ids !== undefined) {
			if (this._course_admin_ids.includes(course.id))
				throw new Error(`UserError: Course admin with ID ${course.id} already assigned to user with ID ${this.id}`)
			this._course_admin_ids.push(course.id)
			this._course_admins?.push(course)
			this._unsaved = true
		}

		if (mirror) {
			course.assignAdmin(this, false)
		}
	}

	becomeProgramEditor(program: ProgramController, mirror: boolean = true) {
		if (this._program_editor_ids !== undefined) {
			if (this._program_editor_ids.includes(program.id))
				throw new Error(`UserError: Program editor with ID ${program.id} already assigned to user with ID ${this.id}`)
			this._program_editor_ids.push(program.id)
			this._program_editors?.push(program)
			this._unsaved = true
		}

		if (mirror) {
			program.assignEditor(this, false)
		}
	}

	becomeProgramAdmin(program: ProgramController, mirror: boolean = true) {
		if (this._program_admin_ids !== undefined) {
			if (this._program_admin_ids.includes(program.id))
				throw new Error(`UserError: Program admin with ID ${program.id} already assigned to user with ID ${this.id}`)
			this._program_admin_ids.push(program.id)
			this._program_admins?.push(program)
			this._unsaved = true
		}

		if (mirror) {
			program.assignAdmin(this, false)
		}
	}

	resignAsCourseEditor(course: CourseController, mirror: boolean = true) {
		if (this._course_editor_ids !== undefined) {
			if (!this._course_editor_ids.includes(course.id))
				throw new Error(`UserError: Course editor with ID ${course.id} not assigned to user with ID ${this.id}`)
			this._course_editor_ids = this._course_editor_ids.filter(id => id !== course.id)
			this._course_editors = this._course_editors?.filter(c => c.id !== course.id)
			this._unsaved = true
		}

		if (mirror) {
			course.unassignEditor(this, false)
		}
	}

	resignAsCourseAdmin(course: CourseController, mirror: boolean = true) {
		if (this._course_admin_ids !== undefined) {
			if (!this._course_admin_ids.includes(course.id))
				throw new Error(`UserError: Course admin with ID ${course.id} not assigned to user with ID ${this.id}`)
			this._course_admin_ids = this._course_admin_ids.filter(id => id !== course.id)
			this._course_admins = this._course_admins?.filter(c => c.id !== course.id)
			this._unsaved = true
		}

		if (mirror) {
			course.unassignAdmin(this, false)
		}
	}

	resignAsProgramEditor(program: ProgramController, mirror: boolean = true) {
		if (this._program_editor_ids !== undefined) {
			if (!this._program_editor_ids.includes(program.id))
				throw new Error(`UserError: Program editor with ID ${program.id} not assigned to user with ID ${this.id}`)
			this._program_editor_ids = this._program_editor_ids.filter(id => id !== program.id)
			this._program_editors = this._program_editors?.filter(p => p.id !== program.id)
			this._unsaved = true
		}

		if (mirror) {
			program.unassignEditor(this, false)
		}
	}

	resignAsProgramAdmin(program: ProgramController, mirror: boolean = true) {
		if (this._program_admin_ids !== undefined) {
			if (!this._program_admin_ids.includes(program.id))
				throw new Error(`UserError: Program admin with ID ${program.id} not assigned to user with ID ${this.id}`)
			this._program_admin_ids = this._program_admin_ids.filter(id => id !== program.id)
			this._program_admins = this._program_admins?.filter(p => p.id !== program.id)
			this._unsaved = true
		}

		if (mirror) {
			program.unassignAdmin(this, false)
		}
	}

	// --------------------> Actions

	static revive(cache: ControllerCache, data: SerializedUser): UserController {
		const user = cache.find(UserController, data.id)
		if (user !== undefined) {

			// Throw error if user data is inconsistent
			if (!user.represents(data)) {
				throw new Error(`UserError: User with ID ${data.id} already exists, and is inconsistent with new data`)
			}

			// Update user where necessary
			if (user._course_editor_ids === undefined)
				user._course_editor_ids = data.course_editor_ids
			if (user._course_admin_ids === undefined)
				user._course_admin_ids = data.course_admin_ids
			if (user._program_editor_ids === undefined)
				user._program_editor_ids = data.program_editor_ids
			if (user._program_admin_ids === undefined)
				user._program_admin_ids = data.program_admin_ids

			return user
		}

		return new UserController(
			cache,
			data.id,
			data.role,
			data.first_name,
			data.last_name,
			data.email,
			data.course_editor_ids,
			data.course_admin_ids,
			data.program_editor_ids,
			data.program_admin_ids
		)
	}

	represents(data: SerializedUser): boolean {
		return this.id === data.id
			&& this.role === data.role
			&& this.first_name === data.first_name
			&& this.last_name === data.last_name
			&& this.email === data.email
			&& (this._course_editor_ids === undefined || data.course_editor_ids === undefined || compareArrays(this._course_editor_ids, data.course_editor_ids))
			&& (this._course_admin_ids === undefined || data.course_admin_ids === undefined || compareArrays(this._course_admin_ids, data.course_admin_ids))
			&& (this._program_editor_ids === undefined || data.program_editor_ids === undefined || compareArrays(this._program_editor_ids, data.program_editor_ids))
			&& (this._program_admin_ids === undefined || data.program_admin_ids === undefined || compareArrays(this._program_admin_ids, data.program_admin_ids))
	}

	reduce(): SerializedUser {
		return {
			id: this.id,
			role: this.role,
			first_name: this.first_name,
			last_name: this.last_name,
			email: this.email,
			course_editor_ids: this.course_editor_ids,
			course_admin_ids: this.course_admin_ids,
			program_editor_ids: this.program_editor_ids,
			program_admin_ids: this.program_admin_ids
		}
	}

	private async _save() {
		if (!this._unsaved) return

		// Call the API to save the user
		const response = await fetch('/api/user', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/user PUT): ${response.status} ${response.statusText}`)
		}
	}

	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = (this.first_name + ' ' + this.last_name).toLowerCase()
		return lower_name.includes(lower_query)
	}
}