
// External dependencies
import * as uuid from 'uuid'
import { browser } from '$app/environment'

// Internal dependencies
import {
	ControllerCache,
	GraphController,
	LectureController
} from '$scripts/controllers'

import { styles } from '$scripts/settings'
import * as settings from '$scripts/settings'
import { ValidationData, Severity } from '$scripts/validation'

import type {
	SerializedGraph,
	SerializedDomain, 
	SerializedSubject 
} from '$scripts/types'

// Exports
export { FieldController, DomainController, SubjectController }


// --------------------> Controllers


abstract class FieldController<T extends DomainController | SubjectController> {
	protected _graph?: GraphController
	protected _parents?: T[]
	protected _children?: T[]

	uuid: string
	fx?: number
	fy?: number

	constructor(
		public cache: ControllerCache,
		public id: number,
		public x: number,
		public y: number,
		public name: string,
		protected _graph_id: number,
		protected _parent_ids: number[],
		protected _child_ids: number[]
	) {
		this.uuid = uuid.v4()
	}

	get trimmed_name(): string {
		return this.name.trim()
	}

	get graph_id(): number {
		return this._graph_id
	}

	get parent_ids(): number[] {
		return Array.from(this._parent_ids)
	}

	get child_ids(): number[] {
		return Array.from(this._child_ids)
	}

	abstract getGraph(): Promise<GraphController>
	abstract getParents(): Promise<T[]>
	abstract getChildren(): Promise<T[]>
	abstract getStyle(): Promise<string | null>
	abstract getColor(): Promise<string>
	abstract getIndex(): Promise<number>

	abstract assignToGraph(graph: GraphController, mirror: boolean): void
	abstract assignParent(parent: T, mirror: boolean): void
	abstract assignChild(child: T, mirror: boolean): void
	abstract unassignParent(parent: T, mirror: boolean): void
	abstract unassignChild(child: T, mirror: boolean): void
}

class DomainController extends FieldController<DomainController> {
	private _subjects?: SubjectController[]

	constructor(
		cache: ControllerCache,
		id: number,
		x: number,
		y: number,
		name: string,
		private _style: string | null,
		_graph_id: number,
		_parent_ids: number[],
		_child_ids: number[],
		private _subject_ids: number[]
	) {
		super(cache, id, x, y, name, _graph_id, _parent_ids, _child_ids)
		this.cache.add(this)
	}

	get style(): string | null {
		return this._style
	}

	set style(value: string | null) {
		this._style = value
	}
	
	get subject_ids(): number[] {
		return Array.from(this._subject_ids)
	}

	/**
	 * Create a new domain
	 * @param environment Environment to create the domain in
	 * @param graph Graph to assign the domain to
	 * @returns `Promise<DomainController>` The newly created DomainController
	 * @throws `APIError` if the API call fails
	 */

