
// Internal dependencies
import {
	ControllerEnvironment,
	GraphController,
	LectureController
} from '$scripts/controllers'

import { styles } from '$scripts/settings'
import * as settings from '$scripts/settings'
import { ValidationData, Severity } from '$scripts/validation'

import type { SerializedDomain, SerializedSubject } from '$scripts/types'

// External dependencies
import * as uuid from 'uuid'

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
		public environment: ControllerEnvironment,
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

	get graph(): Promise<GraphController> {
		return (async () => {
			if (this._graph) return this._graph
			this._graph = await this.environment.getGraph(this._graph_id) as GraphController
			return this._graph
		})()
	}

	/**
	 * Check if the field has a name
	 * @returns `boolean` Whether the field has a name
	 */

	protected hasName(): boolean {
		return this.name.trim() !== ''
	}

	/**
	 * Check if the field name is too long
	 * @returns `boolean` Whether the field name is too long
	 */

	protected hasLongName(): boolean{
		return this.name.length > settings.FIELD_MAX_CHARS
	}

	abstract get parents(): Promise<T[]>
	abstract get children(): Promise<T[]>
	abstract get style(): Promise<string | null>
	abstract get color(): Promise<string>

	abstract assignParent(parent: T, mirror: boolean): void
	abstract assignChild(child: T, mirror: boolean): void
	abstract unassignParent(parent: T, mirror: boolean): void
	abstract unassignChild(child: T, mirror: boolean): void
}

class DomainController extends FieldController<DomainController> {
	private _subjects?: SubjectController[]

	constructor(
		environment: ControllerEnvironment,
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
		super(environment, id, x, y, name, _graph_id, _parent_ids, _child_ids)
		this.environment.remember(this)
	}

	get parents(): Promise<DomainController[]> {
		return (async () => {
			if (this._parents) return this._parents
			this._parents = await this.environment.getDomains(this._parent_ids)
			return this._parents
		})()
	}

	get children(): Promise<DomainController[]> {
		return (async () => {
			if (this._children) return this._children
			this._children = await this.environment.getDomains(this._child_ids)
			return this._children
		})()
	}
	
	get subjects(): Promise<SubjectController[]> {
		return (async () => {
			if (this._subjects) return this._subjects
			this._subjects = await this.environment.getSubjects(this._subject_ids)
			return this._subjects
		})()
	}

	get index(): Promise<number> {
		return this.graph.then(graph => graph.domainIndex(this))
	}

	get style(): Promise<string | null> {
		return Promise.resolve(
			this._style
		)
	}

	get color(): Promise<string> {
		return (async () => {
			const style = await this.style
			return style ? styles[style].fill : 'transparent'
		})()
	}

	/**
	 * Create a new domain
	 * @param environment Environment to create the domain in
	 * @param graph Graph to assign the domain to
	 * @returns `Promise<DomainController>` The newly created DomainController
	 * @throws `APIError` if the API call fails
	 */

	static async create(environment: ControllerEnvironment, graph: GraphController): Promise<DomainController> {

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
		graph.assignDomain(domain)

		return domain
	}

	/**
	 * Revive a domain from serialized data
	 * @param environment Environment to revive the domain in
	 * @param data Serialized data to revive
	 * @returns `DomainController` The revived Domain
	 */

	static revive(environment: ControllerEnvironment, data: SerializedDomain): DomainController {
		return new DomainController(environment, data.id, data.x, data.y, data.name, data.style, data.graph, data.parents, data.children, data.subjects)
	}

	/**
	 * Validate the domain
	 * @returns `Promise<ValidationData>` Validation data
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

			if (this.hasLongName()) {
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

			const original = await this.findOriginalStyle()
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


	/**
	 * Serialize the domain
	 * @returns `Promise<SerializedDomain>` Serialized domain
	 */

