
// External dependencies
import * as uuid from 'uuid'

// Internal dependencies
import { ValidationData, Severity } from '$scripts/validation'

import {
	GraphController,
	DomainController,
	SubjectController,
	FieldController
} from '$scripts/controllers'
import type { DropdownOption } from '$scripts/types'

// Exports
export {
	RelationController,
	DomainRelationController,
	SubjectRelationController
}


// --------------------> Controllers


abstract class RelationController<T extends FieldController> {
	protected _parent: T | null = null
	protected _child: T | null = null

	uuid: string
	index: number = 0

	protected constructor(
		public graph: GraphController,
		parent: T | null = null,
		child: T | null = null
	) {
		this.uuid = uuid.v4()
		this.parent = parent
		this.child = child
	}

	// --------------------> Getters & Setters

	get parent(): T | null {
		return this._parent
	}

	set parent(parent: T | null) {
		if (this.parent === parent) return

		// Update parent and child references
		if (this.child) {
			if (this.parent)
				this.child.unassignParent(this.parent)
			if (parent) {
				this.child.assignParent(parent)
			}
		}

		this._parent = parent
	}

	get child(): T | null {
		return this._child
	}

	set child(child: T | null) {
		if (this.child === child) return

		// Update parent and child references
		if (this.parent) {
			if (this.child)
				this.parent.unassignChild(this.child)
			if (child) {
				this.parent.assignChild(child)
			}
		}

		this._child = child
	}

	// --------------------> API Getters

	/**
	 * Get the color of the parent field
	 * @returns A css color
	 */

	async getParentColor(): Promise<string> {
		return await this.parent?.getColor() || 'transparent'
	}

	/**
	 * Get the color of the child field
	 * @returns A css color
	 */

	async getChildColor(): Promise<string> {
		return await this.child?.getColor() || 'transparent'
	}

	// --------------------> Validation

	/**
	 * Check if a field has a name
	 * @param field The field to check
	 * @returns Whether the field has a name
	 */

	protected hasName(field: T): boolean {
		return field.trimmed_name !== ''
	}

	/**
	 * Uses a depth first search to check if a relation is cyclic
	 * @param parent The parent field
	 * @param child The child field
	 * @returns Whether the relation is cyclic
	 */

	protected async isCyclic(parent: T, child: T): Promise<boolean> {
		let stack: T[] = [child]
		while (stack.length > 0) {

			// Pop the current node
			const current = stack.pop()!
			if (current === parent) {
				return true
			}

			// Add children to the stack
			const children = await current.getChildren()
			stack = [...stack, ...children] as T[]
		}

		return false
	}

	/**
	 * Check if a relation is self referential
	 * @param parent The parent field
	 * @param child The child field
	 * @returns Whether the relation is self referential
	 */

	protected isSelfReferential(parent: T, child: T): boolean {
		return parent === child
	}

	// --------------------> Utility

	/**
	 * Check if this relation matches a query
	 * @param query Query to match
	 * @returns Whether the domain matches the query
	 */

	matchesQuery(query: string): boolean {
		const query_lower = query.toLowerCase()
		const parent = this.parent ? this.parent.trimmed_name.toLowerCase() : ''
		const child = this.child ? this.child.trimmed_name.toLowerCase() : ''

		return parent.includes(query_lower) || child.includes(query_lower)
	}

	// --------------------> Abstract

	abstract getParentOptions(): Promise<{ value: FieldController, label: string, validation: ValidationData }[]>
	abstract getChildOptions(): Promise<{ value: FieldController, label: string, validation: ValidationData }[]>

	abstract assignGraph(graph: GraphController, mirror: boolean): void
	abstract unassignGraph(): void

	abstract validate(): Promise<ValidationData>
	abstract save(): void
	abstract delete(): void
}

class DomainRelationController extends RelationController<DomainController> {

	// --------------------> API Getters

	/**
	 * Get the parent options for this domain relation
	 * @returns The parent options
	 */

	async getParentOptions(): Promise<DropdownOption<DomainController>[]> {
		const domains = await this.graph.getDomains()
		return await Promise.all(domains.map(async domain => ({
				value: domain,
				label: domain.trimmed_name,
				validation: await this.validateOption(domain, this.child)
			}))
		)
	}

	/**
	 * Get the child options for this domain relation
	 * @returns The child options
	 */

	async getChildOptions(): Promise<DropdownOption<DomainController>[]> {
		const domains = await this.graph.getDomains()
		return await Promise.all(domains.map(async domain => ({
				value: domain,
				label: domain.trimmed_name,
				validation: await this.validateOption(this.parent, domain)
			}))
		)
	}

	// --------------------> Actions

	/**
	 * Create the domain relation
	 * @param graph The graph to create the relation in
	 */

	static create(graph: GraphController, parent?: DomainController, child?: DomainController) {
		const relation = new DomainRelationController(graph, parent, child)
		graph.assignDomainRelation(relation, false)
		return relation
	}

	/**
	 * Save the domain relation
	 */

