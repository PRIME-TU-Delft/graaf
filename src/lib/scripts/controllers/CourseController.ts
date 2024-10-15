
// External dependencies
import { browser } from '$app/environment'

// Internal dependencies
import  {
	ControllerCache,
	ProgramController,
	GraphController,
	LinkController,
	UserController
} from '$scripts/controllers'

import { ValidationData, Severity } from '$scripts/validation'
import type {
	SerializedProgram,
	SerializedCourse,
	SerializedGraph,
	SerializedLink,
	SerializedUser
} from '$scripts/types'

// Exports
export { CourseController }


// --------------------> Controller


class CourseController {
	private _programs?: ProgramController[]
	private _graphs?: GraphController[]
	private _links?: LinkController[]
	private _admins?: UserController[]
	private _editors?: UserController[]

	private constructor(
		public cache: ControllerCache,
		public id: number,
		public code: string,
		public name: string,
		private _program_ids: number[],
		private _graph_ids: number[],
		private _link_ids: number[],
		private _editor_ids: number[],
		private _admin_ids: number[]
	) {
		this.cache.add(this)
	}

	get program_ids(): number[] {
		return this._program_ids.concat()
	}

	get graph_ids(): number[] {
		return this._graph_ids.concat()
	}

	get link_ids(): number[] {
		return this._link_ids.concat()
	}

	get admin_ids(): number[] {
		return this._admin_ids.concat()
	}

	get editor_ids(): number[] {
		return this._editor_ids.concat()
	}

	/**
	 * Create a new course
	 * @param cache Cache to create the course in
	 * @param code Course code
	 * @param name Course name
	 * @returns `Promise<CourseController>` The newly created CourseController
	 * @throws `APIError` if the API call fails
	 */

	static async create(cache: ControllerCache, code: string, name: string): Promise<CourseController> {

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
		return CourseController.revive(cache, data)
	}

	/**
	 * Revive a course from serialized data
	 * @param cache Cache to revive the course in
	 * @param data Serialized data to revive
	 * @returns `CourseController` The revived Course
	 */

	static revive(cache: ControllerCache, data: SerializedCourse): CourseController {
		const course = cache.find(CourseController, data.id)

		if (course) return course
		return new CourseController(
			cache,
			data.id,
			data.code,
			data.name,
			data.programs,
			data.graphs,
			data.links,
			data.editors,
			data.admins
		)
	}

	/**
	 * Validate this course
	 * @returns `Promise<ValidationData>` Validation data
	 */

