
// Internal dependencies
import * as settings from '$scripts/settings'
import { compareArrays, debounce } from '$scripts/utility'
import { Validation, Severity } from '$scripts/validation'

import {
	ControllerCache,
	ProgramController,
	GraphController,
	LinkController,
	UserController
} from '$scripts/controllers'

import { validSerializedCourse } from '$scripts/types'
import type { DropdownOption, SerializedCourse } from '$scripts/types'

// Exports
export { CourseController }


// --------------------> Course Controller


class CourseController {
	private _unsaved: boolean = false
	private _programs?: ProgramController[]
	private _graphs?: GraphController[]
	private _links?: LinkController[]
	private _editors?: UserController[]
	private _admins?: UserController[]

	public save = debounce(this._save, settings.DEBOUNCE_DELAY)

	private constructor(
		public cache: ControllerCache,
		public id: number,
		private _unchanged: boolean,
		private _code: string,
		private _name: string,
		private _program_ids?: number[],
		private _graph_ids?: number[],
		private _link_ids?: number[],
		private _editor_ids?: string[],
		private _admin_ids?: string[]
	) {
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Unchanged properties
	get unchanged(): boolean {
		return this._unchanged
	}

	// Code properties
	get code(): string {
		return this._code
	}

	set code(value: string) {
		this._code = value
		this._unchanged = false
		this._unsaved = true
	}

	get trimmed_code(): string {
		return this._code.trim()
	}

	// Name properties
	get name(): string {
		return this._name
	}

	set name(value: string) {
		this._name = value
		this._unchanged = false
		this._unsaved = true
	}

	get trimmed_name(): string {
		return this._name.trim()
	}

	// Program properties
	get program_ids(): number[] {
		if (this._program_ids === undefined)
			throw new Error('CourseError: Program data unknown')
		return Array.from(this._program_ids)
	}

	get programs(): ProgramController[] {
		if (this._program_ids === undefined)
			throw new Error('CourseError: Program data unknown')
		if (this._programs !== undefined)
			return Array.from(this._programs)

		// Fetch programs from cache
		this._programs = this._program_ids.map(id => this.cache.findOrThrow(ProgramController, id))
		return Array.from(this._programs)
	}

	get program_options(): DropdownOption<ProgramController>[] {
		const programs = this.cache.all(ProgramController)
		const result: DropdownOption<ProgramController>[] = []

		for (const program of programs) {
			const validation = new Validation()
			if (this.programs.includes(program)) {
				validation.add({
					severity: Severity.error,
					short: 'Already assigned'
				})
			}

			result.push({
				value: program,
				label: program.name,
				validation
			})
		}

		return result
	}

	// Graph properties
	get graph_ids(): number[] {
		if (this._graph_ids === undefined)
			throw new Error('CourseError: Graph data unknown')
		return Array.from(this._graph_ids)
	}

	get graphs(): GraphController[] {
		if (this._graph_ids === undefined)
			throw new Error('CourseError: Graph data unknown')
		if (this._graphs !== undefined)
			return Array.from(this._graphs)

		// Fetch graphs from cache
		this._graphs = this._graph_ids.map(id => this.cache.findOrThrow(GraphController, id))
		return Array.from(this._graphs)
	}

	get graph_options(): DropdownOption<GraphController>[] {
		return this.graphs.map(graph => ({
			value: graph,
			label: graph.name,
			validation: Validation.success()
		}))
	}

	// Link properties
	get link_ids(): number[] {
		if (this._link_ids === undefined)
			throw new Error('CourseError: Link data unknown')
		return Array.from(this._link_ids)
	}

	get links(): LinkController[] {
		if (this._link_ids === undefined)
			throw new Error('CourseError: Link data unknown')
		if (this._links !== undefined)
			return Array.from(this._links)

		// Fetch links from cache
		this._links = this._link_ids.map(id => this.cache.findOrThrow(LinkController, id))
		return Array.from(this._links)
	}

	// Editor properties
	get editor_ids(): string[] {
		if (this._editor_ids === undefined)
			throw new Error('CourseError: Editor data unknown')
		return Array.from(this._editor_ids)
	}

	get editors(): UserController[] {
		if (this._editor_ids === undefined)
			throw new Error('CourseError: Editor data unknown')
		if (this._editors !== undefined)
			return Array.from(this._editors)

		// Fetch editors from cache
		this._editors = this._editor_ids.map(id => this.cache.findOrThrow(UserController, id))
		return Array.from(this._editors)
	}

	get editor_options(): DropdownOption<UserController>[] {
		return this.editors.map(editor => ({
			value: editor,
			label: editor.first_name + ' ' + editor.last_name,
			validation: Validation.success()
		}))
	}

	// Admin properties
	get admin_ids(): string[] {
		if (this._admin_ids === undefined)
			throw new Error('CourseError: Admin data unknown')
		return Array.from(this._admin_ids)
	}

	get admins(): UserController[] {
		if (this._admin_ids === undefined)
			throw new Error('CourseError: Admin data unknown')
		if (this._admins !== undefined)
			return Array.from(this._admins)

		// Fetch admins from cache
		this._admins = this._admin_ids.map(id => this.cache.findOrThrow(UserController, id))
		return Array.from(this._admins)
	}

	get admin_options(): DropdownOption<UserController>[] {
		return this.admins.map(admin => ({
			value: admin,
			label: admin.first_name + ' ' + admin.last_name,
			validation: Validation.success()
		}))
	}

	// --------------------> Assignments

	assignToProgram(program: ProgramController, mirror: boolean = true) {
		if (this._program_ids !== undefined) {
			if (this._program_ids.includes(program.id))
				throw new Error(`CourseError: Program with ID ${program.id} already assigned to course with ID ${this.id}`)
			this._program_ids.push(program.id)
			this._programs?.push(program)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			program.assignCourse(this, false)
		}
	}

	assignGraph(graph: GraphController) {
		if (this._graph_ids !== undefined) {
			if (this._graph_ids.includes(graph.id))
				throw new Error(`CourseError: Graph with ID ${graph.id} already assigned to course with ID ${this.id}`)
			this._graph_ids.push(graph.id)
			this._graphs?.push(graph)
			this._unchanged = false
			this._unsaved = true
		}
	}

	assignLink(link: LinkController) {
		if (this._link_ids !== undefined) {
			if (this._link_ids.includes(link.id))
				throw new Error(`CourseError: Link with ID ${link.id} already assigned to course with ID ${this.id}`)
			this._link_ids.push(link.id)
			this._links?.push(link)
			this._unchanged = false
			this._unsaved = true
		}
	}

	assignEditor(editor: UserController, mirror: boolean = true) {
		if (this._editor_ids !== undefined) {
			if (this._editor_ids.includes(editor.id))
				throw new Error(`CourseError: Editor with ID ${editor.id} already assigned to course with ID ${this.id}`)
			this._editor_ids.push(editor.id)
			this._editors?.push(editor)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			editor.becomeCourseEditor(this, false)
		}
	}

	assignAdmin(admin: UserController, mirror: boolean = true) {
		if (this._admin_ids !== undefined) {
			if (this._admin_ids.includes(admin.id))
				throw new Error(`CourseError: Admin with ID ${admin.id} already assigned to course with ID ${this.id}`)
			this._admin_ids.push(admin.id)
			this._admins?.push(admin)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			admin.becomeCourseAdmin(this, false)
		}
	}

	unassignFromProgram(program: ProgramController, mirror: boolean = true) {
		if (this._program_ids !== undefined) {
			if (!this._program_ids.includes(program.id))
				throw new Error(`CourseError: Program with ID ${program.id} not assigned to course with ID ${this.id}`)
			this._program_ids = this._program_ids.filter(id => id !== program.id)
			this._programs = this._programs?.filter(p => p.id !== program.id)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			program.unassignCourse(this, false)
		}
	}

	unassignGraph(graph: GraphController) {
		if (this._graph_ids !== undefined) {
			if (!this._graph_ids.includes(graph.id))
				throw new Error(`CourseError: Graph with ID ${graph.id} not assigned to course with ID ${this.id}`)
			this._graph_ids = this._graph_ids.filter(id => id !== graph.id)
			this._graphs = this._graphs?.filter(g => g.id !== graph.id)
			this._unchanged = false
			this._unsaved = true
		}
	}

	unassignLink(link: LinkController) {
		if (this._link_ids !== undefined) {
			if (!this._link_ids.includes(link.id))
				throw new Error(`CourseError: Link with ID ${link.id} not assigned to course with ID ${this.id}`)
			this._link_ids = this._link_ids?.filter(id => id !== link.id)
			this._links = this._links?.filter(l => l.id !== link.id)
			this._unchanged = false
			this._unsaved = true
		}
	}

	unassignEditor(editor: UserController, mirror: boolean = true) {
		if (this._editor_ids !== undefined) {
			if (!this._editor_ids.includes(editor.id))
				throw new Error(`CourseError: Editor with ID ${editor.id} not assigned to course with ID ${this.id}`)
			this._editor_ids = this._editor_ids?.filter(id => id !== editor.id)
			this._editors = this._editors?.filter(e => e.id !== editor.id)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			editor.resignAsCourseEditor(this, false)
		}
	}

	unassignAdmin(admin: UserController, mirror: boolean = true) {
		if (this._admin_ids !== undefined) {
			if (!this._admin_ids.includes(admin.id))
				throw new Error(`CourseError: Admin with ID ${admin.id} not assigned to course with ID ${this.id}`)
			this._admin_ids = this._admin_ids?.filter(id => id !== admin.id)
			this._admins = this._admins?.filter(a => a.id !== admin.id)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			admin.resignAsCourseAdmin(this, false)
		}
	}

	// --------------------> Validation

	validateCode(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this._unchanged) return validation

		if (this.trimmed_code === '') {
			validation.add({
				severity: Severity.error,
				short: 'Course has no code'
			})
		} else if (!settings.COURSE_CODE_REGEX.test(this.trimmed_code)) {
			validation.add({
				severity: Severity.error,
				short: 'Course code is invalid',
				long: 'Course codes can only contain letters and numbers'
			})
		} else if (this.trimmed_code.length > settings.MAX_COURSE_CODE_LENGTH) {
			validation.add({
				severity: Severity.error,
				short: 'Course code is too long',
				long: `Course codes cannot exceed ${settings.MAX_COURSE_CODE_LENGTH} characters`
			})
		} else if (this.cache.all(CourseController)
			.find(course => course.id !== this.id && course.trimmed_code === this.trimmed_code)
		) {
			validation.add({
				severity: Severity.error,
				short: 'Course code is not unique'			
			})
		}

		return validation
	}