	async save() {
		await this.parent?.save()
		await this.child?.save()
	}

	/**
	 * Delete the domain relation
	 */

	delete() {
		this.parent = null // Unassigning the parent will invalidate the entire relation
		this.unassignGraph()
	}

	// --------------------> Validation

	/**
	 * Check if the relation already exists
	 * @param parent The parent domain
	 * @param child The child domain
	 * @returns Whether the relation already exists
	 */

	private async isDuplicate(parent: DomainController, child: DomainController): Promise<boolean> {
		const domain_relations = await this.graph.getDomainRelations()
		return domain_relations.find(relation =>
			relation.uuid !== this.uuid &&
			relation.parent === parent &&
			relation.child === child
		) !== undefined
	}

	/**
	 * Check if there exists a subject relation that is consistent with this domain relation
	 * @param parent The parent domain
	 * @param child The child domain
	 * @returns Whether the relation is inconsistent
	 */

	private async isInconsistent(parent: DomainController, child: DomainController): Promise<boolean> {
		const subject_relations = await this.graph.getSubjectRelations()
		return subject_relations.find(relation =>
			relation.parent?.domain_id === parent.id &&
			relation.child?.domain_id === child.id
		) === undefined
	}

	/**
	 * Validate an option for this domain relation
	 * @param parent The parent domain
	 * @param child The child domain
	 * @returns The validation data
	 */

	private async validateOption(parent: DomainController | null, child: DomainController | null): Promise<ValidationData> {
		const validation = new ValidationData()

		// Check if the relation is defined
		if (parent === null || child === null) {
			return validation
		}

		// Check if the relation is self-referential
		if (this.isSelfReferential(parent, child)) {
			validation.add({ severity: Severity.error, short: 'Self-referential' })
		}

		// Check if the relation is a duplicate
		else if (await this.isDuplicate(parent, child)) {
			validation.add({ severity: Severity.error, short: 'Duplicate relation' })
		}

		// Check if the relation is cyclic
		else if (await this.isCyclic(parent, child)) {
			validation.add({ severity: Severity.error, short: 'Cyclic relation' })
		}

		// Check if the relation is consistent
		else if (await this.isInconsistent(parent, child)) {
			validation.add({ severity: Severity.warning, short: 'Inconsistent' })
		}

		return validation
	}

	/**
	 * Validate the domain relation
	 * @returns Validation result
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		// Check if the parent and child are defined
		if (this.parent === null || this.child === null) {
			validation.add({
				severity: Severity.error,
				short: 'Domain relation is not fully defined',
				long: 'Both the parent and child domains must be selected',
				tab: 1,
				uuid: this.uuid
			})
		}

		// Check if the relation is self-referential
		else if (this.isSelfReferential(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Domain relation is self-referential',
				long: 'The parent and child domains are the same',
				tab: 1,
				uuid: this.uuid
			})
		}

		// Check if the relation is duplicate
		else if (await this.isDuplicate(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Domain relation is a duplicate',
				long: 'The relation already exists in the graph',
				tab: 1,
				uuid: this.uuid
			})
		}

		// Check if the relation is cyclic
		else if (await this.isCyclic(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Domain relation is cyclic',
				long: 'The parent and child domains are cyclically related',
				tab: 1,
				uuid: this.uuid
			})
		}

		// Check if the relation is consistent
		else if (await this.isInconsistent(this.parent, this.child)) {
			validation.add({
				severity: Severity.warning,
				short: 'Domain relation is inconsistent',
				long: 'No subject relation exists that supports this domain relation',
				tab: 1,
				uuid: this.uuid
			})
		}


		return validation
	}

	// --------------------> Assignments

	/**
	 * Assign a graph to this relation
	 * @param graph The graph to assign
	 * @param mirror Whether to mirror the relation
	 */

	assignGraph(graph: GraphController, mirror: boolean = true) {
		if (this.graph === graph) return

		// Unassign the relation from the current graph
		this.graph.unassignDomainRelation(this)

		// Assign the relation to the new graph
		this.graph = graph
		if (mirror) {
			graph.assignDomainRelation(this, false)
		}
	}

	/**
	 * Unassign the graph from this relation
	 */

	unassignGraph() {
		this.graph.unassignDomainRelation(this)
	}
}

class SubjectRelationController extends RelationController<SubjectController> {

	// --------------------> API Getters

	/**
	 * Get the parent options for this subject relation
	 * @returns The parent options
	 */

	async getParentOptions(): Promise<DropdownOption<SubjectController>[]> {
		const subjects = await this.graph.getSubjects()
		return await Promise.all(subjects.map(async subject => ({
				value: subject,
				label: subject.trimmed_name,
				validation: await this.validateOption(subject, this.child)
			}))
		)
	}

	/**
	 * Get the child options for this subject relation
	 * @returns The child options
	 */

	async getChildOptions(): Promise<DropdownOption<SubjectController>[]> {
		const subjects = await this.graph.getSubjects()
		return await Promise.all(subjects.map(async subject => ({
				value: subject,
				label: subject.trimmed_name,
				validation: await this.validateOption(this.parent, subject)
			}))
		)
	}

