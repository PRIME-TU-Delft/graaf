
// Internal dependencies
import * as settings from '$scripts/settings'

import { compareArrays, customError, debounce } from '$scripts/utility'
import { Validation, Severity } from '$scripts/validation'

import {
	ControllerCache,
	GraphController,
	NodeController,
	SubjectController
} from '$scripts/controllers'

import { validSerializedDomain } from '$scripts/types'
import type SaveStatus from '$components/SaveStatus.svelte'

import type {
	DomainStyle,
	DropdownOption,
	SerializedDomain
} from '$scripts/types'

// Exports
export { DomainController }


// --------------------> Domain Controller


class DomainController extends NodeController<DomainController> {
	private _style_unchanged: boolean = false
	private _subjects?: SubjectController[]

	public save = debounce(this._save, settings.DEBOUNCE_DELAY)

	private constructor(
		cache: ControllerCache,
		id: number,
		name: string,
		private _style: DomainStyle | null,
		public order: number,
		x: number,
		y: number,
		_graph_id?: number,
		_parent_ids?: number[],
		_child_ids?: number[],
		private _subject_ids?: number[]
	) {
		super(cache, id, name, x, y, _graph_id, _parent_ids, _child_ids)
		this.cache.add(this)
	}

	// --------------------> Getters & Setters

	// Name property
	get display_name(): string {
		return this.trimmed_name === '' ? 'Untitled domain' : this.trimmed_name
	}

	// Is empty property
	get is_empty(): boolean {
		return this.trimmed_name === ''
			&& this.style === null
			&& this.subject_ids.length === 0
			&& this.parents.length === 0
			&& this.children.length === 0
	}

	// Parent properties
	get parents(): DomainController[] {
		if (this._parent_ids === undefined)
			throw customError('DomainError', 'Parent data unknown')
		if (this._parents !== undefined)
			return Array.from(this._parents)

		// Fetch parents from cache
		this._parents = this._parent_ids.map(id => this.cache.findOrThrow(DomainController, id))
		return Array.from(this._parents)
	}

	// Child properties
	get children(): DomainController[] {
		if (this._child_ids === undefined)
			throw customError('DomainError', 'Child data unknown')
		if (this._children !== undefined)
			return Array.from(this._children)

		// Fetch children from cache
		this._children = this._child_ids.map(id => this.cache.findOrThrow(DomainController, id))
		return Array.from(this._children)
	}

	// Subject properties
	get subject_ids(): number[] {
		if (this._subject_ids === undefined)
			throw customError('DomainError', 'Subject data unknown')
		return Array.from(this._subject_ids)
	}

	get subjects(): SubjectController[] {
		if (this._subject_ids === undefined)
			throw customError('DomainError', 'Subject data unknown')
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
		this._style_unchanged = false
	}

	get style_options(): DropdownOption<DomainStyle>[] {
		const used_styles = this.graph.domains
			.filter(domain => domain.id !== this.id && domain.style !== null)
			.map(domain => domain.style as DomainStyle)

		const options: DropdownOption<DomainStyle>[] = []
		for (const style of Object.keys(settings.NODE_STYLES) as DomainStyle[]) {
			const validation = used_styles.includes(style)
							 ? Validation.warning('Duplicate style')
							 : Validation.success()

			options.push({
				value: style,
				label: settings.NODE_STYLES[style].display_name,
				validation,
				color: settings.NODE_STYLES[style].stroke
			})
		}

		return options
	}

	// --------------------> Assignments

	assignParent(parent: DomainController, mirror: boolean = true): void {
		if (this._parent_ids !== undefined) {
			if (this._parent_ids.includes(parent.id))
				throw customError('DomainError', `Parent with ID ${parent.id} already assigned to domain with ID ${this.id}`)
			this._parent_ids.push(parent.id)
			this._parents?.push(parent)
		}

		if (mirror) {
			parent.assignChild(this, false)
		}
	}

	assignChild(child: DomainController, mirror: boolean = true): void {
		if (this._child_ids !== undefined) {
			if (this._child_ids.includes(child.id))
				throw customError('DomainError', `Child with ID ${child.id} already assigned to domain with ID ${this.id}`)
			this._child_ids.push(child.id)
			this._children?.push(child)
		}

		if (mirror) {
			child.assignParent(this, false)
		}
	}

	assignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids !== undefined) {
			if (this._subject_ids.includes(subject.id))
				throw customError('DomainError', `Subject with ID ${subject.id} already assigned to domain with ID ${this.id}`)
			this._subject_ids.push(subject.id)
			this._subjects?.push(subject)
		}

		if (mirror) {
			subject.assignDomain(this, false)
		}
	}

	unassignParent(parent: DomainController, mirror: boolean = true): void {
		if (this._parent_ids !== undefined) {
			if (!this._parent_ids.includes(parent.id))
				throw customError('DomainError', `Parent with ID ${parent.id} not assigned to domain with ID ${this.id}`)
			this._parent_ids = this._parent_ids.filter(id => id !== parent.id)
			this._parents = this._parents?.filter(p => p.id !== parent.id)
		}

		if (mirror) {
			parent.unassignChild(this, false)
		}
	}

	unassignChild(child: DomainController, mirror: boolean = true): void {
		if (this._child_ids !== undefined) {
			if (!this._child_ids.includes(child.id))
				throw customError('DomainError', `Child with ID ${child.id} not assigned to domain with ID ${this.id}`)
			this._child_ids = this._child_ids.filter(id => id !== child.id)
			this._children = this._children?.filter(c => c.id !== child.id)
		}

		if (mirror) {
			child.unassignParent(this, false)
		}
	}

	unassignSubject(subject: SubjectController, mirror: boolean = true): void {
		if (this._subject_ids !== undefined) {
			if (!this._subject_ids.includes(subject.id))
				throw customError('DomainError', `Subject with ID ${subject.id} not assigned to domain with ID ${this.id}`)
			this._subject_ids = this._subject_ids.filter(id => id !== subject.id)
			this._subjects = this._subjects?.filter(s => s.id !== subject.id)
		}

		if (mirror) {
			subject.unassignDomain(this, false)
		}
	}

	// --------------------> Validation

	validateName(strict: boolean): Validation {
		const validation = new Validation()
		if (!strict && this._name_unchanged) return validation

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
		if (!strict && this._style_unchanged) return validation
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

	validateSubjects(): Validation {
		const validation = new Validation()

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
		validation.add(this.validateSubjects())

		return validation
	}

	// --------------------> Actions

	static async create(cache: ControllerCache, graph: GraphController, save_status?: SaveStatus): Promise<DomainController> {
		save_status?.setSaving(true)

		// Call the API to create a new domain
		const response = await fetch('/api/domain', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ graph_id: graph.id })
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/domain POST)', await response.text())
		}

		// Revive the domain
		const data = await response.json()
		if (!validSerializedDomain(data)) {
			throw customError('DomainError', `Invalid domain data received from API`)
		}

		const domain = DomainController.revive(cache, data)
		domain._name_unchanged = true
		domain._style_unchanged = true
		graph.assignDomain(domain)
		save_status?.setSaving(false)

		return domain
	}

	static revive(cache: ControllerCache, data: SerializedDomain): DomainController {
		const domain = cache.find(DomainController, data.id)
		if (domain !== undefined) {

			// Throw error if domain data is inconsistent
			if (!domain.represents(data)) {
				throw customError('DomainError', `Domain with ID ${data.id} already exists, and is inconsistent with new data`)
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

	private async _save(save_status?: SaveStatus) {
		save_status?.setSaving(true)

		// Call the API to save the domain
		const response = await fetch('/api/domain', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(this.reduce())
		})

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/domain PUT)', await response.text())
		}

		save_status?.setSaving(false)
	}

	async delete(reorder_graph: boolean = true, save_status?: SaveStatus): Promise<void> {
		save_status?.setSaving(true)

		// Unassign graph, parents, children, and subjects
		if (this._graph_id !== undefined)
			this.graph.unassignDomain(this)
		if (this._subject_ids !== undefined)
			for (const subject of this.subjects)
				subject.unassignDomain(this, false)
		for (const relation of this.graph.domain_relations) {
			if (relation.parent === this)
				relation.parent = null
			else if (relation.child === this)
				relation.child = null
		}

		// Fix order of remaining domains
		if (reorder_graph) {
			await this.graph.reorderDomains()
		}

		// Call the API to delete the domain
		const response = await fetch(`/api/domain/${this.id}`, { method: 'DELETE' })

		// Throw an error if the API request fails
		if (!response.ok) {
			throw customError('APIError (/api/domain/${this.id} DELETE)', await response.text())
		}

		// Remove the course from the cache
		this.cache.remove(this)
		save_status?.setSaving(false)
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