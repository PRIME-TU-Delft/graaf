
// External dependencies
import * as uuid from 'uuid'
import { browser } from '$app/environment'

// Internal dependencies
import { styles } from '$scripts/settings'
import * as settings from '$scripts/settings'
import { ValidationData, Severity } from '$scripts/validation'

import {
	ControllerCache,
	GraphController,
	LectureController
} from '$scripts/controllers'

import type {
	SerializedGraph,
	SerializedDomain,
	SerializedSubject
} from '$scripts/types'

// Exports
export {
	FieldController,
	DomainController,
	SubjectController
}


// --------------------> Controllers


abstract class FieldController {
	protected _graph?: GraphController
	protected _parents?: FieldController[]
	protected _children?: FieldController[]

	uuid: string
	fx?: number
	fy?: number

	protected constructor(
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

	// --------------------> Getters & Setters

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

	// --------------------> API Getters

	/**
	 * Gets the color of this field
	 * @returns CSS color string
	 */

	async getColor(): Promise<string> {
		const style = await this.getStyle()
		return style ? styles[style].stroke : 'transparent'
	}

	// --------------------> Abstract

	abstract getGraph(): Promise<GraphController>
	abstract getParents(): Promise<FieldController[]>
	abstract getChildren(): Promise<FieldController[]>
	abstract getStyle(): Promise<string | null>
	abstract getIndex(): Promise<number>

	abstract represents(data: SerializedDomain | SerializedSubject): boolean
	abstract reduce(): SerializedDomain | SerializedSubject
	abstract save(): Promise<void>
	abstract delete(): Promise<void>
	abstract validate(): Promise<ValidationData>

	abstract assignGraph(graph: GraphController, mirror?: boolean): void
	abstract assignParent(parent: FieldController, mirror?: boolean): void
	abstract assignChild(child: FieldController, mirror?: boolean): void
	abstract unassignParent(parent: FieldController, mirror?: boolean): void
	abstract unassignChild(child: FieldController, mirror?: boolean): void

	abstract matchesQuery(query: string): Promise<boolean>
}

class DomainController extends FieldController {
	private _subjects?: SubjectController[]

