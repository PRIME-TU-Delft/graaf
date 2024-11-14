
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
	DropdownOption,
	DomainStyle,
	SerializedDomain
} from '$scripts/types'

// Exports
export { DomainController }


// --------------------> Domain Controller


class DomainController extends NodeController<DomainController> {
	private _style: DomainStyle | null
	private _subject_ids?: number[]
	private _subjects?: SubjectController[]

	private constructor(
		cache: ControllerCache,
		id: number,
		name: string,
		style: DomainStyle | null,
		ordering: number,
		x: number,
		y: number,
		_graph_id?: number,
		_parent_ids?: number[],
		_child_ids?: number[],
		_subject_ids?: number[]
	) {
		super(cache, id, name, ordering, x, y, _graph_id, _parent_ids, _child_ids)

		this._style = style
		this._subject_ids = _subject_ids

		this.cache.add(this)
	}

	// --------------------> Getters & Setters

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

	// Style properties
	get style(): DomainStyle | null {
		return this._style
	}

	set style(value: DomainStyle | null) {
		this._style = value
		this._untouched = false
	}

	get style_options(): DropdownOption<string>[] {
		return Object.keys(settings.NODE_STYLES).map(key => ({
				value: key,
				label: settings.NODE_STYLES[key].display_name,
				validation: Validation.success()
			})
		)
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

	// Untouched state
	get untouched(): boolean {
		return this._untouched
	}

	// --------------------> Assignments

	addParent(parent: DomainController): void {
		if (this._parent_ids === undefined)
			return
		if (this._parent_ids.includes(parent.id))
			throw new Error(`DomainError: Domain with ID ${parent.id} already assigned to domain with ID ${this.id}`)
		this._parent_ids?.push(parent.id)
		this._parents?.push(parent)
		this._untouched = false
	}

	addChild(child: DomainController): void {
		if (this._child_ids === undefined)
			return
		if (this._child_ids.includes(child.id))
			throw new Error(`DomainError: Domain with ID ${child.id} already assigned to domain with ID ${this.id}`)
		this._child_ids?.push(child.id)
		this._children?.push(child)
		this._untouched = false
	}

	addSubject(subject: SubjectController): void {
		if (this._subject_ids === undefined)
			return
		if (this._subject_ids.includes(subject.id))
			throw new Error(`DomainError: Subject with ID ${subject.id} already assigned to domain with ID ${this.id}`)
		this._subject_ids?.push(subject.id)
		this._subjects?.push(subject)
		this._untouched = false
	}

	removeParent(parent: DomainController): void {
		if (this._parent_ids === undefined)
			return
		if (!this._parent_ids.includes(parent.id))
			throw new Error(`DomainError: Domain with ID ${parent.id} not assigned to domain with ID ${this.id}`)
		this._parent_ids = this._parent_ids?.filter(id => id !== parent.id)
		this._parents = this._parents?.filter(p => p.id !== parent.id)
		this._untouched = false
	}

	removeChild(child: DomainController): void {
		if (this._child_ids === undefined)
			return
		if (!this._child_ids.includes(child.id))
			throw new Error(`DomainError: Domain with ID ${child.id} not assigned to domain with ID ${this.id}`)
		this._child_ids = this._child_ids?.filter(id => id !== child.id)
		this._children = this._children?.filter(c => c.id !== child.id)
		this._untouched = false
	}

	removeSubject(subject: SubjectController): void {
		if (this._subject_ids === undefined)
			return
		if (!this._subject_ids.includes(subject.id))
			throw new Error(`DomainError: Subject with ID ${subject.id} not assigned to domain with ID ${this.id}`)
		this._subject_ids = this._subject_ids?.filter(id => id !== subject.id)
		this._subjects = this._subjects?.filter(s => s.id !== subject.id)
		this._untouched = false
	}

	// --------------------> Validation

	validateName(strict: boolean): Validation {
		const validation = new Validation()
		if (!strict && this._untouched) {
			return validation
		}

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
		if (!strict && this._untouched) {
			return validation
		}

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
		if (!strict && this._untouched) {
			return validation
		}

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
			body: JSON.stringify({ graph_id: graph.id })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/domain POST): ${response.status} ${response.statusText}`)
		}

		// Revive the domain
		const data = await response.json()
		if (validSerializedDomain(data)) {
			const domain = DomainController.revive(cache, data)
			domain._untouched = true
			graph.addDomain(domain)
			return domain
		}

		throw new Error(`DomainError: Invalid domain data received from API`)
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
			data.name,
			data.style,
			data.ordering,
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
			&& this.trimmed_name === data.name
			&& this.style === data.style
			&& this.ordering === data.ordering
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
			name: this.trimmed_name,
			style: this.style,
			ordering: this.ordering,
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

	async delete() {

		// Unassign graph, parents, children, and subjects
		if (this._graph_id !== undefined)
			this.graph.removeDomain(this)
		if (this._parent_ids !== undefined)
			for (const parent of this.parents)
				parent.removeChild(this)
		if (this._child_ids !== undefined)
			for (const child of this.children)
				child.removeParent(this)
		if (this._subject_ids !== undefined)
			for (const subject of this.subjects)
				subject.domain = null

		// Call the API to delete the domain
		const response = await fetch(`/api/domain/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw new Error(`APIError (/api/domain/${this.id} DELETE): ${response.status} ${response.statusText}`)
		}

		// Remove domain from cache
		this.cache.remove(this)
	}
}