	validateName(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this._unchanged) return validation

		if (this.trimmed_name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Course has no name'
			})
		} else if (this.trimmed_name.length > settings.MAX_COURSE_NAME_LENGTH) {
			validation.add({
				severity: Severity.error,
				short: 'Course name is too long',
				long: `Course names cannot exceed ${settings.MAX_COURSE_NAME_LENGTH} characters`
			})
		} else if (this.cache.all(CourseController)
			.find(course => course.id !== this.id && course.trimmed_name === this.trimmed_name)
		) {
			validation.add({
				severity: Severity.warning,
				short: 'Course name is not unique'
			})
		}

		return validation
	}

	// NOTE Commented out, as it is not currently used
/*	validatePrograms(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this.unchanged) return validation

		if (this.program_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Course has no programs'
			})
		}

		return validation
	}

	validateGraphs(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this.unchanged) return validation

		if (this.graph_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Course has no graphs'
			})
		}

		return validation
	}

	validateLinks(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this.unchanged) return validation

		if (this.link_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Course has no links'
			})
		}

		return validation
	}

	validateEditors(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this.unchanged) return validation

		if (this.editor_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Course has no editors'
			})
		}

		return validation
	}

	validateAdmins(strict: boolean = true) {
		const validation = new Validation()
		if (!strict && this.unchanged) return validation

		if (this.admin_ids.length === 0) {
			validation.add({
				severity: Severity.error,
				short: 'Course has no admins'
			})
		}

		return validation
	}

	validate(strict: boolean = true): Validation {
		const validation = new Validation()

		validation.add(this.validateCode(strict))
		validation.add(this.validateName(strict))
		validation.add(this.validatePrograms(strict))
		validation.add(this.validateGraphs(strict))
		validation.add(this.validateLinks(strict))
		validation.add(this.validateEditors(strict))
		validation.add(this.validateAdmins(strict))

		return validation
	} */

	// --------------------> Actions

	static async create(cache: ControllerCache, code: string, name: string, program?: ProgramController): Promise<CourseController> {

		// Call the API to create a new program
		const response = await fetch('/api/course', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, name, program_id: program?.id })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/course POST): ${response.status} ${response.statusText}`)
		}

		// Revive the program
		const data = await response.json()
		if (!validSerializedCourse(data)) {
			throw new Error(`CourseError: Invalid course data received from API`)
		}

		const course = CourseController.revive(cache, data)
		if (program !== undefined) {
			program.assignCourse(course, false)
		}	

		return course
	}

	static revive(cache: ControllerCache, data: SerializedCourse): CourseController {
		const course = cache.find(CourseController, data.id)
		if (course !== undefined) {

			// Throw an error if the existing course is inconsistent
			if (!course.represents(data)) {
				throw new Error(`CourseError: Course with ID ${data.id} already exists, and is inconsistent with new data`)
			}

			// Update the existing course where necessary
			if (course._program_ids === undefined)
				course._program_ids = data.program_ids
			if (course._graph_ids === undefined)
				course._graph_ids = data.graph_ids
			if (course._link_ids === undefined)
				course._link_ids = data.link_ids
			if (course._editor_ids === undefined)
				course._editor_ids = data.editor_ids
			if (course._admin_ids === undefined)
				course._admin_ids = data.admin_ids

			return course
		}

		return new CourseController(
			cache,
			data.id,
			data.unchanged,
			data.code,
			data.name,
			data.program_ids,
			data.graph_ids,
			data.link_ids,
			data.editor_ids,
			data.admin_ids
		)
	}

	represents(data: SerializedCourse): boolean {
		return this.id === data.id
			&& this.unchanged === data.unchanged
			&& this.trimmed_code === data.code
			&& this.trimmed_name === data.name
			&& (this._program_ids === undefined || data.program_ids === undefined || compareArrays(this._program_ids, data.program_ids))
			&& (this._graph_ids === undefined   || data.graph_ids === undefined   || compareArrays(this._graph_ids, data.graph_ids))
			&& (this._link_ids === undefined    || data.link_ids === undefined    || compareArrays(this._link_ids, data.link_ids))
			&& (this._editor_ids === undefined  || data.editor_ids === undefined  || compareArrays(this._editor_ids, data.editor_ids))
			&& (this._admin_ids === undefined   || data.admin_ids === undefined   || compareArrays(this._admin_ids, data.admin_ids))
	}

	reduce(): SerializedCourse {
		return {
			id: this.id,
			unchanged: this.unchanged,
			name: this.trimmed_name,
			code: this.trimmed_code,
			program_ids: this._program_ids,
			graph_ids: this._graph_ids,
			link_ids: this._link_ids,
			editor_ids: this._editor_ids,
			admin_ids: this._admin_ids
		}
	}

	private async _save() {
		if (!this._unsaved) return

		// Call the API to save the course
		const response = await fetch('/api/course', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/course PUT): ${response.status} ${response.statusText}`)
		}

		this._unsaved = false
	}

	async delete() {
		const promises: Promise<void>[] = []

		// Unassign programs, editors, and admins
		if (this._program_ids !== undefined)
			for (const program of this.programs)
				program.unassignCourse(this, false)
		if (this._editor_ids !== undefined)
			for (const editor of this.editors)
				editor.resignAsCourseEditor(this, false)
		if (this._admin_ids !== undefined)
			for (const admin of this.admins)
				admin.resignAsCourseAdmin(this, false)

		// Delete graphs and links
		if (this._graph_ids !== undefined)
			promises.push(...this.graphs.map(async graph => await graph.delete()))
		if (this._link_ids !== undefined)
			promises.push(...this.links.map(async link => await link.delete()))
		await Promise.all(promises)

		// Call the API to delete the course
		const response = await fetch(`/api/course/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/course/${this.id} DELETE): ${response.status} ${response.statusText}`)
		}

		// Remove the course from the cache
		this.cache.remove(this)
	}

	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = this.trimmed_name.toLowerCase()
		const lower_code = this.trimmed_code.toLowerCase()

		return lower_name.includes(lower_query) || lower_code.includes(lower_query)
	}
}