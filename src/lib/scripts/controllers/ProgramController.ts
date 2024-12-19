
// Internal dependencies
import * as settings from '$scripts/settings'

import { debounce, compareArrays, customError } from '$scripts/utility'
import { Validation, Severity} from '$scripts/validation'

import {
	ControllerCache,
	CourseController,
	UserController
} from '$scripts/controllers'

import { validSerializedProgram } from '$scripts/types'

import type SaveStatus from '$components/SaveStatus.svelte'
import type { DropdownOption, SerializedProgram } from '$scripts/types'

// Exports
export { ProgramController }


// --------------------> Program Controller


class ProgramController {
	private _courses?: CourseController[]
	private _editors?: UserController[]
	private _admins?: UserController[]

	public save = debounce(this._save, settings.DEBOUNCE_DELAY)

	private constructor(
		public cache: ControllerCache,
		public id: number,
		public name: string,
		private _course_ids?: number[],
		private _editor_ids?: string[],
		private _admin_ids?: string[]
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Name properties
	get trimmed_name(): string {
		return this.name.trim()
	}

	get display_name(): string {
		return this.trimmed_name === '' ? 'Untitled program' : this.trimmed_name
	}

	// Course properties
	get course_ids(): number[] {
		if (this._course_ids === undefined)
			throw customError('ProgramError', 'Course data unknown')
		return Array.from(this._course_ids)
	}

	get courses(): CourseController[] {
		if (this._course_ids === undefined)
			throw customError('ProgramError', 'Course data unknown')
		if (this._courses !== undefined)
			return Array.from(this._courses)

		// Fetch courses from cache
		this._courses = this._course_ids.map(id => this.cache.findOrThrow(CourseController, id))
		return Array.from(this._courses)
	}

	get course_options(): DropdownOption<CourseController>[] {
		const courses = this.cache.all(CourseController)
		const result: DropdownOption<CourseController>[] = []

		for (const course of courses) {
			const validation = new Validation()
			if (this.courses.includes(course)) {
				validation.add({
					severity: Severity.error,
					short: 'Already assigned'
				})
			}

			result.push({
				value: course,
				label: course.display_name,
				validation
			})
		}

		return result
	}

	// Editor properties
	get editor_ids(): string[] {
		if (this._editor_ids === undefined)
			throw customError('ProgramError', 'Editor data unknown')
		return Array.from(this._editor_ids)
	}

	get editors(): UserController[] {
		if (this._editor_ids === undefined)
			throw customError('ProgramError', 'Editor data unknown')
		if (this._editors !== undefined)
			return Array.from(this._editors)

		// Fetch editors from cache
		this._editors = this._editor_ids.map(id => this.cache.findOrThrow(UserController, id))
		return Array.from(this._editors)
	}

	get editor_options(): DropdownOption<UserController>[] {
		return this.editors.map(editor => ({
				value: editor,
				label: editor.first_name + ' ' + editor.last_name
			})
		)
	}

	// Admin properties
	get admin_ids(): string[] {
		if (this._admin_ids === undefined)
			throw customError('ProgramError', 'Admin data unknown')
		return Array.from(this._admin_ids)
	}

	get admins(): UserController[] {
		if (this._admin_ids === undefined)
			throw customError('ProgramError', 'Admin data unknown')
		if (this._admins !== undefined)
			return Array.from(this._admins)

		// Fetch admins from cache
		this._admins = this._admin_ids.map(id => this.cache.findOrThrow(UserController, id))
		return Array.from(this._admins)
	}

	get admin_options(): DropdownOption<UserController>[] {
		return this.admins.map(admin => ({
				value: admin,
				label: admin.first_name + ' ' + admin.last_name
			})
		)
	}

	// --------------------> Assignments

	assignCourse(course: CourseController, mirror: boolean = true) {
		if (this._course_ids !== undefined) {
			if (this._course_ids.includes(course.id))
				throw customError('ProgramError', `Course with ID ${course.id} already assigned to program with ID ${this.id}`)
			this._course_ids.push(course.id)
			this._courses?.push(course)
		}

		if (mirror) {
			course.assignToProgram(this, false)
		}
	}

	assignEditor(editor: UserController, mirror: boolean = true) {
		if (this._editor_ids !== undefined) {
			if (this._editor_ids.includes(editor.id))
				throw customError('ProgramError', `Editor with ID ${editor.id} already assigned to program with ID ${this.id}`)
			this._editor_ids.push(editor.id)
			this._editors?.push(editor)
		}

		if (mirror) {
			editor.becomeProgramEditor(this, false)
		}
	}

	assignAdmin(admin: UserController, mirror: boolean = true) {
		if (this._admin_ids !== undefined) {
			if (this._admin_ids.includes(admin.id))
				throw customError('ProgramError', `Admin with ID ${admin.id} already assigned to program with ID ${this.id}`)
			this._admin_ids.push(admin.id)
			this._admins?.push(admin)
		}

		if (mirror) {
			admin.becomeProgramAdmin(this, false)
		}
	}

	unassignCourse(course: CourseController, mirror: boolean = true) {
		if (this._course_ids !== undefined) {
			if (!this._course_ids.includes(course.id))
				throw customError('ProgramError', `Course with ID ${course.id} not assigned to program with ID ${this.id}`)
			this._course_ids = this._course_ids.filter(id => id !== course.id)
			this._courses = this._courses?.filter(c => c.id !== course.id)
		}

		if (mirror) {
			course.unassignFromProgram(this, false)
		}
	}

	unassignEditor(editor: UserController, mirror: boolean = true) {
		if (this._editor_ids !== undefined) {
			if (!this._editor_ids.includes(editor.id))
				throw customError('ProgramError', `Editor with ID ${editor.id} not assigned to program with ID ${this.id}`)
			this._editor_ids = this._editor_ids.filter(id => id !== editor.id)
			this._editors = this._editors?.filter(e => e.id !== editor.id)
		}

		if (mirror) {
			editor.resignAsProgramEditor(this, false)
		}
	}

	unassignAdmin(admin: UserController, mirror: boolean = true) {
		if (this._admin_ids === undefined)
			return
		if (!this._admin_ids.includes(admin.id))
			throw customError('ProgramError', `Admin with ID ${admin.id} not assigned to program with ID ${this.id}`)
		this._admin_ids = this._admin_ids?.filter(id => id !== admin.id)
		this._admins = this._admins?.filter(a => a.id !== admin.id)

		if (mirror) {
			admin.resignAsProgramAdmin(this, false)
		}
	}

	// --------------------> Validation

	validateName(): Validation {
		const validation = new Validation()

		if (this.trimmed_name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Program has no name'
			})
		} else if (this.trimmed_name.length > settings.MAX_PROGRAM_NAME_LENGTH) {
			validation.add({
				severity: Severity.error,
				short: 'Program name is too long',
				long: `Program name cannot exceed ${settings.MAX_PROGRAM_NAME_LENGTH} characters`
			})
		} else if (this.cache.all(ProgramController)
			.find(program => program.id !== this.id && program.trimmed_name === this.trimmed_name)
		) {
			validation.add({
				severity: Severity.error,
				short: 'Program name is not unique'
			})
		}