	// --------------------> Actions

	/**
	 * Create the subject relation
	 * @param graph The graph to create the relation in
	 */

	static create(graph: GraphController, parent?: SubjectController, child?: SubjectController) {
		const relation = new SubjectRelationController(graph, parent, child)
		graph.assignSubjectRelation(relation, false)
		return relation
	}

	/**
	 * Save the subject relation
	 */

	async save() {
		await this.parent?.save()
		await this.child?.save()
	}

	/**
	 * Delete the subject relation
	 */

	delete() {
		this.parent = null // Unassigning the parent will invalidate the entire relation
		this.unassignGraph()
	}

	// --------------------> Validation

	/**
	 * Check if the relation already exists
	 * @param parent The parent subject
	 * @param child The child subject
	 * @returns Whether the relation already exists
	 */

	private async isDuplicate(parent: SubjectController, child: SubjectController): Promise<boolean> {
		const subject_relations = await this.graph.getSubjectRelations()
		return subject_relations.find(relation =>
			relation.uuid !== this.uuid &&
			relation.parent === parent &&
			relation.child === child
		) !== undefined
	}

	/**
	 * Check if there exists a domain relation that is consistent with this subject relation
	 * @param parent The parent subject
	 * @param child The child subject
	 * @returns Whether the relation is inconsistent
	 */

	private async isInconsistent(parent: SubjectController, child: SubjectController): Promise<boolean> {
		if (
			parent.domain_id === child.domain_id ||					// Parent and child are in the same domain
			parent.domain_id === null || child.domain_id === null	// Parent or child domain is not defined
		) return false

		const domain_relations = await this.graph.getDomainRelations()
		return domain_relations.find(relation =>
			relation.parent?.id === parent.domain_id &&
			relation.child?.id === child.domain_id
		) === undefined
	}

	/**
	 * Validate an option for this subject relation
	 * @param parent The parent subject
	 * @param child The child subject
	 * @returns The validation data
	 */

	private async validateOption(parent: SubjectController | null, child: SubjectController | null): Promise<ValidationData> {
		const validation = new ValidationData()

		// Check if the relation is defined
		if (parent === null || child === null) {
			return validation
		}

		// Check if the relation is self-referential
		if (this.isSelfReferential(parent, child)) {
			validation.add({ severity: Severity.error, short: 'Self-referential' })
		}

		// Check if the relation is a duplicate
		else if (await this.isDuplicate(parent, child)) {
			validation.add({ severity: Severity.error, short: 'Duplicate relation' })
		}

		// Check if the relation is cyclic
		else if (await this.isCyclic(parent, child)) {
			validation.add({ severity: Severity.error, short: 'Cyclic relation' })
		}

		// Check if the relation is consistent
		else if (await this.isInconsistent(parent, child)) {
			validation.add({ severity: Severity.warning, short: 'Inconsistent' })
		}

		return validation
	}

	/**
	 * Validate the subject relation
	 * @returns The validation data
	 */

	async validate(): Promise<ValidationData> {
		const validation = new ValidationData()

		// Check if the parent and child are defined
		if (this.parent === null || this.child === null) {
			validation.add({
				severity: Severity.error,
				short: 'Subject relation is not fully defined',
				long: 'Both the parent and child subjects must be selected',
				tab: 2,
				uuid: this.uuid
			})
		}

		// Check if the relation is self-referential
		else if (this.isSelfReferential(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Subject relation is self-referential',
				long: 'The parent and child subjects are the same',
				tab: 2,
				uuid: this.uuid
			})
		}

		// Check if the relation is duplicate
		else if (await this.isDuplicate(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Subject relation is a duplicate',
				long: 'The relation already exists in the graph',
				tab: 2,
				uuid: this.uuid
			})
		}

		// Check if the relation is cyclic
		else if (await this.isCyclic(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Subject relation is cyclic',
				long: 'The parent and child subjects are cyclically related',
				tab: 2,
				uuid: this.uuid
			})
		}

		// Check if the relation is consistent
		else if (await this.isInconsistent(this.parent, this.child)) {
			validation.add({
				severity: Severity.warning,
				short: 'Subject relation is inconsistent',
				long: 'No domain relation exists that supports this subject relation',
				tab: 2,
				uuid: this.uuid
			})
		}

		return validation
	}

	// --------------------> Assignments

	/**
	 * Assign a graph to this relation
	 * @param graph The graph to assign
	 * @param mirror Whether to mirror the relation
	 */

	assignGraph(graph: GraphController, mirror: boolean = true) {
		if (this.graph === graph) return

		// Unassign the relation from the current graph
		this.graph.unassignSubjectRelation(this)

		// Assign the relation to the new graph
		this.graph = graph
		if (mirror) {
			graph.assignSubjectRelation(this, false)
		}
	}

	/**
	 * Unassign the graph from this relation
	 */

	unassignGraph() {
		this.graph.unassignSubjectRelation(this)
	}
}