	async reduce(): Promise<SerializedDomain> {
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			name: this.name,
			style: await this.style,
			graph: this._graph_id,
			parents: this._parent_ids,
			children: this._child_ids,
			subjects: this._subject_ids
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
			body: JSON.stringify(this.reduce())
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
		await fetch(`/api/domain`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: this.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/domain DELETE): ${error}`)
		})

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		const graph = await this.environment.getGraph(this._graph_id, false)
		graph?.unassignDomain(this)

		const parents = await this.environment.getDomains(this._parent_ids, false)
		parents.forEach(parent => parent.unassignChild(this, false))

		const children = await this.environment.getDomains(this._child_ids, false)
		children.forEach(child => child.unassignParent(this, false))

		const subjects = await this.environment.getSubjects(this._subject_ids, false)
		subjects.forEach(subject => subject.unassignFromDomain(this, false))

		// Remove from environment
		this.environment.forget(this)
	}

	/**
	 * Find the first occurrence of the domain's name in the graph
	 * @returns `Promise<number>` Index of the original name in the graph, or -1 if the name is unique/nonexistant
	 */

	private async findOriginalName(): Promise<number> {
		const domains = await this.graph.then(graph => graph.domains)
		const first = domains.findIndex(item => item.name === this.name)	
		const second = domains.indexOf(this, first + 1)

		return first < second ? domains[first].index : -1
	}

	/**
	 * Find the first occurrence of the domain's style in the graph
	 * @returns `Promise<number>` Index of the original style in the graph, or -1 if the style is unique/nonexistant
	 */

	private async findOriginalStyle(): Promise<number> {
		const domains = await this.graph.then(graph => graph.domains)
		const first = domains.findIndex(async item => await item.style === await this.style)
		const second = domains.indexOf(this, first + 1)

		return first < second ? domains[first].index : -1
	}

	/**
	 * Check if the domain has a style
	 * @returns `boolean` Whether the domain has a style
	 */

	private hasStyle(): boolean {
		return this.style !== null
	}

	/**
	 * Check if the domain has subjects
	 * @returns `boolean` Whether the domain has parents
	 */

	private hasSubjects(): boolean {
		return this._subject_ids.length > 0
	}

	/**
	 * Assign a parent domain to the domain
	 * @param parent Domain to assign as a parent
	 * @param mirror Whether to mirror the assignment
	 * @throws `DomainError` if the domain is already assigned as a parent
	 */

	assignParent(parent: DomainController, mirror: boolean = true): void {
		if (this._parent_ids.includes(parent.id))
			throw new Error(`DomainError: Domain is already assigned as a parent of Domain with ID ${parent.id}`)
		this._parent_ids.push(parent.id)
		this._parents?.push(parent)

		if (mirror) {
			parent.assignChild(this, false)
		}
	}

	/**
	 * Assign a child domain to the domain
	 * @param child Domain to assign as a child
	 * @param mirror Whether to mirror the assignment
	 * @throws `DomainError` if the domain is already assigned as a child
	 */

	assignChild(child: DomainController, mirror: boolean = true): void {
		if (this._child_ids.includes(child.id))
			throw new Error(`DomainError: Domain is already assigned as a child of Domain with ID ${child.id}`)
		this._child_ids.push(child.id)
		this._children?.push(child)

		if (mirror) {
			child.assignParent(this, false)
		}
	}

	/**
	 * Assign a subject to the domain
	 * @param subject Subject to assign to the domain
	 * @param mirror Whether to mirror the assignment
	 * @throws `DomainError` if the subject is already assigned to the domain
	 */

	assignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids.includes(subject.id))
			throw new Error(`DomainError: Domain is already assigned to Subject with ID ${subject.id}`)
		this._subject_ids.push(subject.id)
		this._subjects?.push(subject)

		if (mirror) {
			subject.assignToDomain(this, false)
		}
	}

	/**
	 * Unassign a parent domain from the domain
	 * @param parent Domain to unassign as a parent
	 * @param mirror Whether to mirror the unassignment
	 * @throws `DomainError` if the domain is not assigned as a parent
	 */

	unassignParent(parent: DomainController, mirror: boolean = true): void {
		if (!this._parent_ids.includes(parent.id))
			throw new Error(`DomainError: Domain is not assigned as a parent of Domain with ID ${parent.id}`)
		this._parent_ids = this._parent_ids.filter(id => id !== parent.id)
		this._parents = this._parents?.filter(parent => parent.id !== parent.id)

		if (mirror) {
			parent.unassignChild(this, false)
		}
	}

	/**
	 * Unassign a child domain from the domain
	 * @param child Domain to unassign as a child
	 * @param mirror Whether to mirror the unassignment
	 * @throws `DomainError` if the domain is not assigned as a child
	 */

	unassignChild(child: DomainController, mirror: boolean = true): void {
		if (!this._child_ids.includes(child.id))
			throw new Error(`DomainError: Domain is not assigned as a child of Domain with ID ${child.id}`)
		this._child_ids = this._child_ids.filter(id => id !== child.id)
		this._children = this._children?.filter(child => child.id !== child.id)

		if (mirror) {
			child.unassignParent(this, false)
		}
	}

	/**
	 * Unassign a subject from the domain
	 * @param subject Subject to unassign from the domain
	 * @param mirror Whether to mirror the unassignment
	 * @throws `DomainError` if the subject is not assigned to the domain
	 */

	unassignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (!this._subject_ids.includes(subject.id))
			throw new Error(`DomainError: Domain is not assigned to Subject with ID ${subject.id}`)
		this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(subject => subject.id !== subject.id)

		if (mirror) {
			subject.unassignFromDomain(this, false)
		}
	}
}

class SubjectController extends FieldController<SubjectController> {
	private _domain?: DomainController | null
	private _lectures?: LectureController[]

	constructor(
		environment: ControllerEnvironment,
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
		this.environment.remember(this)
	}

	get domain(): Promise<DomainController | null> {
		return (async () => {
			if (this._domain !== undefined)
				return this._domain
			if (this._domain_id == null)
				return this._domain = null

			this._domain = await this.environment.getDomain(this._domain_id) as DomainController
			return this._domain
		})()
	}

	get parents(): Promise<SubjectController[]> {
		return (async () => {
			if (this._parents) return this._parents
			this._parents = await this.environment.getSubjects(this._parent_ids)
			return this._parents
		})()
	}

	get children(): Promise<SubjectController[]> {
		return (async () => {
			if (this._children) return this._children
			this._children = await this.environment.getSubjects(this._child_ids)
			return this._children
		})()
	}

	get lectures(): Promise<LectureController[]> {
		return (async () => {
			if (this._lectures) return this._lectures
			this._lectures = await this.environment.getLectures(this._lecture_ids)
			return this._lectures
		})()
	}

	get graph(): Promise<GraphController> {
		return (async () => {
			if (this._graph) return this._graph
			this._graph = await this.environment.getGraph(this._graph_id) as GraphController
			return this._graph
		})()
	}

	get index(): Promise<number> {
		return this.graph.then(graph => graph.subjectIndex(this))
	}

	get style(): Promise<string | null> {
		return (async () => {
			const domain = await this.domain
			return domain?.style ?? null
		})()
	}

	get color(): Promise<string> {
		return (async () => {
			const domain = await this.domain
			return domain?.color ?? 'transparent'
		})()
	}

	/**
	 * Create a new subject
	 * @param environment Environment to create the subject in
	 * @param graph Graph to assign the subject to
	 * @returns `Promise<SubjectController>` The newly created SubjectController
	 * @throws `APIError` if the API call fails
	 */

	static async create(environment: ControllerEnvironment, graph: GraphController): Promise<SubjectController> {

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
		const subject = SubjectController.revive(environment, data)
		graph.assignSubject(subject)

		return subject
	}

	static revive(environment: ControllerEnvironment, data: SerializedSubject): SubjectController {
		return new SubjectController(environment, data.id, data.x, data.y, data.name, data.domain, data.graph, data.parents, data.children, data.lectures)
	}

	/**
	 * Validate the subject
	 * @returns `Promise<ValidationData>` Validation data
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

			if (this.hasLongName()) {
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

	/**
	 * Serialize the subject
	 * @returns `SerializedSubject` Serialized subject
	 */

	reduce(): SerializedSubject {
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			name: this.name,
			domain: this._domain_id,
			graph: this._graph_id,
			parents: this._parent_ids,
			children: this._child_ids,
			lectures: this._lecture_ids
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
		await fetch(`/api/subject`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: this.id })
		})

		// Check the response
		.catch(error => {
			throw new Error(`APIError (/api/subject DELETE): ${error}`)
		})

		// Unassign everywhere (mirroring is not necessary, as this object will be deleted)
		const graph = await this.environment.getGraph(this._graph_id, false)
		graph?.unassignSubject(this)

		if (this._domain_id !== null) {
			const domain = await this.environment.getDomain(this._domain_id, false)
			domain?.unassignSubject(this, false)
		}

		const parents = await this.environment.getSubjects(this._parent_ids, false)
		parents.forEach(parent => parent.unassignChild(this, false))

		const children = await this.environment.getSubjects(this._child_ids, false)
		children.forEach(child => child.unassignParent(this, false))

		const lectures = await this.environment.getLectures(this._lecture_ids, false)
		lectures.forEach(lecture => lecture.unassignSubject(this, false))

		// Remove from environment
		this.environment.forget(this)
	}

	/**
	 * Find the first occurrence of the subject's name in the graph
	 * @returns `Promise<number>` Index of the original name in the graph, or -1 if the name is unique/nonexistant
	 */

	private async findOriginalName(): Promise<number> {
		const subjects = await this.graph.then(graph => graph.subjects)
		const first = subjects.findIndex(item => item.name === this.name)
		const second = subjects.indexOf(this, first + 1)

		return first < second ? subjects[first].index : -1
	}

	/**
	 * Check if the subject has a domain
	 * @returns `boolean` Whether the subject has a domain
	 */

	private hasDomain(): boolean {
		return this._domain_id !== null
	}

	/**
	 * Assign a parent subject to the subject
	 * @param parent Subject to assign as a parent
	 * @param mirror Whether to mirror the assignment
	 * @throws `SubjectError` if the subject is already assigned as a parent
	 */

	assignParent(parent: SubjectController, mirror: boolean = true): void {
		if (this._parent_ids.includes(parent.id))
			throw new Error(`SubjectError: Subject is already assigned as a parent of Subject with ID ${parent.id}`)
		this._parent_ids.push(parent.id)
		this._parents?.push(parent)

		if (mirror) {
			parent.assignChild(this, false)
		}
	}

	/**
	 * Assign a child subject to the subject
	 * @param child Subject to assign as a child
	 * @param mirror Whether to mirror the assignment
	 * @throws `SubjectError` if the subject is already assigned as a child
	 */

	assignChild(child: SubjectController, mirror: boolean = true): void {
		if (this._child_ids.includes(child.id))
			throw new Error(`SubjectError: Subject is already assigned as a child of Subject with ID ${child.id}`)
		this._child_ids.push(child.id)
		this._children?.push(child)

		if (mirror) {
			child.assignParent(this, false)
		}
	}

	/**
	 * Assign a domain to the subject
	 * @param domain Domain to assign to the subject
	 * @param mirror Whether to mirror the assignment
	 * @throws `SubjectError` if the subject is already assigned to a domain
	 */

	assignToDomain(domain: DomainController, mirror: boolean = true): void {
		if (this._domain_id !== null)
			throw new Error(`SubjectError: Subject is already assigned to Domain with ID ${this._domain_id}`)
		this._domain_id = domain.id
		this._domain = domain

		if (mirror) {
			domain.assignSubject(this, false)
		}
	}

	/**
	 * Assign the subject to a lecture
	 * @param lecture Lecture to assign the subject to
	 * @param mirror Whether to mirror the assignment
	 * @throws `SubjectError` if the subject is already assigned to the lecture
	 */

	assignToLecture(lecture: LectureController, mirror: boolean = true): void {
		if (this._lecture_ids.includes(lecture.id))
			throw new Error(`SubjectError: Subject is already assigned to Lecture with ID ${lecture.id}`)
		this._lecture_ids.push(lecture.id)
		this._lectures?.push(lecture)

		if (mirror) {
			lecture.assignSubject(this, false)
		}
	}

	/**
	 * Unassign a parent subject from the subject
	 * @param parent Subject to unassign as a parent
	 * @param mirror Whether to mirror the unassignment
	 * @throws `SubjectError` if the subject is not assigned as a parent
	 */

	unassignParent(parent: SubjectController, mirror: boolean = true): void {
		if (!this._parent_ids.includes(parent.id))
			throw new Error(`SubjectError: Subject is not assigned as a parent of Subject with ID ${parent.id}`)
		this._parent_ids = this._parent_ids.filter(id => id !== parent.id)
		this._parents = this._parents?.filter(parent => parent.id !== parent.id)

		if (mirror) {
			parent.unassignChild(this, false)
		}
	}

	/**
	 * Unassign a child subject from the subject
	 * @param child Subject to unassign as a child
	 * @param mirror Whether to mirror the unassignment
	 * @throws `SubjectError` if the subject is not assigned as a child
	 */

	unassignChild(child: SubjectController, mirror: boolean = true): void {
		if (!this._child_ids.includes(child.id))
			throw new Error(`SubjectError: Subject is not assigned as a child of Subject with ID ${child.id}`)
		this._child_ids = this._child_ids.filter(id => id !== child.id)
		this._children = this._children?.filter(child => child.id !== child.id)

		if (mirror) {
			child.unassignParent(this, false)
		}
	}

	/**
	 * Unassign the subject from a domain
	 * @param domain Domain to unassign the subject from
	 * @param mirror Whether to mirror the unassignment
	 * @throws `SubjectError` if the subject is not assigned to the domain
	 */

	unassignFromDomain(domain: DomainController, mirror: boolean = true): void {
		if (this._domain_id !== domain.id)
			throw new Error(`SubjectError: Subject is not assigned to Domain with ID ${domain.id}`)
		this._domain_id = null
		this._domain = null

		if (mirror) {
			domain.unassignSubject(this, false)
		}
	}

	/**
	 * Unassign the subject from a lecture
	 * @param lecture Lecture to unassign the subject from
	 * @param mirror Whether to mirror the unassignment
	 * @throws `SubjectError` if the subject is not assigned to the lecture
	 */

	unassignFromLecture(lecture: LectureController, mirror: boolean = true): void {
		if (!this._lecture_ids.includes(lecture.id))
			throw new Error(`SubjectError: Subject is not assigned to Lecture with ID ${lecture.id}`)
		this._lecture_ids = this._lecture_ids.filter(id => id !== lecture.id)
		this._lectures = this._lectures?.filter(lecture => lecture.id !== lecture.id)

		if (mirror) {
			lecture.unassignSubject(this, false)
		}
	}
}