		return validation
	}

	// --------------------> Actions

	static async create(cache: ControllerCache, name: string, save_status?: SaveStatus): Promise<ProgramController> {
		save_status?.setSaving()

		// Call the API to create a new program
		const response = await fetch('/api/program', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/program POST)', await response.text())
		}

		// Revive the program
		const data = await response.json()
		if (!validSerializedProgram(data)) {
			throw customError('ProgramError', `Invalid program data received from API`)
		}

		save_status?.setIdle()
		return ProgramController.revive(cache, data)
	}

	static revive(cache: ControllerCache, data: SerializedProgram): ProgramController {
		const program = cache.find(ProgramController, data.id)
		if (program !== undefined) {

			// Throw an error if the existing program is inconsistent
			if (!program.represents(data)) {
				throw customError('ProgramError', `Program with ID ${data.id} already exists, and is inconsistent with new data`)
			}

			// Update the existing program where necessary
			if (program._course_ids === undefined)
				program._course_ids = data.course_ids
			if (program._editor_ids === undefined)
				program._editor_ids = data.editor_ids
			if (program._admin_ids === undefined)
				program._admin_ids = data.admin_ids

			return program
		}

		return new ProgramController(
			cache,
			data.id,
			data.name,
			data.course_ids,
			data.editor_ids,
			data.admin_ids
		)
	}

	represents(data: SerializedProgram): boolean {
		return this.id === data.id
			&& this.trimmed_name === data.name
			&& (this._course_ids === undefined || data.course_ids === undefined || compareArrays(this._course_ids, data.course_ids))
			&& (this._editor_ids === undefined || data.editor_ids === undefined || compareArrays(this._editor_ids, data.editor_ids))
			&& (this._admin_ids === undefined  || data.admin_ids === undefined  || compareArrays(this._admin_ids, data.admin_ids))
	}

	reduce(): SerializedProgram {
		return {
			id: this.id,
			name: this.trimmed_name,
			course_ids: this._course_ids,
			editor_ids: this._editor_ids,
			admin_ids: this._admin_ids
		}
	}

	private async _save(save_status?: SaveStatus) {
		if (this.validateName().severity === Severity.error) return
		save_status?.setSaving()

		// Call the API to save the program
		const response = await fetch('/api/program', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/program PUT)', await response.text())
		}

		save_status?.setIdle()
	}

	async delete(save_status?: SaveStatus) {
		save_status?.setSaving()

		// Unassign courses, editors, and admins
		if (this._course_ids !== undefined)
			for (const course of this.courses)
				course.unassignFromProgram(this, false)
		if (this._editor_ids !== undefined)
			for (const editor of this.editors)
				editor.resignAsProgramEditor(this, false)
		if (this._admin_ids !== undefined)
			for (const admin of this.admins)
				admin.resignAsProgramAdmin(this, false)

		// Call the API to delete the program
		const response = await fetch(`/api/program/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/program/${this.id} DELETE)', await response.text())
		}

		// Remove the program from the cache
		this.cache.remove(this)
		save_status?.setIdle()
	}

	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = this.trimmed_name.toLowerCase()

		return lower_name.includes(lower_query)
	}
}