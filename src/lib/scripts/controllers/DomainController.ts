
// Internal dependencies
import * as settings from '$scripts/settings'
import { compareArrays } from '$scripts/utility'
import { Validation, Severity } from '$scripts/validation'

import {
	ControllerCache,
	GraphController,
	NodeController,
	SubjectController
} from '$scripts/controllers'

import { validSerializedDomain } from '$scripts/types'

import type {
	DomainStyle,
	DropdownOption,
	SerializedDomain
} from '$scripts/types'

// Exports
export { DomainController }


// --------------------> Domain Controller


class DomainController extends NodeController<DomainController> {
	private _order: number
	private _style: DomainStyle | null
	private _subject_ids?: number[]
	private _subjects?: SubjectController[]

	private constructor(
		cache: ControllerCache,
		id: number,
		unchanged: boolean,
		name: string,
		style: DomainStyle | null,
		order: number,
		x: number,
		y: number,
		_graph_id?: number,
		_parent_ids?: number[],
		_child_ids?: number[],
		_subject_ids?: number[]
	) {
		super(cache, id, unchanged, name, x, y, _graph_id, _parent_ids, _child_ids)

		this._order = order
		this._style = style
		this._subject_ids = _subject_ids

		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Order properties
	get order(): number {
		return this._order
	}

	set order(value: number) {
		this._order = value
		this._unsaved = true
	}

	// Parent properties
	get parents(): DomainController[] {
		if (this._parent_ids === undefined)
			throw new Error('DomainError: Parent data unknown')
		if (this._parents !== undefined)
			return Array.from(this._parents)

		// Fetch parents from cache
		this._parents = this._parent_ids.map(id => this.cache.findOrThrow(DomainController, id))
		return Array.from(this._parents)
	}

	// Child properties
	get children(): DomainController[] {
		if (this._child_ids === undefined)
			throw new Error('DomainError: Child data unknown')
		if (this._children !== undefined)
			return Array.from(this._children)

		// Fetch children from cache
		this._children = this._child_ids.map(id => this.cache.findOrThrow(DomainController, id))
		return Array.from(this._children)
	}

	// Subject properties
	get subject_ids(): number[] {
		if (this._subject_ids === undefined)
			throw new Error('DomainError: Subject data unknown')
		return Array.from(this._subject_ids)
	}

	get subjects(): SubjectController[] {
		if (this._subject_ids === undefined)
			throw new Error('DomainError: Subject data unknown')
		if (this._subjects !== undefined)
			return Array.from(this._subjects)

		// Fetch subjects from cache
		this._subjects = this._subject_ids.map(id => this.cache.findOrThrow(SubjectController, id))
		return Array.from(this._subjects)
	}

	get subject_options(): DropdownOption<number>[] {
		return this.graph.subjects.map(subject => ({
				value: subject.id,
				label: subject.trimmed_name,
				validation: Validation.success()
			})
		)
	}

	// Style properties
	get style(): DomainStyle | null {
		return this._style
	}

	set style(value: DomainStyle | null) {
		this._style = value
		this._unchanged = false
		this._unsaved = true
	}

	get style_options(): DropdownOption<string>[] {
		return Object.keys(settings.NODE_STYLES).map(key => ({
				value: key,
				label: settings.NODE_STYLES[key].display_name,
				validation: Validation.success()
			})
		)
	}

	// --------------------> Assignments

	assignParent(parent: DomainController, mirror: boolean = true): void {
		if (this._parent_ids !== undefined) {
			if (this._parent_ids.includes(parent.id))
				throw new Error(`DomainError: Parent with ID ${parent.id} already assigned to domain with ID ${this.id}`)
			this._parent_ids.push(parent.id)
			this._parents?.push(parent)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			parent.assignChild(this, false)
		}
	}

	assignChild(child: DomainController, mirror: boolean = true): void {
		if (this._child_ids !== undefined) {
			if (this._child_ids.includes(child.id))
				throw new Error(`DomainError: Child with ID ${child.id} already assigned to domain with ID ${this.id}`)
			this._child_ids.push(child.id)
			this._children?.push(child)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			child.assignParent(this, false)
		}
	}

	assignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids !== undefined) {
			if (this._subject_ids.includes(subject.id))
				throw new Error(`DomainError: Subject with ID ${subject.id} already assigned to domain with ID ${this.id}`)
			this._subject_ids.push(subject.id)
			this._subjects?.push(subject)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			subject.assignDomain(this, false)
		}
	}

	unassignParent(parent: DomainController, mirror: boolean = true): void {
		if (this._parent_ids !== undefined) {
			if (!this._parent_ids.includes(parent.id))
				throw new Error(`DomainError: Parent with ID ${parent.id} not assigned to domain with ID ${this.id}`)
			this._parent_ids = this._parent_ids.filter(id => id !== parent.id)
			this._parents = this._parents?.filter(p => p.id !== parent.id)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			parent.unassignChild(this, false)
		}
	}

	unassignChild(child: DomainController, mirror: boolean = true): void {
		if (this._child_ids !== undefined) {
			if (!this._child_ids.includes(child.id))
				throw new Error(`DomainError: Child with ID ${child.id} not assigned to domain with ID ${this.id}`)
			this._child_ids = this._child_ids.filter(id => id !== child.id)
			this._children = this._children?.filter(c => c.id !== child.id)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			child.unassignParent(this, false)
		}
	}

	unassignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids !== undefined) {
			if (!this._subject_ids.includes(subject.id))
				throw new Error(`DomainError: Subject with ID ${subject.id} not assigned to domain with ID ${this.id}`)
			this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
			this._subjects = this._subjects?.filter(s => s.id !== subject.id)
			this._unchanged = false
			this._unsaved = true
		}

		if (mirror) {
			subject.unassignDomain(this, false)
		}
	}

	// --------------------> Validation

	validateName(strict: boolean): Validation {
		const validation = new Validation()
		if (!strict && this._unchanged) return validation

		if (this.trimmed_name === '') {
			validation.add({
				severity: Severity.error,
				short: 'Domain has no name',
				url: `/app/graph/${this.graph_id}/settings?tab=domains`,
				uuid: this.uuid
			})
		} else if (this.trimmed_name.length > settings.MAX_NODE_NAME_LENGTH) {
			validation.add({
				severity: Severity.error,
				short: 'Domain name is too long',
				long: `Domain name cannot exceed ${settings.MAX_NODE_NAME_LENGTH} characters`,
				url: `/app/graph/${this.graph_id}/settings?tab=domains`,
				uuid: this.uuid
			})
		} else if (this.cache.all(DomainController)
				.some(domain => domain.id !== this.id && domain.trimmed_name === this.trimmed_name)
			) {
			validation.add({
				severity: Severity.warning,
				short: 'Domain name is not unique',
				url: `/app/graph/${this.graph_id}/settings?tab=domains`,
				uuid: this.uuid
			})
		}

		return validation
	}

	validateStyle(strict: boolean): Validation {
		const validation = new Validation()
		if (!strict && this._unchanged) return validation

		if (this.style === null) {
			validation.add({
				severity: Severity.error,
				short: 'Domain has no style',
				url: `/app/graph/${this.graph_id}/settings?tab=domains`,
				uuid: this.uuid
			})
		} else if (this.cache.all(DomainController)
				.some(domain => domain.id !== this.id && domain.style === this.style)
			) {
			validation.add({
				severity: Severity.warning,
				short: 'Domain style is not unique',
				url: `/app/graph/${this.graph_id}/settings?tab=domains`,
				uuid: this.uuid
			})
		}

		return validation
	}

	validateSubjects(strict: boolean): Validation {
		const validation = new Validation()
		if (!strict && this._unchanged) return validation

		if (this.subject_ids.length === 0) {
			validation.add({
				severity: Severity.warning,
				short: 'Domain has no subjects',
				url: `/app/graph/${this.graph_id}/settings?tab=domains`,
				uuid: this.uuid
			})
		}

		return validation
	}

	validate(strict: boolean = true): Validation {
		const validation = new Validation()

		validation.add(this.validateName(strict))
		validation.add(this.validateStyle(strict))
		validation.add(this.validateSubjects(strict))

		return validation
	}

	// --------------------> Actions

	static async create(cache: ControllerCache, graph: GraphController): Promise<DomainController> {

		// Call the API to create a new domain
		const response = await fetch('/api/domain', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ graph_id: graph.id, order: graph.domain_ids.length })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/domain POST): ${response.status} ${response.statusText}`)
		}

		// Revive the domain
		const data = await response.json()
		if (!validSerializedDomain(data)) {
			throw new Error(`DomainError: Invalid domain data received from API`)
		}

		const domain = DomainController.revive(cache, data)
		graph.assignDomain(domain)
		return domain
	}

	static revive(cache: ControllerCache, data: SerializedDomain): DomainController {
		const domain = cache.find(DomainController, data.id)
		if (domain !== undefined) {

			// Throw error if domain data is inconsistent
			if (!domain.represents(data)) {
				throw new Error(`DomainError: Domain with ID ${data.id} already exists, and is inconsistent with new data`)
			}

			// Update domain where necessary
			if (domain._graph_id === undefined)
				domain._graph_id = data.graph_id
			if (domain._parent_ids === undefined)
				domain._parent_ids = data.parent_ids
			if (domain._child_ids === undefined)
				domain._child_ids = data.child_ids
			if (domain._subject_ids === undefined)
				domain._subject_ids = data.subject_ids

			return domain
		}

		return new DomainController(
			cache,
			data.id,
			data.unchanged,
			data.name,
			data.style,
			data.order,
			data.x,
			data.y,
			data.graph_id,
			data.parent_ids,
			data.child_ids,
			data.subject_ids
		)
	}

	represents(data: SerializedDomain): boolean {
		return this.id === data.id
			&& this.unchanged === data.unchanged
			&& this.trimmed_name === data.name
			&& this.style === data.style
			&& this.order === data.order
			&& this.x === data.x
			&& this.y === data.y
			&& (this._graph_id === undefined    || data.graph_id === undefined    || this._graph_id === data.graph_id)
			&& (this._parent_ids === undefined  || data.parent_ids === undefined  || compareArrays(this._parent_ids, data.parent_ids))
			&& (this._child_ids === undefined   || data.child_ids === undefined   || compareArrays(this._child_ids, data.child_ids))
			&& (this._subject_ids === undefined || data.subject_ids === undefined || compareArrays(this._subject_ids, data.subject_ids))
	}

	reduce(): SerializedDomain {
		return {
			id: this.id,
			unchanged: this.unchanged,
			name: this.trimmed_name,
			style: this.style,
			order: this.order,
			x: this.x,
			y: this.y,
			graph_id: this._graph_id,
			parent_ids: this._parent_ids,
			child_ids: this._child_ids,
			subject_ids: this._subject_ids
		}
	}

	async save() {

		// Call the API to save the domain
		const response = await fetch('/api/domain', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/domain PUT): ${response.status} ${response.statusText}`)
		}
	}

	async delete(reorder_graph: boolean = true) {

		// Unassign graph, parents, children, and subjects
		if (this._graph_id !== undefined)
			this.graph.unassignDomain(this)
		if (this._parent_ids !== undefined)
			for (const parent of this.parents)
				parent.unassignChild(this, false)
		if (this._child_ids !== undefined)
			for (const child of this.children)
				child.unassignParent(this, false)
		if (this._subject_ids !== undefined)
			for (const subject of this.subjects)
				subject.unassignDomain(this, false)

		// Fix order of remaining domains
		if (reorder_graph) {
			await this.graph.reorder()
		}

		// Call the API to delete the domain
		const response = await fetch(`/api/domain/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/domain/${this.id} DELETE): ${response.status} ${response.statusText}`)
		}

		// Remove the course from the cache
		this.cache.remove(this)
	}

	async copy(graph: GraphController): Promise<DomainController> {
		const domain_copy = await DomainController.create(this.cache, graph)
		domain_copy.name = this.trimmed_name
		domain_copy.style = this.style
		domain_copy.order = this.order
		domain_copy.x = this.x
		domain_copy.y = this.y

		return domain_copy
	}

	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_name = this.trimmed_name.toLowerCase()
		const lower_style = this.style ? settings.NODE_STYLES[this.style].display_name.toLowerCase() : ''

		return lower_name.includes(lower_query) || lower_style.includes(lower_query)
	}
}