	private constructor(
		cache: ControllerCache,
		id: number,
		x: number,
		y: number,
		name: string,
		public style: string | null,
		graph_id: number,
		parent_ids: number[],
		child_ids: number[],
		private _subject_ids: number[]
	) {
		super(cache, id, x, y, name, graph_id, parent_ids, child_ids)
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	set graph_id(id: number) {

		// Unassign previous graph
		this.cache.find(GraphController, this._graph_id)
			?.unassignDomain(this)

		// Assign new graph
		this._graph = undefined
		this._graph_id = id

		this.cache.find(GraphController, this._graph_id)
			?.assignDomain(this, false)
	}

	get subject_ids(): number[] {
		return Array.from(this._subject_ids)
	}

	// --------------------> API Getters

	/**
	 * Gets the graph this domain is assigned to, from the cache or the API
	 * @returns The graph this domain is assigned to
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
	 * Get the parents of this domain, from the cache or the API
	 * @returns The parents of this domain
	 * @throws `APIError` if the API call fails
	 */

	async getParents(): Promise<DomainController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if parents are already loaded
		if (this._parents) {
			return Array.from(this._parents) as DomainController[]
		}

		// Call API to get the parent data
		const response = await fetch(`/api/domain/${this.id}/parents`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/domain/${this.id}/parents GET): ${error}`)
			})

		// Revive the parents
		const data = await response.json() as SerializedDomain[]
		this._parents = data.map(parent => DomainController.revive(this.cache, parent))

		return Array.from(this._parents) as DomainController[]
	}

	/**
	 * Get the children of this domain, from the cache or the API
	 * @returns The children of this domain
	 * @throws `APIError` if the API call fails
	 */

	async getChildren(): Promise<DomainController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if children are already loaded
		if (this._children) {
			return Array.from(this._children) as DomainController[]
		}

		// Call API to get the child data
		const response = await fetch(`/api/domain/${this.id}/children`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/domain/${this.id}/children GET): ${error}`)
			})

		// Revive the children
		const data = await response.json() as SerializedDomain[]
		this._children = data.map(child => DomainController.revive(this.cache, child))

		return Array.from(this._children) as DomainController[]
	}

	/**
	 * Get the subjects assigned to this domain, from the cache or the API
	 * @returns The subjects assigned to this domain
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
	 * Get the style of this domain
	 * @returns The style of the domain
	 */

	async getStyle(): Promise<string | null> {
		return this.style
	}

	/**
	 * Get the style options for this domain
	 * @returns The style options for the domain
	 */

	async getStyleOptions(): Promise<{ value: string, label: string, validation: ValidationData }[]> {
		return await Promise.all(
			Object.keys(styles).map(async style => {

				// Validate style option
				let validation: ValidationData = new ValidationData()
				const original = await this.findOriginalStyle(style)
				if (original !== -1) {
					validation = ValidationData.warning(
						'Style is already in use',
						`Style first used by Domain nr. ${original + 1}`,
						1,
						this.uuid
					)
				}

				// Return style option
				return {
					value: style,
					label: styles[style].display_name,
					validation
				}
			})
		)
	}

	/**
	 * Get the index of this domain in the graph
	 * @returns Index of the domain in the graph
	 */

	async getIndex(): Promise<number> {
		const graph = await this.getGraph()
		return graph.domain_ids.indexOf(this.id)
	}

	// --------------------> API Actions

	/**
	 * Create a new domain
	 * @param cache Cache to create the domain with
	 * @param graph Graph to assign the domain to
	 * @returns The newly created DomainController
	 * @throws `APIError` if the API call fails
	 */

	static async create(cache: ControllerCache, graph: GraphController): Promise<DomainController> {

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
		const domain = DomainController.revive(cache, data)
		graph.assignDomain(domain)

		return domain
	}

	/**
	 * Revive a domain from serialized data, or retrieve an existing domain from the cache
	 * @param cache Cache to revive the domain with
	 * @param data Serialized data to revive
	 * @returns The revived DomainController
	 * @throws `DomainError` if the server data is out of sync with the cache
	 */

	static revive(cache: ControllerCache, data: SerializedDomain): DomainController {
		const existing = cache.find(DomainController, data.id)
		if (existing) {
			if (!existing.represents(data)) {
				throw new Error(`DomainError: Attempted to revive Domain with ID ${data.id}, but server data is out of sync with cache`)
			}
		}

		return new DomainController(cache, data.id, data.x, data.y, data.name, data.style, data.graph, data.parents, data.children, data.subjects)
	}

	/**
	 * Check if the domain represents the serialized data
	 * @param data Serialized data to compare against
	 * @returns Whether the domain represents the serialized data
	 */

	represents(data: SerializedDomain): boolean {

		// Check the easy stuff
		if (
			this.id !== data.id ||
			this.x !== data.x ||
			this.y !== data.y ||
			this.trimmed_name !== data.name ||
			this.style !== data.style ||
			this._graph_id !== data.graph
		) {
			return false
		}

		// Check parents
		if (
			this._parent_ids.length !== data.parents.length ||
			this._parent_ids.some(id => !data.parents.includes(id)) ||
			data.parents.some(id => !this._parent_ids.includes(id))
		) {
			return false
		}

		// Check children
		if (
			this._child_ids.length !== data.children.length ||
			this._child_ids.some(id => !data.children.includes(id)) ||
			data.children.some(id => !this._child_ids.includes(id))
		) {
			return false
		}

		// Check subjects
		if (
			this._subject_ids.length !== data.subjects.length ||
			this._subject_ids.some(id => !data.subjects.includes(id)) ||
			data.subjects.some(id => !this._subject_ids.includes(id))
		) {
			return false
		}

		return true
	}

	/**
	 * Serialize this domain
	 * @returns The serialized domain
	 */

	reduce(): SerializedDomain {
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			name: this.trimmed_name,
			style: this.style,
			graph: this._graph_id,
			parents: this._parent_ids,
			children: this._child_ids,
			subjects: this._subject_ids
		}
	}

	/**
	 * Save this domain
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
	 * Delete this domain
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Call API to delete the domain
		await fetch(`/api/domain/${this.id}`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/domain DELETE): ${error}`)
			})

		// Unassign from graph
		const graph = this.cache.find(GraphController, this._graph_id)
			?.unassignDomain(this)

		// Unassign from subjects
		for (const id of this._subject_ids) {
			const subject = this.cache.find(SubjectController, id)
				?.unassignDomain(false)
		}

		// Unassign from prarents
		for (const id of this._parent_ids) {
			const parent = this.cache.find(DomainController, id)
				?.unassignChild(this, false)
		}

		// Unassign from children
		for (const id of this._child_ids) {
			const child = this.cache.find(DomainController, id)
				?.unassignParent(this, false)
		}

		// Remove from cache
		this.cache.remove(this)
	}

	/**
	 * Copy this domain to a new graph
	 * @param target_graph Target graph
	 * @returns The newly created DomainController
	 */

	async copy(target_graph: GraphController): Promise<DomainController> {
		const domain_copy = await DomainController.create(this.cache, target_graph)

		domain_copy.name = this.name
		domain_copy.style = this.style
		domain_copy.x = this.x
		domain_copy.y = this.y
		domain_copy.fx = this.fx
		domain_copy.fy = this.fy

		await domain_copy.save()
		return domain_copy
	}

	// --------------------> Validation

	/**
	 * Check if this domain has a name
	 * @returns Whether the domain has a name
	 */

	private hasName(): boolean {
		return this.trimmed_name !== ''
	}

	/**
	 * Check if this domain's name is too long
	 * @returns Whether the domain's name is too long
	 */

	private nameTooLong(): boolean {
		return this.trimmed_name.length > settings.FIELD_MAX_CHARS
	}

	/**
	 * Find the first occurrence of this domain's name in the graph, ordered by index
	 * @returns Index of the original name in the graph, or -1 if the name is original/nonexistant
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
	 * Check if the domain has a style
	 * @returns Whether the domain has a style
	 */

	private hasStyle(): boolean {
		return this.style !== null
	}

	/**
	 * Find the first occurrence of a style in the graph, ordered by index
	 * @param style Style to find
	 * @returns Index of the original style in the graph, or -1 if the style is original/nonexistant
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
	 * Check if the domain has subjects
	 * @returns Whether the domain has subjects
	 */

	private hasSubjects(): boolean {
		return this._subject_ids.length > 0
	}

	/**
	 * Validate this domain
	 * @returns Validation data
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		if (!this.hasName()) {
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

			if (this.nameTooLong()) {
				validation.add({
					severity: Severity.error,
					short: 'Domain name is too long',
					long: `Name exceeds ${settings.FIELD_MAX_CHARS} characters`,
					tab: 1,
					uuid: this.uuid
				})
			}
		}

		if (!this.hasStyle()) {
			validation.add({
				severity: Severity.error,
				short: 'Domain has no style',
				tab: 1,
				uuid: this.uuid
			})
		}

		else {

			const original = await this.findOriginalStyle(this.style!)
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

		if (!this.hasSubjects()) {
			validation.add({
				severity: Severity.warning,
				short: 'Domain has no subjects',
				tab: 1,
				uuid: this.uuid
			})
		}

		return validation
	}

	// --------------------> Assignments

	/**
	 * Assign a graph to this domain
	 * @param graph Target graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_id === graph.id) return

		// Unassign previous graph
		if (this._graph_id && mirror) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignDomain(this)
		}

		// Assign new graph
		this._graph_id = graph.id
		this._graph = graph

		if (mirror) {
			graph.assignDomain(this, false)
		}
	}

	/**
	 * Assign a parent to this domain
	 * @param parent Target parent
	 * @param mirror Whether to mirror the assignment
	 */

	assignParent(parent: DomainController, mirror: boolean = true): void {
		if (this._parent_ids.includes(parent.id)) return

		// Assign parent
		this._parent_ids.push(parent.id)
		this._parents?.push(parent)

		if (mirror) {
			parent.assignChild(this, false)

			// Create relation
			this.cache.find(GraphController, this._graph_id)
				?.createDomainRelation(parent, this, false)
		}
	}

	/**
	 * Assign a child to this domain
	 * @param child Target child
	 * @param mirror Whether to mirror the assignment
	 */

	assignChild(child: DomainController, mirror: boolean = true): void {
		if (this._child_ids.includes(child.id)) return

		// Assign child
		this._child_ids.push(child.id)
		this._children?.push(child)

		if (mirror) {
			child.assignParent(this, false)

			// Create relation
			this.cache.find(GraphController, this._graph_id)
				?.createDomainRelation(this, child, false)
		}
	}

	/**
	 * Assign a subject to this domain
	 * @param subject Target subject
	 * @param mirror Whether to mirror the assignment
	 */

	assignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids.includes(subject.id)) return

		// Assign subject
		this._subject_ids.push(subject.id)
		this._subjects?.push(subject)

		if (mirror) {
			subject.assignDomain(this, false)
		}
	}

	/**
	 * Unassign a parent from this domain
	 * @param parent Target parent
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignParent(parent: DomainController, mirror: boolean = true): void {
		if (!this._parent_ids.includes(parent.id)) return

		// Unassign parent
		this._parent_ids = this._parent_ids.filter(id => id !== parent.id)
		this._parents = this._parents?.filter(known => known.id !== parent.id)

		if (mirror) {
			parent.unassignChild(this, false)

			// Delete relation
			this.cache.find(GraphController, this._graph_id)
				?.deleteDomainRelation(parent, this, false)
		}
	}

	/**
	 * Unassign a child from this domain
	 * @param child Target child
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignChild(child: DomainController, mirror: boolean = true): void {
		if (!this._child_ids.includes(child.id)) return

		// Unassign child
		this._child_ids = this._child_ids.filter(id => id !== child.id)
		this._children = this._children?.filter(known => known.id !== child.id)

		if (mirror) {
			child.unassignParent(this, false)

			// Delete relation
			this.cache.find(GraphController, this._graph_id)
				?.deleteDomainRelation(this, child, false)
		}
	}

	/**
	 * Unassign a subject from this domain
	 * @param subject Target subject
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (!this._subject_ids.includes(subject.id)) return

		// Unassign subject
		this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(known => known.id !== subject.id)

		if (mirror) {
			subject.unassignDomain(false)
		}
	}

	// --------------------> Utility

	/**
	 * Check if this domain matches a query
	 * @param query Query to match
	 * @returns Whether the domain matches the query
	 */

	async matchesQuery(query: string): Promise<boolean> {
		const query_lower = query.toLowerCase()
		const name = this.trimmed_name.toLowerCase()
		const style = this.style ? styles[this.style].display_name.toLowerCase() : ''

		return name.includes(query_lower) || style.includes(query_lower)
	}
}