	static async create(environment: ControllerCache, graph: GraphController): Promise<DomainController> {

		// Call API to create a new domain
		const response = await fetch(`/api/domain`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ graph: graph.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/domain POST): ${error}`)
		})

		// Revive the domain
		const data = await response.json()
		const domain = DomainController.revive(environment, data)
		graph.assignDomain(domain, false)

		return domain
	}

	/**
	 * Revive a domain from serialized data
	 * @param cache Cache to revive the domain in
	 * @param data Serialized data to revive
	 * @returns `DomainController` The revived Domain
	 */

	static revive(cache: ControllerCache, data: SerializedDomain): DomainController {
		return new DomainController(cache, data.id, data.x, data.y, data.name, data.style, data.graph, data.parents, data.children, data.subjects)
	}

	/**
	 * Validate the domain
	 * @returns `Promise<ValidationData>` Validation data
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		if (this.trimmed_name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Domain has no name',
				tab: 1,
				uuid: this.uuid
			})
		}

		else {
			const original = await this.findOriginalName()
			if (original !== -1) {
				validation.add({
					severity: Severity.warning,
					short: 'Domain name is already in use',
					long: `Name first used by Domain nr. ${original + 1}`,
					tab: 1,
					uuid: this.uuid
				})
			}

			if (this.trimmed_name.length > settings.FIELD_MAX_CHARS) {
				validation.add({
					severity: Severity.error,
					short: 'Domain name is too long',
					long: `Name exceeds ${settings.FIELD_MAX_CHARS} characters`,
					tab: 1,
					uuid: this.uuid
				})
			}
		}

		if (this.style === null) {
			validation.add({
				severity: Severity.error,
				short: 'Domain has no style',
				tab: 1,
				uuid: this.uuid
			})
		}

		else {

			const original = await this.findOriginalStyle(this.style)
			if (original !== -1) {
				validation.add({
					severity: Severity.warning,
					short: 'Domain style is already in use',
					long: `Style first used by Domain nr. ${original + 1}`,
					tab: 1,
					uuid: this.uuid
				})
			}
		}

		if (this.subject_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Domain has no subjects',
				tab: 1,
				uuid: this.uuid
			})
		}

		return validation
	}

	/**
	 * Serialize the domain
	 * @returns `Promise<SerializedDomain>` Serialized domain
	 */

	async reduce(): Promise<SerializedDomain> {
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			name: this.trimmed_name,
			style: this.style,
			graph: this.graph_id,
			parents: this.parent_ids,
			children: this.child_ids,
			subjects: this.subject_ids
		}
	}

	/**
	 * Save the domain
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Call API to save the domain
		await fetch(`/api/domain`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(await this.reduce())
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/domain PUT): ${error}`)
		})
	}

	/**
	 * Delete the domain
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {
		
		// Call API to delete the domain
		await fetch(`/api/domain`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/domain DELETE): ${error}`)
			})

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		await this.cache.find(GraphController, this.graph_id)
			?.unassignDomain(this)

		for (const id of this.parent_ids) {
			await this.cache.find(DomainController, id)
				?.unassignChild(this, false)
		}

		for (const id of this.child_ids) {
			await this.cache.find(DomainController, id)
				?.unassignParent(this, false)
		}

		for (const id of this.subject_ids) {
			await this.cache.find(SubjectController, id)
				?.unassignFromDomain(this, false)
		}

		// Remove from environment
		this.cache.remove(this)
	}

	/**
	 * Get the graph this field is assigned to
	 * @returns `Promise<GraphController>` The graph this field is assigned to
	 * @throws `APIError` if the API call fails
	 */

	async getGraph(): Promise<GraphController> {
	
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if course is already loaded
		if (this._graph) {
			return this._graph
		}

		// Call API to get the graph data
		const response = await fetch(`/api/domain/${this.id}/graph`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/domain/${this.id}/graph GET): ${error}`)
			})

		// Revive the course
		const data = await response.json() as SerializedGraph
		this._graph = GraphController.revive(this.cache, data)

		return this._graph
	}

	/**
	 * Get the parents of the domain
	 * @returns `Promise<DomainController[]>` The parents of the domain
	 * @throws `APIError` if the API call fails
	 */

	async getParents(): Promise<DomainController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if parents are already loaded
		if (this._parents) {
			return Array.from(this._parents)
		}

		// Call API to get the parent data
		const response = await fetch(`/api/domain/${this.id}/parents`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/domain/${this.id}/parents GET): ${error}`)
			})

		// Revive the parents
		const data = await response.json() as SerializedDomain[]
		this._parents = data.map(parent => DomainController.revive(this.cache, parent))

		return Array.from(this._parents)
	}

	/**
	 * Get the children of the domain
	 * @returns `Promise<DomainController[]>` The children of the domain
	 * @throws `APIError` if the API call fails
	 */

	async getChildren(): Promise<DomainController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if children are already loaded
		if (this._children) {
			return Array.from(this._children)
		}

		// Call API to get the child data
		const response = await fetch(`/api/domain/${this.id}/children`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/domain/${this.id}/children GET): ${error}`)
			})

		// Revive the children
		const data = await response.json() as SerializedDomain[]
		this._children = data.map(child => DomainController.revive(this.cache, child))

		return Array.from(this._children)
	}

	/**
	 * Get the subjects assigned to the domain
	 * @returns `Promise<SubjectController[]>` The subjects assigned to the domain
	 * @throws `APIError` if the API call fails
	 */

	async getSubjects(): Promise<SubjectController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if subjects are already loaded
		if (this._subjects) {
			return Array.from(this._subjects)
		}

		// Call API to get the subject data
		const response = await fetch(`/api/domain/${this.id}/subjects`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/domain/${this.id}/subjects GET): ${error}`)
			})

		// Revive the subjects
		const data = await response.json() as SerializedSubject[]
		this._subjects = data.map(subject => SubjectController.revive(this.cache, subject))

		return Array.from(this._subjects)
	}

	/**
	 * Get the style of the domain
	 * @returns `Promise<string | null>` The style of the domain
	 */

	async getStyle(): Promise<string | null> {
		return this.style
	}

	/**
	 * Get the style options for the domain
	 * returns `Promise<{ value: string, label: string, validation: ValidationData }[]>` The style options for the domain
	 */

	async getStyleOptions(): Promise<{ value: string, label: string, validation: ValidationData }[]> {
		return await Promise.all(
			Object.keys(styles).map(async style => {
				const original = await this.findOriginalStyle(style)
				const validation = original === -1 ? ValidationData.success() : ValidationData.warning(
					'Style is already in use',
					`Style first used by Domain nr. ${original + 1}`,
					1,
					this.uuid
				)

				return {
					value: style,
					label: styles[style].display_name,
					validation
				}
			})
		)
	}

	/**
	 * Get the color of the domain
	 * @returns `Promise<string>` The color of the domain
	 */

	async getColor(): Promise<string> {
		const style = await this.getStyle()
		return style ? styles[style].stroke : 'transparent'
	}
	
	/**
	 * Get the index of the domain in the graph
	 * @returns `Promise<number>` Index of the domain in the graph
	 */

	async getIndex(): Promise<number> {
		const graph = await this.getGraph()
		return graph.domain_ids.indexOf(this.id)
	}

	/**
	 * Check if the domain matches a query
	 * @param query Query to match
	 * @returns `Promise<boolean>` Whether the domain matches the query
	 */

	async matchesQuery(query: string): Promise<boolean> {
		const query_lower = query.toLowerCase()
		const name = this.trimmed_name.toLowerCase()
		const style = this.style ? styles[this.style].display_name.toLowerCase() : ''

		return name.includes(query_lower) || style.includes(query_lower)
	}

	/**
	 * Find the first occurrence of the domain's name in the graph
	 * @returns `Promise<number>` Index of the original name in the graph, or -1 if the name is unique/nonexistant
	 * @throws `DomainError` if the domain is not found in the graph
	 */

	private async findOriginalName(): Promise<number> {
		if (this.trimmed_name === '') {
			return -1
		}

		const graph = await this.getGraph()
		const domains = await graph.getDomains()

		for (let index = 0; index < graph.domain_ids.length; index++) {
			if (graph.domain_ids[index] === this.id) {
				return -1
			}

			const domain = domains.find(domain => domain.id === graph.domain_ids[index])
			if (domain === undefined) throw new Error('DomainError: Domain not found in graph')
			if (domain.name === this.trimmed_name) return index
		}

		throw new Error('DomainError: Domain not found in graph')
	}

	/**
	 * Find the first occurrence of the domain's style in the graph
	 * @returns `Promise<number>` Index of the original style in the graph, or -1 if the style is unique/nonexistant
	 */

	private async findOriginalStyle(style: string): Promise<number> {
		const graph = await this.getGraph()
		const domains = await graph.getDomains()

		for (let index = 0; index < graph.domain_ids.length; index++) {
			if (graph.domain_ids[index] === this.id) {
				return -1
			}

			const domain = domains.find(domain => domain.id === graph.domain_ids[index])
			if (domain === undefined) throw new Error('DomainError: Domain not found in graph')

			const domain_style = await domain.getStyle()
			if (domain_style === style) return index
		}

		throw new Error('DomainError: Domain not found in graph')
	}

	/**
	 * Assign a graph to the domain
	 * @param graph Graph to assign to the domain
	 * @param mirror Whether to mirror the assignment
	 * @throws `DomainError` if the domain is already assigned to this graph
	 */

	assignToGraph(graph: GraphController, mirror: boolean = true): void {
		if (this.graph_id === graph.id) {
			throw new Error(`DomainError: Domain is already assigned to Graph with ID ${graph.id}`)
		}

		// Unassign from current graph
		if (mirror && this.graph_id) {
			this.cache.find(GraphController, this.graph_id)
				?.unassignDomain(this)
		}

		// Assign to new graph
		this._graph = graph
		this._graph_id = graph.id
		if (mirror) graph.assignDomain(this, false)
	}

	/**
	 * Assign a parent domain to the domain
	 * @param parent Domain to assign as a parent
	 * @param mirror Whether to mirror the assignment
	 * @throws `DomainError` if the domain is already assigned as a parent
	 */

	assignParent(parent: DomainController, mirror: boolean = true): void {
		if (this.parent_ids.includes(parent.id)) {
			throw new Error(`DomainError: Domain is already assigned as a parent of Domain with ID ${parent.id}`)
		}

		// Assign parent
		this._parents?.push(parent)
		this._parent_ids.push(parent.id)
		if (mirror) parent.assignChild(this, false)
	}

	/**
	 * Assign a child domain to the domain
	 * @param child Domain to assign as a child
	 * @param mirror Whether to mirror the assignment
	 * @throws `DomainError` if the domain is already assigned as a child
	 */

	assignChild(child: DomainController, mirror: boolean = true): void {
		if (this.child_ids.includes(child.id)) {
			throw new Error(`DomainError: Domain is already assigned as a child of Domain with ID ${child.id}`)
		}

		// Assign child
		this._children?.push(child)
		this._child_ids.push(child.id)
		if (mirror) child.assignParent(this, false)
	}

	/**
	 * Assign a subject to the domain
	 * @param subject Subject to assign to the domain
	 * @param mirror Whether to mirror the assignment
	 * @throws `DomainError` if the subject is already assigned to the domain
	 */

	assignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this.subject_ids.includes(subject.id)) {
			throw new Error(`DomainError: Domain is already assigned to Subject with ID ${subject.id}`)
		}

		// Assign subject
		this._subjects?.push(subject)
		this._subject_ids.push(subject.id)
		if (mirror) subject.assignToDomain(this, false)
	}

	/**
	 * Unassign a parent domain from the domain
	 * @param parent Domain to unassign as a parent
	 * @param mirror Whether to mirror the unassignment
	 * @throws `DomainError` if the domain is not assigned as a parent
	 */

	unassignParent(parent: DomainController, mirror: boolean = true): void {
		if (!this.parent_ids.includes(parent.id)) {
			throw new Error(`DomainError: Domain is not assigned as a parent of Domain with ID ${parent.id}`)
		}
		
		// Unassign parent
		this._parent_ids = this.parent_ids.filter(id => id !== parent.id)
		this._parents = this._parents?.filter(parent => parent.id !== parent.id)
		if (mirror) parent.unassignChild(this, false)
	}

	/**
	 * Unassign a child domain from the domain
	 * @param child Domain to unassign as a child
	 * @param mirror Whether to mirror the unassignment
	 * @throws `DomainError` if the domain is not assigned as a child
	 */

	unassignChild(child: DomainController, mirror: boolean = true): void {
		if (!this.child_ids.includes(child.id)) {
			throw new Error(`DomainError: Domain is not assigned as a child of Domain with ID ${child.id}`)
		}

		// Unassign child
		this._child_ids = this.child_ids.filter(id => id !== child.id)
		this._children = this._children?.filter(child => child.id !== child.id)
		if (mirror) child.unassignParent(this, false)
	}

	/**
	 * Unassign a subject from the domain
	 * @param subject Subject to unassign from the domain
	 * @param mirror Whether to mirror the unassignment
	 * @throws `DomainError` if the subject is not assigned to the domain
	 */

	unassignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (!this.subject_ids.includes(subject.id)) {
			throw new Error(`DomainError: Domain is not assigned to Subject with ID ${subject.id}`)
		}

		// Unassign subject
		this._subject_ids = this.subject_ids.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(subject => subject.id !== subject.id)
		if (mirror) subject.unassignFromDomain(this, false)
	}
}

