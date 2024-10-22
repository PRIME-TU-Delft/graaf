
// External dependencies
import { browser } from '$app/environment'

// Internal dependencies
import { ValidationData, Severity } from '$scripts/validation'

import  {
	ControllerCache,
	ProgramController,
	GraphController,
	LinkController,
	UserController
} from '$scripts/controllers'

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

	// --------------------> Getters & Setters

	get trimmed_code(): string {
		return this.code.trim()
	}

	get trimmed_name(): string {
		return this.name.trim()
	}

	get program_ids(): number[] {
		return Array.from(this._program_ids)
	}

	get graph_ids(): number[] {
		return Array.from(this._graph_ids)
	}

	get link_ids(): number[] {
		return Array.from(this._link_ids)
	}

	get admin_ids(): number[] {
		return Array.from(this._admin_ids)
	}

	get editor_ids(): number[] {
		return Array.from(this._editor_ids)
	}

	// --------------------> API Getters

	/**
	 * Gets the programs this course is assigned to, from the cache or the API
	 * @returns Array of programs this course is assigned to
	 * @throws `APIError` if the API call fails
	 */

	async getPrograms(): Promise<ProgramController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if programs are already loaded
		if (this._programs) {
			return Array.from(this._programs)
		}

		// Call API to get the course data
		const response = await fetch(`/api/course/${this.id}/programs`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/course/${this.id}/programs GET): ${error}`)
			})

		// Revive the programs
		const data = await response.json() as SerializedProgram[]
		this._programs = data.map(program => ProgramController.revive(this.cache, program))

		return Array.from(this._programs)
	}

	/**
	 * Gets the graphs assigned to this course, from the cache or the API
	 * @returns Array of graphs assigned to this course
	 * @throws `APIError` if the API call fails
	 */

	async getGraphs(): Promise<GraphController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if graphs are already loaded
		if (this._graphs) {
			return Array.from(this._graphs)
		}

		// Call API to get the course data
		const response = await fetch(`/api/course/${this.id}/graphs`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/course/${this.id}/graphs GET): ${error}`)
			})

		// Revive the graphs
		const data = await response.json() as SerializedGraph[]
		this._graphs = data.map(graph => GraphController.revive(this.cache, graph))

		return Array.from(this._graphs)
	}

	/**
	 * Gets the graphs assigned to this course as a list of Dropdown options, from the cache or the API
	 * @returns Array of Dropdown options for the graphs assigned to this course
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
	 * Gets the links assigned to this course, from the cache or the API
	 * @returns Array of links assigned to this course
	 * @throws `APIError` if the API call fails
	 */

	async getLinks(): Promise<LinkController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if links are already loaded
		if (this._links) {
			return Array.from(this._links)
		}

		// Call API to get the course data
		const response = await fetch(`/api/course/${this.id}/links`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/course/${this.id}/links GET): ${error}`)
			})

		// Revive the links
		const data = await response.json() as SerializedLink[]
		this._links = data.map(link => LinkController.revive(this.cache, link))

		return Array.from(this._links)
	}

	/**
	 * Gets the admins assigned to this course, from the cache or the API
	 * @returns Array of admins assigned to this course
	 * @throws `APIError` if the API call fails
	 */

	async getAdmins(): Promise<UserController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if admins are already loaded
		if (this._admins) {
			return Array.from(this._admins)
		}

		// Call API to get the admin data
		const response = await fetch(`/api/course/${this.id}/admins`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/course/${this.id}/admins GET): ${error}`)
			})

		// Revive the admins
		const data = await response.json() as SerializedUser[]
		this._admins = data.map(user => UserController.revive(this.cache, user))

		return Array.from(this._admins)
	}

	/**
	 * Gets the editors assigned to this course, from the cache or the API
	 * @returns Array of editors assigned to this course
	 * @throws `APIError` if the API call fails
	 */

	async getEditors(): Promise<UserController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if editors are already loaded
		if (this._editors) {
			return Array.from(this._editors)
		}

		// Call API to get the editor data
		const response = await fetch(`/api/course/${this.id}/editors`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/course/${this.id}/editors GET): ${error}`)
			})

		//Revive the editors
		const data = await response.json() as SerializedUser[]
		this._editors = data.map(user => UserController.revive(this.cache, user))

		return Array.from(this._editors)
	}

	// --------------------> API actions

	/**
	 * Creates a new course
	 * @param cache Cache to create the course with
	 * @param code Course code
	 * @param name Course name
	 * @returns The newly created course controller
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
	 * Revives a course from serialized data, or retrieves an existing course from the cache
	 * @param cache Cache to revive the course with
	 * @param data Serialized data to revive
	 * @returns The revived course controller
	 * @throws `CourseError` if the server data is out of sync with the cache
	 */

	static revive(cache: ControllerCache, data: SerializedCourse): CourseController {
		const course = cache.find(CourseController, data.id)
		if (course) {
			if (!course.represents(data))
				throw new Error(`CourseError: Attempted to revive Course with ID ${data.id}, but server data is out of sync with cache`)
			return course
		}

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
	 * Checks if this course contains the same data as a serialized course
	 * @param data Serialized course to compare against
	 * @returns Whether this course represents the serialized course
	 */

	represents(data: SerializedCourse): boolean {

		// Check the easy stuff
		if (
			this.id !== data.id ||
			this.trimmed_code !== data.code ||
			this.trimmed_name !== data.name
		) {
			return false
		}

		// Check programs
		if (
			this._program_ids.length !== data.programs.length ||
			this._program_ids.some(id => !data.programs.includes(id)) ||
			data.programs.some(id => !this._program_ids.includes(id))
		) {
			return false
		}

		// Check graphs
		if (
			this._graph_ids.length !== data.graphs.length ||
			this._graph_ids.some(id => !data.graphs.includes(id)) ||
			data.graphs.some(id => !this._graph_ids.includes(id))
		) {
			return false
		}

		// Check links
		if (
			this._link_ids.length !== data.links.length ||
			this._link_ids.some(id => !data.links.includes(id)) ||
			data.links.some(id => !this._link_ids.includes(id))
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

		// Check admins
		if (
			this._admin_ids.length !== data.admins.length ||
			this._admin_ids.some(id => !data.admins.includes(id)) ||
			data.admins.some(id => !this._admin_ids.includes(id))
		) {
			return false
		}

		return true
	}

	/**
	 * Serializes this course
	 * @returns Serialized course
	 */

	reduce(): SerializedCourse {
		return {
			id: this.id,
			code: this.trimmed_code,
			name: this.trimmed_name,
			graphs: this._graph_ids,
			links: this._link_ids,
			admins: this._admin_ids,
			editors: this._editor_ids,
			programs: this._program_ids
		}
	}

	/**
	 * Saves this course
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
	 * Deletes this course, and all related graphs
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

	// --------------------> Validation

	/**
	 * Checks if this course has a name
	 * @returns Whether this course has a name
	 */

	private hasName(): boolean {
		return this.trimmed_name !== ''
	}

	/**
	 * Checks if this course has a code
	 * @returns Whether this course has a code
	 */

	private hasCode(): boolean {
		return this.trimmed_code !== ''
	}

	/**
	 * Checks if this course has admins
	 * @returns Whether this course has admins
	 */

	private hasAdmins(): boolean {
		return this._admin_ids.length > 0
	}

	/**
	 * Validates this course
	 * @returns Validation data
	 */

	validate(): ValidationData {
		const validation = new ValidationData()

		if (!this.hasName()) {
			validation.add({
				severity: Severity.error,
				short: 'Course has no name'
			})
		}

		if (!this.hasCode()) {
			validation.add({
				severity: Severity.error,
				short: 'Course has no code'
			})
		}

		if (!this.hasAdmins()) {
			validation.add({
				severity: Severity.warning,
				short: 'Course has no admins'
			})
		}

		return validation
	}

	// --------------------> Assignments

	/**
	 * Assigns this course to a program
	 * @param program Target program
	 * @param mirror Whether to mirror the assignment
	 */

	assignProgram(program: ProgramController, mirror: boolean = true): void {
		if (this._program_ids.includes(program.id)) return

		// Assign program
		this._program_ids.push(program.id)
		this._programs?.push(program)

		if (mirror) {
			program.assignCourse(this, false)
		}
	}

	/**
	 * Assigns a graph to this course
	 * @param graph Target graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_ids.includes(graph.id)) return

		// Assign graph
		this._graph_ids.push(graph.id)
		this._graphs?.push(graph)

		if (mirror) {
			graph.assignCourse(this, false)
		}
	}

	/**
	 * Assigns a link to this course
	 * @param link Target link
	 * @param mirror Whether to mirror the assignment
	 */

	assignLink(link: LinkController, mirror: boolean = true): void {
		if (this._link_ids.includes(link.id)) return

		// Assign link
		this._link_ids.push(link.id)
		this._links?.push(link)

		if (mirror) {
			link.assignCourse(this, false)
		}
	}

	/**
	 * Assigns a user as an admin of this course. Unassigns the user as an editor if they are one
	 * @param user Target user
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
			user.becomeCourseAdmin(this, false)
		}
	}

	/**
	 * Assigns a user as an editor of this course. Unassigns the user as an admin if they are one
	 * @param user Target user
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
			user.becomeCourseEditor(this, false)
		}
	}

	/**
	 * Unassigns this course from a program
	 * @param program Target program
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignProgram(program: ProgramController, mirror: boolean = true): void {
		if (!this._program_ids.includes(program.id)) return

		// Unassign program
		this._program_ids = this._program_ids.filter(id => id !== program.id)
		this._programs = this._programs?.filter(known => known.id !== program.id)

		if (mirror) {
			program.unassignCourse(this, false)
		}
	}

	/**
	 * Unassigns a graph from this course
	 * @param graph Target graph
	 */

	unassignGraph(graph: GraphController): void {
		if (!this._graph_ids.includes(graph.id)) return

		// Unassign graph
		this._graph_ids = this._graph_ids.filter(id => id !== graph.id)
		this._graphs = this._graphs?.filter(known => known.id !== graph.id)
	}

	/**
	 * Unassign a link from this course
	 * @param link Target link
	 */

	unassignLink(link: LinkController): void {
		if (!this._link_ids.includes(link.id)) return

		// Unassign link
		this._link_ids = this._link_ids.filter(id => id !== link.id)
		this._links = this._links?.filter(known => known.id !== link.id)
	}

	/**
	 * Unassigns an admin from this course
	 * @param user Target user
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignAdmin(user: UserController, mirror: boolean = true): void {
		if (!this._admin_ids.includes(user.id)) return

		// Unassign admin
		this._admin_ids = this._admin_ids.filter(id => id !== user.id)
		this._admins = this._admins?.filter(known => known.id !== user.id)

		if (mirror) {
			user.resignAsCourseAdmin(this, false)
		}
	}

	/**
	 * Unassigns an editor from this course
	 * @param user Target user
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignEditor(user: UserController, mirror: boolean = true): void {
		if (!this._editor_ids.includes(user.id)) return

		// Unassign editor
		this._editor_ids = this._editor_ids.filter(id => id !== user.id)
		this._editors = this._editors?.filter(known => known.id !== user.id)

		if (mirror) {
			user.resignAsCourseEditor(this, false)
		}
	}

	// --------------------> Utility

	/**
	 * Checks if this course matches a query
	 * @param query Query to match against
	 * @returns Whether this course matches the query
	 */

	matchesQuery(query: string): boolean {
		query = query.trim().toLowerCase()
		if (query === '') return true

		let code = this.code.toLowerCase()
		let name = this.name.toLowerCase()

		return code.includes(query) || name.includes(query)
	}
}