class SubjectController extends FieldController {
	private _domain?: DomainController | null
	private _lectures?: LectureController[]

	private constructor(
		cache: ControllerCache,
		id: number,
		x: number,
		y: number,
		name: string,
		private _domain_id: number | null,
		graph_id: number,
		parent_ids: number[],
		child_ids: number[],
		private _lecture_ids: number[]
	) {
		super(cache, id, x, y, name, graph_id, parent_ids, child_ids)
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	set graph_id(id: number) {

		// Unassign previous graph
		this.cache.find(GraphController, this._graph_id)
			?.unassignSubject(this)

		// Assign new graph
		this._graph = undefined
		this._graph_id = id

		this.cache.find(GraphController, this._graph_id)
			?.assignSubject(this, false)
	}

	get domain_id(): number | null {
		return this._domain_id
	}

	set domain_id(id: number | null) {

		// Unassign previous domain
		if (this._domain_id) {
			this.cache.find(DomainController, this._domain_id)
				?.unassignSubject(this)
		}

		// Assign new domain
		this._domain = undefined
		this._domain_id = id

		if (this._domain_id) {
			this.cache.find(DomainController, this._domain_id)
				?.assignSubject(this, false)
		}
	}

	get lecture_ids(): number[] {
		return Array.from(this._lecture_ids)
	}

	// --------------------> API Getters

	/**
	 * Get the graph this subject is assigned to, from the cache or the API
	 * @returns The graph this subject is assigned to
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
	 * Get the domain this subject is assigned to, from the cache or the API
	 * @returns The domain this subject is assigned to
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
	 * Get the lectures assigned to this subject, from the cache or the API
	 * @returns The lectures assigned to this subject
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
	 * Get the parents of this subject, from the cache or the API
	 * @returns The parents of the subject
	 * @throws `APIError` if the API call fails
	 */

	async getParents(): Promise<SubjectController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if parents are already loaded
		if (this._parents) {
			return Array.from(this._parents) as SubjectController[]
		}

		// Call API to get the parent data
		const response = await fetch(`/api/subject/${this.id}/parents`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/subject/${this.id}/parents GET): ${error}`)
			})

		// Revive the parents
		const data = await response.json() as SerializedSubject[]
		this._parents = data.map(parent => SubjectController.revive(this.cache, parent))

		return Array.from(this._parents) as SubjectController[]
	}

	/**
	 * Get the children of this subject
	 * @returns The children of this subject
	 * @throws `APIError` if the API call fails
	 */

	async getChildren(): Promise<SubjectController[]> {

		// Guard against SSR
		if (!browser) {
			return Promise.reject()
		}

		// Check if children are already loaded
		if (this._children) {
			return Array.from(this._children) as SubjectController[]
		}

		// Call API to get the child data
		const response = await fetch(`/api/subject/${this.id}/children`, { method: 'GET' })
			.catch(error => {
				throw new Error(`APIError (/api/subject/${this.id}/children GET): ${error}`)
			})

		// Revive the children
		const data = await response.json() as SerializedSubject[]
		this._children = data.map(child => SubjectController.revive(this.cache, child))

		return Array.from(this._children) as SubjectController[]
	}

	/**
	 * Get the style of this subject
	 * @returns The style of this subject
	 */

	async getStyle(): Promise<string | null> {
		const domain = await this.getDomain()
		return domain ? domain.getStyle() : null
	}

	/**
	 * Get the index of this subject in the graph
	 * @returns Index of this subject in the graph
	 */

	async getIndex(): Promise<number> {
		const graph = await this.getGraph()
		return graph.subject_ids.indexOf(this.id)
	}

	// --------------------> API Actions

	/**
	 * Create a new subject
	 * @param cache Cache to create the subject with
	 * @param graph Graph to assign the subject to
	 * @returns The newly created SubjectController
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
		graph.assignSubject(subject)

		return subject
	}

	/**
	 * Revive a subject from serialized data, or retrieve an existing subject from the cache
	 * @param cache Cache to revive the subject with
	 * @param data Serialized data to revive
	 * @returns The revived SubjectController
	 * @throws `SubjectError` if the server data is out of sync with the cache
	 */

	static revive(cache: ControllerCache, data: SerializedSubject): SubjectController {
		const existing = cache.find(SubjectController, data.id)
		if (existing) {
			if (!existing.represents(data))
				throw new Error(`SubjectError: Attempted to revive Subject with ID ${data.id}, but server data is out of sync with cache`)
			return existing
		}

		return new SubjectController(cache, data.id, data.x, data.y, data.name, data.domain, data.graph, data.parents, data.children, data.lectures)
	}

	/**
	 * Serialize this subject
	 * @returns Serialized subject
	 */

	reduce(): SerializedSubject {
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			name: this.trimmed_name,
			domain: this._domain_id,
			graph: this._graph_id,
			parents: this._parent_ids,
			children: this._child_ids,
			lectures: this._lecture_ids
		}
	}

	/**
	 * Check if the subject represents the serialized data
	 * @param data Serialized data to compare against
	 * @returns Whether the subject represents the serialized data
	 */

	represents(data: SerializedSubject): boolean {

		// Check the easy stuff
		if (
			this.id !== data.id ||
			this.x !== data.x ||
			this.y !== data.y ||
			this.trimmed_name !== data.name ||
			this._domain_id !== data.domain ||
			this._graph_id !== data.graph
		) {
			return false
		}

		// Check parents
		if (
			this._parent_ids.length !== data.parents.length ||
			this._parent_ids.some(id => !data.parents.includes(id)) ||
			data.parents.some(id => !this._parent_ids.includes(id))
		) {
			return false
		}

		// Check children
		if (
			this._child_ids.length !== data.children.length ||
			this._child_ids.some(id => !data.children.includes(id)) ||
			data.children.some(id => !this._child_ids.includes(id))
		) {
			return false
		}

		// Check lectures
		if (
			this._lecture_ids.length !== data.lectures.length ||
			this._lecture_ids.some(id => !data.lectures.includes(id)) ||
			data.lectures.some(id => !this._lecture_ids.includes(id))
		) {
			return false
		}

		return true
	}

	/**
	 * Save this subject
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
	 * Delete this subject
	 * @throws `APIError` if the API call fails
	 */

	async delete(): Promise<void> {

		// Call API to delete the subject
		await fetch(`/api/subject/${this.id}`, { method: 'DELETE' })
			.catch(error => {
				throw new Error(`APIError (/api/subject/${this.id} DELETE): ${error}`)
			})

		// Unassign from graph
		this.cache.find(GraphController, this._graph_id)
			?.unassignSubject(this)

		// Unassign from domain
		if (this._domain_id) {
			this.cache.find(DomainController, this._domain_id)
				?.unassignSubject(this, false)
		}

		// Unassign from parents
		for (const id of this._parent_ids) {
			this.cache.find(SubjectController, id)
				?.unassignChild(this, false)
		}

		// Unassign from children
		for (const id of this._child_ids) {
			this.cache.find(SubjectController, id)
				?.unassignParent(this, false)
		}

		// Unassign from lectures
		for (const id of this._lecture_ids) {
			this.cache.find(LectureController, id)
				?.unassignSubject(this, false)
		}

		// Remove from cache
		this.cache.remove(this)
	}

	/**
	 * Copy this subject to a new graph
	 * @param target_graph Target graph
	 * @returns The newly created SubjectController
	 */

	async copy(target_graph: GraphController): Promise<SubjectController> {
		const subject_copy = await SubjectController.create(this.cache, target_graph)

		subject_copy.name = this.name
		subject_copy.x = this.x
		subject_copy.y = this.y
		subject_copy.fx = this.fx
		subject_copy.fy = this.fy

		await subject_copy.save()
		return subject_copy
	}

	// --------------------> Validation

	/**
	 * Check if this subject has a name
	 * @returns Whether the subject has a name
	 */

	private hasName(): boolean {
		return this.trimmed_name !== ''
	}

	/**
	 * Check if this subjects's name is too long
	 * @returns Whether the subject's name is too long
	 */

	private nameTooLong(): boolean {
		return this.trimmed_name.length > settings.FIELD_MAX_CHARS
	}

	/**
	 * Find the first occurrence of this subjects's name in the graph, ordered by index
	 * @returns Index of the original name in the graph, or -1 if the name is original/nonexistant
	 * @throws `SubjectError` if the subject is not found in the graph
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
	 * Check if the subject has a domain
	 * @returns Whether the subject has a domain
	 */

	private hasDomain(): boolean {
		return this._domain_id !== null
	}

	/**
	 * Validate this subject
	 * @returns Validation data
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		if (!this.hasName()) {
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

			if (this.nameTooLong()) {
				validation.add({
					severity: Severity.error,
					short: 'Subject name is too long',
					long: `Name exceeds ${settings.FIELD_MAX_CHARS} characters`,
					tab: 2,
					uuid: this.uuid
				})
			}
		}

		if (!this.hasDomain()) {
			validation.add({
				severity: Severity.error,
				short: 'Subject has no domain',
				tab: 2,
				uuid: this.uuid
			})
		}

		return validation
	}

	// --------------------> Assignments

	/**
	 * Assign a graph to this subject
	 * @param graph Target graph
	 * @param mirror Whether to mirror the assignment
	 */

	assignGraph(graph: GraphController, mirror: boolean = true): void {
		if (this._graph_id === graph.id) return

		// Unassign previous graph
		if (this._graph_id && mirror) {
			this.cache.find(GraphController, this._graph_id)
				?.unassignSubject(this)
		}

		// Assign new graph
		this._graph_id = graph.id
		this._graph = graph

		if (mirror) {
			graph.assignSubject(this, false)
		}
	}

	/**
	 * Assign a domain to this subject
	 * @param domain Target domain
	 * @param mirror Whether to mirror the assignment
	 */

	assignDomain(domain: DomainController, mirror: boolean = true): void {
		if (this._domain_id === domain.id) return

		// Unassign previous domain
		if (mirror && this._domain_id) {
			this.cache.find(DomainController, this._domain_id)
				?.unassignSubject(this, false)
		}

		// Assign new domain
		this._domain_id = domain.id
		this._domain = domain

		if (mirror) {
			domain.assignSubject(this, false)
		}
	}

	/**
	 * Assign a parent to this subject
	 * @param parent Target parent
	 * @param mirror Whether to mirror the assignment
	 */

	assignParent(parent: SubjectController, mirror: boolean = true): void {
		if (this._parent_ids.includes(parent.id)) return

		// Assign parent
		this._parent_ids.push(parent.id)
		this._parents?.push(parent)

		if (mirror) {
			parent.assignChild(this, false)

			// Create relation
			this.cache.find(GraphController, this._graph_id)
				?.createSubjectRelation(parent, this, false)
		}
	}

	/**
	 * Assign a child to this subject
	 * @param child Target child
	 * @param mirror Whether to mirror the assignment
	 */

	assignChild(child: SubjectController, mirror: boolean = true): void {
		if (this._child_ids.includes(child.id)) return

		// Assign child
		this._child_ids.push(child.id)
		this._children?.push(child)

		if (mirror) {
			child.assignParent(this, false)

			// Create relation
			this.cache.find(GraphController, this._graph_id)
				?.createSubjectRelation(this, child, false)
		}
	}

	/**
	 * Assign a lecture to this subject
	 * @param lecture Target lecture
	 * @param mirror Whether to mirror the assignment
	 */

	assignLecture(lecture: LectureController, mirror: boolean = true): void {
		if (this._lecture_ids.includes(lecture.id)) return

		// Assign lecture
		this._lecture_ids.push(lecture.id)
		this._lectures?.push(lecture)

		if (mirror) {
			lecture.assignSubject(this, false)
		}
	}

	/**
	 * Unassign a domain from this subject
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignDomain(mirror: boolean = true): void {
		if (!this._domain_id) return

		// Unassign domain
		if (mirror && this._domain_id) {
			this.cache.find(DomainController, this._domain_id)
				?.unassignSubject(this, false)
		}

		this._domain_id = null
		this._domain = null
	}

	/**
	 * Unassign a parent from this subject
	 * @param parent Target parent
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignParent(parent: SubjectController, mirror: boolean = true): void {
		if (!this._parent_ids.includes(parent.id)) return

		// Unassign parent
		this._parent_ids = this._parent_ids.filter(id => id !== parent.id)
		this._parents = this._parents?.filter(known => known.id !== parent.id)

		if (mirror) {
			parent.unassignChild(this, false)

			// Delete relation
			this.cache.find(GraphController, this._graph_id)
				?.deleteSubjectRelation(parent, this, false)
		}
	}

	/**
	 * Unassign a child from this subject
	 * @param child Target child
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignChild(child: SubjectController, mirror: boolean = true): void {
		if (!this._child_ids.includes(child.id)) return

		// Unassign child
		this._child_ids = this._child_ids.filter(id => id !== child.id)
		this._children = this._children?.filter(known => known.id !== child.id)

		if (mirror) {
			child.unassignParent(this, false)

			// Delete relation
			this.cache.find(GraphController, this._graph_id)
				?.deleteSubjectRelation(this, child, false)
		}
	}

	/**
	 * Unassign a lecture from this subject
	 * @param lecture Target lecture
	 * @param mirror Whether to mirror the unassignment
	 */

	unassignLecture(lecture: LectureController, mirror: boolean = true): void {
		if (!this._lecture_ids.includes(lecture.id)) return

		// Unassign lecture
		this._lecture_ids = this._lecture_ids.filter(id => id !== lecture.id)
		this._lectures = this._lectures?.filter(known => known.id !== lecture.id)

		if (mirror) {
			lecture.unassignSubject(this, false)
		}
	}

	// --------------------> Utility

	/**
	 * Check if this subject matches a query
	 * @param query Query to match
	 * @returns Whether the subject matches the query
	 */

	async matchesQuery(query: string): Promise<boolean> {
		const query_lower = query.toLowerCase()
		const name = this.trimmed_name.toLowerCase()
		const domain = await this.getDomain().then(domain => domain?.name.toLowerCase() || '')

		return name.includes(query_lower) || domain.includes(query_lower)
	}
}