class SubjectController extends FieldController<SubjectController> {
	private _domain?: DomainController | null
	private _lectures?: LectureController[]

	constructor(
		environment: ControllerCache,
		id: number,
		x: number,
		y: number,
		name: string,
		private _domain_id: number | null,
		_graph_id: number,
		_parent_ids: number[],
		_child_ids: number[],
		private _lecture_ids: number[]
	) {
		super(environment, id, x, y, name, _graph_id, _parent_ids, _child_ids)
		this.cache.add(this)
	}

	get domain_id(): number | null {
		return this._domain_id
	}

	get lecture_ids(): number[] {
		return Array.from(this._lecture_ids)
	}

	/**
	 * Create a new subject
	 * @param cache Cache to create the subject in
	 * @param graph Graph to assign the subject to
	 * @returns `Promise<SubjectController>` The newly created SubjectController
	 * @throws `APIError` if the API call fails
	 */

	static async create(cache: ControllerCache, graph: GraphController): Promise<SubjectController> {

		// Call API to create a new subject
		const response = await fetch(`/api/subject`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ graph: graph.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/subject POST): ${error}`)
		})

		// Revive the subject
		const data = await response.json()
		const subject = SubjectController.revive(cache, data)
		graph.assignSubject(subject, false)

		return subject
	}

	/**
	 * Revive a subject from serialized data
	 * @param cache Cache to revive the subject in
	 * @param data Serialized data to revive
	 * @returns `SubjectController` The revived Subject
	 */

	static revive(cache: ControllerCache, data: SerializedSubject): SubjectController {
		return new SubjectController(cache, data.id, data.x, data.y, data.name, data.domain, data.graph, data.parents, data.children, data.lectures)
	}

	/**
	 * Validate the subject
	 * @returns `Promise<ValidationData>` Validation data
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		if (this.trimmed_name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Subject has no name',
				tab: 2,
				uuid: this.uuid
			})
		}

		else {
			const original = await this.findOriginalName()
			if (original !== -1) {
				validation.add({
					severity: Severity.warning,
					short: 'Subject name is already in use',
					long: `Name first used by Subject nr. ${original + 1}`,
					tab: 2,
					uuid: this.uuid
				})
			}

			if (this.trimmed_name.length > settings.FIELD_MAX_CHARS) {
				validation.add({
					severity: Severity.error,
					short: 'Subject name is too long',
					long: `Name exceeds ${settings.FIELD_MAX_CHARS} characters`,
					tab: 2,
					uuid: this.uuid
				})
			}
		}

		if (this.domain_id === null) {
			validation.add({
				severity: Severity.error,
				short: 'Subject has no domain',
				tab: 2,
				uuid: this.uuid
			})
		}

		return validation
	}

	/**
	 * Serialize the subject
	 * @returns `SerializedSubject` Serialized subject
	 */

	reduce(): SerializedSubject {
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			name: this.trimmed_name,
			domain: this.domain_id,
			graph: this.graph_id,
			parents: this.parent_ids,
			children: this.child_ids,
			lectures: this.lecture_ids
		}
	}

	/**
	 * Save the subject
	 * @throws `APIError` if the API call fails
	 */

	async save(): Promise<void> {

		// Call API to save the subject
		await fetch(`/api/subject`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/subject PUT): ${error}`)
		})
	}

	/**
	 * Delete the subject
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {
		
		// Call API to delete the subject
		await fetch(`/api/subject`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/subject DELETE): ${error}`)
			})

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		await this.cache.find(GraphController, this.graph_id)
			?.unassignSubject(this)

		if (this.domain_id !== null) {
			await this.cache.find(DomainController, this.domain_id)
				?.unassignSubject(this, false)
		}

		for (const id of this.parent_ids) {
			await this.cache.find(SubjectController, id)
				?.unassignChild(this, false)
		}

		for (const id of this.child_ids) {
			await this.cache.find(SubjectController, id)
				?.unassignParent(this, false)
		}

		for (const id of this.lecture_ids) {
			await this.cache.find(LectureController, id)
				?.unassignSubject(this, false)
		}

		// Remove from environment
		this.cache.remove(this)
	}

	/**
	 * Get the graph this field is assigned to
	 * @returns `Promise<GraphController>` The graph this field is assigned to
	 */

	async getGraph(): Promise<GraphController> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if course is already loaded
		if (this._graph) {
			return this._graph
		}

		// Call API to get the graph data
		const response = await fetch(`/api/subject/${this.id}/course`, { method: 'GET' })
			.catch(error => { 
				throw new Error(`APIError (/api/subject/${this.id}/course GET): ${error}`)
			})

		// Revive the course
		const data = await response.json() as SerializedGraph
		this._graph = GraphController.revive(this.cache, data)

		return this._graph
	}

	/**
	 * Get the domain the subject is assigned to
	 * @returns `Promise<DomainController | null>` The domain the subject is assigned to
	 */

	async getDomain(): Promise<DomainController | null> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if domain is already loaded
		if (this._domain) {
			return this._domain
		}

		// Call API to get the domain data
		const response = await fetch(`/api/subject/${this.id}/domain`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/subject/${this.id}/domain GET): ${error}`)
			})

		// Revive the domain
		const data = await response.json() as SerializedDomain
		this._domain = data ? DomainController.revive(this.cache, data) : null

		return this._domain
	}

	/**
	 * Get the lectures assigned to the subject
	 * @returns `Promise<LectureController[]>` The lectures assigned to the subject
	 * @throws `APIError` if the API call fails
	 */

	async getLectures(): Promise<LectureController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if lectures are already loaded
		if (this._lectures) {
			return Array.from(this._lectures)
		}

		// Call API to get the lecture data
		const response = await fetch(`/api/subject/${this.id}/lectures`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/subject/${this.id}/lectures GET): ${error}`)
			})

		// Revive the lectures
		const data = await response.json() as SerializedDomain[]
		this._lectures = data.map(lecture => LectureController.revive(this.cache, lecture))

		return Array.from(this._lectures)
	}

	/**
	 * Get the parents of the subject
	 * @returns `Promise<SubjectController[]>` The parents of the subject
	 * @throws `APIError` if the API call fails
	 */

	async getParents(): Promise<SubjectController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if parents are already loaded
		if (this._parents) {
			return Array.from(this._parents)
		}

		// Call API to get the parent data
		const response = await fetch(`/api/subject/${this.id}/parents`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/subject/${this.id}/parents GET): ${error}`)
			})

		// Revive the parents
		const data = await response.json() as SerializedSubject[]
		this._parents = data.map(parent => SubjectController.revive(this.cache, parent))

		return Array.from(this._parents)
	}

	/**
	 * Get the children of the subject
	 * @returns `Promise<SubjectController[]>` The children of the subject
	 * @throws `APIError` if the API call fails
	 */

	async getChildren(): Promise<SubjectController[]> {
		
		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if children are already loaded
		if (this._children) {
			return Array.from(this._children)
		}

		// Call API to get the child data
		const response = await fetch(`/api/subject/${this.id}/children`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/subject/${this.id}/children GET): ${error}`)
			})

		// Revive the children
		const data = await response.json() as SerializedSubject[]
		this._children = data.map(child => SubjectController.revive(this.cache, child))

		return Array.from(this._children)
	}

	/**
	 * Get the style of the subject
	 * @returns `Promise<string | null>` The style of the subject`
	 */

	async getStyle(): Promise<string | null> {
		const domain = await this.getDomain()
		return domain ? domain.getStyle() : null
	}

	/**
	 * Get the color of the subject
	 * @returns `Promise<string>` The color of the subject
	 */

	async getColor(): Promise<string> {
		const domain = await this.getDomain()
		return domain ? domain.getColor() : 'transparent'
	}

	/**
	 * Get the index of the subject in the graph
	 * @returns `Promise<number>` Index of the subject in the graph
	 */

	async getIndex(): Promise<number> {
		const graph = await this.getGraph()
		return graph.subject_ids.indexOf(this.id)
	}

	/**
	 * Check if the subject matches a query
	 * @param query Query to match
	 * @returns `Promise<boolean>` Whether the subject matches the query
	 */

	async matchesQuery(query: string): Promise<boolean> {
		const query_lower = query.toLowerCase()
		const name = this.trimmed_name.toLowerCase()
		const domain = await this.getDomain().then(domain => domain?.name.toLowerCase() || '')

		return name.includes(query_lower) || domain.includes(query_lower)
	}
	
	/**
	 * Find the first occurrence of the subject's name in the graph
	 * @returns `Promise<number>` Index of the original name in the graph, or -1 if the name is unique/nonexistant
	 */

	private async findOriginalName(): Promise<number> {
			if (this.trimmed_name === '') {
				return -1
			}
	
			const graph = await this.getGraph()
			const subjects = await graph.getSubjects()
	
			for (let index = 0; index < graph.subject_ids.length; index++) {
				if (graph.subject_ids[index] === this.id) {
					return -1
				}
	
				const subject = subjects.find(subject => subject.id === graph.subject_ids[index])
				if (subject === undefined) throw new Error('SubjectError: Subject not found in graph')
				if (subject.name === this.trimmed_name) return index
			}
	
			throw new Error('SubjectError: Subject not found in graph')
	}

	/**
	 * Assign the subject to a graph
	 * @param graph Graph to assign the subject to
	 * @param mirror Whether to mirror the assignment
	 * @throws `SubjectError` if the subject is already assigned to the graph
	 */

	assignToGraph(graph: GraphController, mirror: boolean = true): void {
		if (this.graph_id === graph.id) {
			throw new Error(`SubjectError: Subject is already assigned to Graph with ID ${graph.id}`)
		}

		// Unassign from current graph
		if (mirror && this.graph_id) {
			this.cache.find(GraphController, this.graph_id)
				?.unassignSubject(this)
		}

		// Assign to new graph
		this._graph = graph
		this._graph_id = graph.id
		if (mirror) graph.assignSubject(this, false)
	}

	/**
	 * Assign a parent subject to the subject
	 * @param parent Subject to assign as a parent
	 * @param mirror Whether to mirror the assignment
	 * @throws `SubjectError` if the subject is already assigned as a parent
	 */

	assignParent(parent: SubjectController, mirror: boolean = true): void {
		if (this.parent_ids.includes(parent.id)) {
			throw new Error(`SubjectError: Subject is already assigned as a parent of Subject with ID ${parent.id}`)
		}

		// Assign parent
		this._parents?.push(parent)
		this._parent_ids.push(parent.id)
		if (mirror) parent.assignChild(this, false)
	}

	/**
	 * Assign a child subject to the subject
	 * @param child Subject to assign as a child
	 * @param mirror Whether to mirror the assignment
	 * @throws `SubjectError` if the subject is already assigned as a child
	 */

	assignChild(child: SubjectController, mirror: boolean = true): void {
		if (this.child_ids.includes(child.id)) {
			throw new Error(`SubjectError: Subject is already assigned as a child of Subject with ID ${child.id}`)
		}

		this._children?.push(child)
		this._child_ids.push(child.id)
		if (mirror) child.assignParent(this, false)
	}

	/**
	 * Assign a domain to the subject
	 * @param domain Domain to assign to the subject
	 * @param mirror Whether to mirror the assignment
	 * @throws `SubjectError` if the subject is already assigned to a domain
	 */

	assignToDomain(domain: DomainController, mirror: boolean = true): void {
		if (this.domain_id !== null) {
			throw new Error(`SubjectError: Subject is already assigned to Domain with ID ${this.domain_id}`)
		}

		this._domain = domain
		this._domain_id = domain.id
		if (mirror) domain.assignSubject(this, false)
	}

	/**
	 * Assign the subject to a lecture
	 * @param lecture Lecture to assign the subject to
	 * @param mirror Whether to mirror the assignment
	 * @throws `SubjectError` if the subject is already assigned to the lecture
	 */

	assignToLecture(lecture: LectureController, mirror: boolean = true): void {
		if (this.lecture_ids.includes(lecture.id)) {
			throw new Error(`SubjectError: Subject is already assigned to Lecture with ID ${lecture.id}`)
		}

		// Assign lecture
		this._lectures?.push(lecture)
		this._lecture_ids.push(lecture.id)
		if (mirror) lecture.assignSubject(this, false)
	}

	/**
	 * Unassign a parent subject from the subject
	 * @param parent Subject to unassign as a parent
	 * @param mirror Whether to mirror the unassignment
	 * @throws `SubjectError` if the subject is not assigned as a parent
	 */

	unassignParent(parent: SubjectController, mirror: boolean = true): void {
		if (!this.parent_ids.includes(parent.id)) {
			throw new Error(`SubjectError: Subject is not assigned as a parent of Subject with ID ${parent.id}`)
		}

		// Unassign parent
		this._parents = this._parents?.filter(parent => parent.id !== parent.id)
		this._parent_ids = this.parent_ids.filter(id => id !== parent.id)
		if (mirror) parent.unassignChild(this, false)
	}

	/**
	 * Unassign a child subject from the subject
	 * @param child Subject to unassign as a child
	 * @param mirror Whether to mirror the unassignment
	 * @throws `SubjectError` if the subject is not assigned as a child
	 */

	unassignChild(child: SubjectController, mirror: boolean = true): void {
		if (!this.child_ids.includes(child.id)) {
			throw new Error(`SubjectError: Subject is not assigned as a child of Subject with ID ${child.id}`)
		}

		// Unassign child
		this._children = this._children?.filter(child => child.id !== child.id)
		this._child_ids = this.child_ids.filter(id => id !== child.id)
		if (mirror) child.unassignParent(this, false)
	}

	/**
	 * Unassign the subject from a domain
	 * @param domain Domain to unassign the subject from
	 * @param mirror Whether to mirror the unassignment
	 * @throws `SubjectError` if the subject is not assigned to the domain
	 */

	unassignFromDomain(domain: DomainController, mirror: boolean = true): void {
		if (this.domain_id !== domain.id) {
			throw new Error(`SubjectError: Subject is not assigned to Domain with ID ${domain.id}`)
		}

		// Unassign domain
		this._domain = null
		this._domain_id = null
		if (mirror) domain.unassignSubject(this, false)
	}

	/**
	 * Unassign the subject from a lecture
	 * @param lecture Lecture to unassign the subject from
	 * @param mirror Whether to mirror the unassignment
	 * @throws `SubjectError` if the subject is not assigned to the lecture
	 */

	unassignFromLecture(lecture: LectureController, mirror: boolean = true): void {
		if (!this.lecture_ids.includes(lecture.id)) {
			throw new Error(`SubjectError: Subject is not assigned to Lecture with ID ${lecture.id}`)
		}

		// Unassign lecture
		this._lectures = this._lectures?.filter(lecture => lecture.id !== lecture.id)
		this._lecture_ids = this.lecture_ids.filter(id => id !== lecture.id)
		if (mirror) lecture.unassignSubject(this, false)
	}
}