	validate(): ValidationData {
		const validation = new ValidationData()

		if (this.name.trim() === '') {
			validation.add({
				severity: Severity.error,
				short: 'Course has no name'
			})
		}

		if (this.code.trim() === '') {
			validation.add({
				severity: Severity.error,
				short: 'Course has no code'
			})
		}

		if (this._admin_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Course has no admins'
			})
		}

		return validation
	}

	/**
	 * Serialize this course
	 * @returns `SerializedCourse` Serialized course
	 */

	reduce(): SerializedCourse {
		return {
			id: this.id,
			code: this.code.trim(),
			name: this.name.trim(),
			graphs: this._graph_ids,
			links: this._link_ids,
			admins: this._admin_ids,
			editors: this._editor_ids,
			programs: this._program_ids
		}
	}

	/**
	 * Save this course
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
	 * Delete this course, and all related graphs
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Delete all related graphs and links
		const graphs = await this.getGraphs()
		await Promise.all(graphs.map(graph => graph.delete()))

		const links = await this.getLinks()
		await Promise.all(links.map(link => link.delete()))

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		for (const id of this._admin_ids) {
			this.cache.find(UserController, id)
				?.resignAsCourseAdmin(this, false)
		}

		for (const id of this._editor_ids) {
			this.cache.find(UserController, id)
				?.resignAsCourseEditor(this, false)
		}

		for (const id of this._program_ids) {
			this.cache.find(ProgramController, id)
				?.unassignCourse(this, false)
		}

		// Call API to delete the course
		await fetch(`/api/course/${this.id}`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/course/${this.id} DELETE): ${error}`)
			})
			
		// Remove from cache
		this.cache.remove(this)
	}

	/**
	 * Get the programs this course is assigned to
	 * @returns `Promise<ProgramController[]>` Programs this course is assigned to
	 * @throws `APIError` if the API call fails
	 */
	
	async getPrograms(): Promise<ProgramController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if programs are already loaded
		if (this._programs) {
			return this._programs.concat()
		}

		// Call API to get the course data
		const response = await fetch(`/api/course/${this.id}/programs`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/course/${this.id}/programs GET): ${error}`)
			})

		// Revive the programs
		const data = await response.json() as SerializedProgram[]
		this._programs = data.map(program => ProgramController.revive(this.cache, program))

		return this._programs.concat()
	}

	/**
	 * Get the graphs assigned to this course
	 * @returns `Promise<GraphController[]>` Graphs assigned to this course
	 * @throws `APIError` if the API call fails
	 */

	async getGraphs(): Promise<GraphController[]> {
	
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if graphs are already loaded
		if (this._graphs) {
			return this._graphs.concat()
		}

		// Call API to get the course data
		const response = await fetch(`/api/course/${this.id}/graphs`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/course/${this.id}/graphs GET): ${error}`)
			})

		// Revive the graphs
		const data = await response.json() as SerializedGraph[]
		this._graphs = data.map(graph => GraphController.revive(this.cache, graph))

		return this._graphs.concat()
	}

	/**
	 * Get the graphs assigned to this course as a list of Dropdown options
	 * @returns `Promise<{ value: number, label: string, validation: ValidationData }[]>` Graphs assigned to this course as a list of Dropdown options
	 * @throws `APIError` if the API call fails
	 */

	async getGraphOptions(): Promise<{ value: number, label: string, validation: ValidationData }[]> {
		const graphs = await this.getGraphs()
		return graphs.map(graph => ({
			value: graph.id,
			label: graph.name,
			validation: ValidationData.success()
		}))
	}

	/**
	 * Get the links assigned to this course
	 * @returns `Promise<LinkController[]>` Links assigned to this course
	 * @throws `APIError` if the API call fails
	 */

	async getLinks(): Promise<LinkController[]> {
					
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if links are already loaded
		if (this._links) {
			return this._links.concat()
		}

		// Call API to get the course data
		const response = await fetch(`/api/course/${this.id}/links`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/course/${this.id}/links GET): ${error}`)
			})

		// Revive the links
		const data = await response.json() as SerializedLink[]
		this._links = data.map(link => LinkController.revive(this.cache, link))

		return this._links.concat()
	}

	/**
	 * Get the admins assigned to this course
	 * @returns `Promise<UserController[]>` Admins assigned to this course
	 * @throws `APIError` if the API call fails
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

		// Call API to get the admin data
		const response = await fetch(`/api/course/${this.id}/admins`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/course/${this.id}/admins GET): ${error}`)
			})

		// Revive the admins
		const data = await response.json() as SerializedUser[]
		this._admins = data.map(user => UserController.revive(this.cache, user))

		return this._admins.concat()
	}

	/**
	 * Get the editors assigned to this course
	 * @returns `Promise<UserController[]>` Editors assigned to this course
	 * @throws `APIError` if the API call fails
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

		// Call API to get the editor data
		const response = await fetch(`/api/course/${this.id}/editors`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/course/${this.id}/editors GET): ${error}`)
			})

		//Revive the editors
		const data = await response.json() as SerializedUser[]
		this._editors = data.map(user => UserController.revive(this.cache, user))

		return this._editors.concat()
	}
	
	/**
	 * Assign this course to a program
	 * @param program Target program
	 * @param mirror Whether to mirror the assignment
	 */

	assignToProgram(program: ProgramController, mirror: boolean = true): void {
		if (this._program_ids.includes(program.id)) return
		this._program_ids.push(program.id)
		this._programs?.push(program)

		if (mirror) {
			program.assignCourse(this, false)
		}
	}

	/**
	 * Assign a graph to this course
	 * @param graph Target graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_ids.includes(graph.id)) return
		this._graph_ids.push(graph.id)
		this._graphs?.push(graph)

		if (mirror) {
			graph.assignToCourse(this, false)
		}
	}

	/**
	 * Assign a link to this course
	 * @param link Target link
	 * @param mirror Whether to mirror the assignment
	 */

	assignLink(link: LinkController, mirror: boolean = true): void {
		if (this._link_ids.includes(link.id)) return
		this._link_ids.push(link.id)
		this._links?.push(link)

		if (mirror) {
			link.assignToCourse(this, false)
		}
	}

	/**
	 * Assign a user as an admin of this course. Unassigns the user as an editor if they are one
	 * @param user Target user
	 * @param mirror Whether to mirror the assignment
	 */

	assignAdmin(user: UserController, mirror: boolean = true): void {
		if (this._admin_ids.includes(user.id)) return
		if (this._editor_ids.includes(user.id)) {
			this.unassignEditor(user, mirror)
		}

		this._admin_ids.push(user.id)
		this._admins?.push(user)

		if (mirror) {
			user.becomeCourseAdmin(this, false)
		}
	}

	/**
	 * Assign a user as an editor of this course. Unassigns the user as an admin if they are one
	 * @param user Target user
	 * @param mirror Whether to mirror the assignment
	 */

	assignEditor(user: UserController, mirror: boolean = true): void {
		if (this._editor_ids.includes(user.id)) return
		if (this._admin_ids.includes(user.id)) {
			this.unassignAdmin(user, mirror)
		}

		this._editor_ids.push(user.id)
		this._editors?.push(user)

		if (mirror) {
			user.becomeCourseEditor(this, false)
		}
	}

	/**
	 * Unassign this course from a program
	 * @param program Target program
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignFromProgram(program: ProgramController, mirror: boolean = true): void {
		if (!this._program_ids.includes(program.id)) return
		this._program_ids = this._program_ids.filter(id => id !== program.id)
		this._programs = this._programs?.filter(known => known.id !== program.id)

		if (mirror) {
			program.unassignCourse(this, false)
		}
	}

	/**
	 * Unassign a graph from this course
	 * @param graph Target graph
	 */

	unassignGraph(graph: GraphController): void {
		if (!this._graph_ids.includes(graph.id)) return
		this._graph_ids = this._graph_ids.filter(id => id !== graph.id)
		this._graphs = this._graphs?.filter(known => known.id !== graph.id)
	}

	/**
	 * Unassign a link from this course
	 * @param link Target link
	 */

	unassignLink(link: LinkController): void {
		if (!this._link_ids.includes(link.id)) return
		this._link_ids = this._link_ids.filter(id => id !== link.id)
		this._links = this._links?.filter(known => known.id !== link.id)
	}

	/**
	 * Unassign an admin from this course
	 * @param user Target user
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignAdmin(user: UserController, mirror: boolean = true): void {
		if (!this._admin_ids.includes(user.id)) return
		this._admin_ids = this._admin_ids.filter(id => id !== user.id)
		this._admins = this._admins?.filter(known => known.id !== user.id)

		if (mirror) {
			user.resignAsCourseAdmin(this, false)
		}
	}

	/**
	 * Unassign an editor from this course
	 * @param user Target user
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignEditor(user: UserController, mirror: boolean = true): void {
		if (!this._editor_ids.includes(user.id)) return
		this._editor_ids = this._editor_ids.filter(id => id !== user.id)
		this._editors = this._editors?.filter(known => known.id !== user.id)

		if (mirror) {
			user.resignAsCourseEditor(this, false)
		}
	}
}