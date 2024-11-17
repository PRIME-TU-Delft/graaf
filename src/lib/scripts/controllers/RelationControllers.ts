
// External dependencies
import * as uuid from 'uuid'

// Internal dependencies
import { Validation, Severity } from '$scripts/validation'

import {
	GraphController,
	DomainController,
	SubjectController
} from '$scripts/controllers'

import type {
	DropdownOption
} from '$scripts/types'

// Exports
export { RelationController, DomainRelationController, SubjectRelationController }

// -----------------> Controllers


abstract class RelationController<T extends DomainController | SubjectController> {
	uuid: string = uuid.v4()

	protected _untouched: boolean = false

	constructor(
		public graph: GraphController,
		protected _parent: T | null = null,
		protected _child: T | null = null
	) { }

	// --------------------> Getters & Setters

	// Parent properties
	get parent(): T | null {
		return this._parent
	}

	set parent(parent: T | null) {
		if (this.parent === parent) return

		// Update parent and child references
		if (this.child) {
			if (this.parent) {
				this.parent.removeChild(this.child as DomainController & SubjectController)
				this.child.removeParent(this.parent as DomainController & SubjectController)
			}

			if (parent) {
				parent.addChild(this.child as DomainController & SubjectController)
				this.child.addParent(parent as DomainController & SubjectController)
			}
		}

		this._parent = parent
		this._untouched = false
	}

	get parent_color(): string {
		return this.parent?.color || 'transparent'
	}

	abstract parent_options: DropdownOption<T>[]

	// Child properties
	get child(): T | null {
		return this._child
	}

	set child(child: T | null) {
		if (this.child === child) return

		// Update parent and child references
		if (this.parent) {
			if (this.child) {
				this.parent.removeChild(this.child as DomainController & SubjectController)
				this.child.removeParent(this.parent as DomainController & SubjectController)
			}

			if (child) {
				this.parent.addChild(child as DomainController & SubjectController)
				child.addParent(this.parent as DomainController & SubjectController)
			}
		}

		this._child = child
		this._untouched = false
	}

	get child_color(): string {
		return this.child?.color || 'transparent'
	}

	abstract child_options: DropdownOption<T>[]

	// Untouched properties
	get untouched(): boolean {
		return this._untouched
	}

	// --------------------> Validation

	protected isCyclic(parent: T, child: T): boolean {
		const visited: T[] = []
		const stack: T[] = [child]
		while (stack.length > 0) {
			const node = stack.pop() as T

			if (visited.includes(node))
				continue
			if (node === parent)
				return true

			visited.push(node)
			stack.push(...node.children as T[])
		}

		return false
	}

	protected isSelfReferential(parent: T, child: T): boolean {
		return parent === child
	}

	protected validateOptions(parent: T | null, child: T | null): Validation {
		const validation = new Validation()
		if (parent === null || child === null) return validation

		if (this.isSelfReferential(parent, child)) {
			validation.add({ severity: Severity.error, short: 'Self-referential' })
		}

		else if (this.isDuplicate(parent, child)) {
			validation.add({ severity: Severity.error, short: 'Duplicate' })
		}

		else if (this.isCyclic(parent, child)) {
			validation.add({ severity: Severity.error, short: 'Cyclic' })
		}

		else if (this.isInconsistent(parent, child)) {
			validation.add({ severity: Severity.warning, short: 'Inconsistent' })
		}

		return validation
	}

	protected abstract isDuplicate(parent: T, child: T): boolean
	protected abstract isInconsistent(parent: T, child: T): boolean
	abstract validate(): Validation

	// --------------------> Actions

	async save() {
		await this.parent?.save()
		await this.child?.save()
	}

	
	// --------------------> Utility

	matchesQuery(query: string): boolean {
		const lower_query = query.toLowerCase()
		const lower_parent = this.parent?.trimmed_name.toLowerCase() || ''
		const lower_child = this.child?.trimmed_name.toLowerCase() || ''

		return lower_parent.includes(lower_query) || lower_child.includes(lower_query)
	}
}

class DomainRelationController extends RelationController<DomainController> {

	// --------------------> Getters & Setters

	// Parent properties
	get parent_options(): DropdownOption<DomainController>[] {
		return this.graph.domains.map(domain => ({
			value: domain,
			label: domain.trimmed_name,
			validation: this.validateOptions(domain, this.child)
		}))
	}

	// Child properties
	get child_options(): DropdownOption<DomainController>[] {
		return this.graph.domains.map(domain => ({
			value: domain,
			label: domain.trimmed_name,
			validation: this.validateOptions(this.parent, domain)
		}))
	}

	// --------------------> Validation

	protected isDuplicate(parent: DomainController, child: DomainController): boolean {
		const relations = this.graph.domain_relations
		return relations.find(relation =>
			relation.uuid !== this.uuid &&
			relation.parent === parent &&
			relation.child === child
		) !== undefined
	}

	protected isInconsistent(parent: DomainController, child: DomainController): boolean {
		const subjects = this.graph.subjects.filter(subject => subject.domain_id === parent.id)

		const visited: SubjectController[] = []
		const stack: SubjectController[] = subjects
		while (stack.length > 0) {
			const subject = stack.pop() as SubjectController

			if (visited.includes(subject))
				continue
			if (subject.domain_id === child.id) 
				return false

			visited.push(subject)
			stack.push(...subject.children)
		}

		return true
	}

	validate(strict: boolean = true): Validation {
		const validation = new Validation()
		if (!strict && this._untouched) return validation

		// Check if the parent and child are defined
		if (this.parent === null || this.child === null) {
			validation.add({
				severity: Severity.error,
				short: 'Domain relation is not fully defined',
				long: 'Both the parent and child domains must be selected',
				url: `/app/graph/${this.graph.id}/editor?tab=domains`,
				uuid: this.uuid
			})
		}

		// Check if the relation is self-referential
		else if (this.isSelfReferential(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Domain relation is self-referential',
				long: 'The parent and child domains are the same',
				url: `/app/graph/${this.graph.id}/editor?tab=domains`,
				uuid: this.uuid
			})
		}

		// Check if the relation is duplicate
		else if (this.isDuplicate(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Domain relation is a duplicate',
				long: 'The relation already exists in the graph',
				url: `/app/graph/${this.graph.id}/editor?tab=domains`,
				uuid: this.uuid
			})
		}

		// Check if the relation is cyclic
		else if (this.isCyclic(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Domain relation is cyclic',
				long: 'The parent and child domains are cyclically related',
				url: `/app/graph/${this.graph.id}/editor?tab=domains`,
				uuid: this.uuid
			})
		}

		// Check if the relation is consistent
		else if (this.isInconsistent(this.parent, this.child)) {
			validation.add({
				severity: Severity.warning,
				short: 'Domain relation is inconsistent',
				long: 'No subject relation exists that connects these domains',
				url: `/app/graph/${this.graph.id}/editor?tab=domains`,
				uuid: this.uuid
			})
		}

		return validation
	}

	// --------------------> Actions

	static create(graph: GraphController): DomainRelationController {
		const relation = new DomainRelationController(graph)
		graph.addDomainRelation(relation)
		relation._untouched = true
		return relation
	}

	static revive(graph: GraphController, parent: DomainController, child: DomainController): DomainRelationController {
		const relation = new DomainRelationController(graph, parent, child)
		graph.addDomainRelation(relation)
		return relation
	}

	delete() {
		this.parent = null // Unassigning the parent will invalidate the entire relation
		this.graph.removeDomainRelation(this)
	}
}

class SubjectRelationController extends RelationController<SubjectController> {

	// --------------------> Getters & Setters

	// Parent properties
	get parent_options(): DropdownOption<SubjectController>[] {
		return this.graph.subjects.map(subject => ({
			value: subject,
			label: subject.trimmed_name,
			validation: this.validateOptions(subject, this.child)
		}))
	}

	// Child properties
	get child_options(): DropdownOption<SubjectController>[] {
		return this.graph.subjects.map(subject => ({
			value: subject,
			label: subject.trimmed_name,
			validation: this.validateOptions(this.parent, subject)
		}))
	}

	// --------------------> Validation

	protected isDuplicate(parent: SubjectController, child: SubjectController): boolean {
		const relations = this.graph.subject_relations
		return relations.find(relation =>
			relation.uuid !== this.uuid &&
			relation.parent === parent &&
			relation.child === child
		) !== undefined
	}

	protected isInconsistent(parent: SubjectController, child: SubjectController): boolean {
		if (
			parent.domain_id === child.domain_id ||
			parent.domain_id === null || 
			child.domain_id === null
		) return false

		const visited: DomainController[] = []
		const stack: DomainController[] = [parent.domain as DomainController]
		while (stack.length > 0) {
			const domain = stack.pop() as DomainController

			if (visited.includes(domain))
				continue
			if (domain.id === child.domain_id)
				return false

			visited.push(domain)
			stack.push(...domain.children)
		}

		return true
	}

	validate(strict: boolean = true): Validation {
		const validation = new Validation()
		if (!strict && this._untouched) return validation

		// Check if the parent and child are defined
		if (this.parent === null || this.child === null) {
			validation.add({
				severity: Severity.error,
				short: 'Subject relation is not fully defined',
				long: 'Both the parent and child subjects must be selected',
				url: `/app/graph/${this.graph.id}/editor?tab=subjects`,
				uuid: this.uuid
			})
		}

		// Check if the relation is self-referential
		else if (this.isSelfReferential(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Subject relation is self-referential',
				long: 'The parent and child subjects are the same',
				url: `/app/graph/${this.graph.id}/editor?tab=subjects`,
				uuid: this.uuid
			})
		}

		// Check if the relation is duplicate
		else if (this.isDuplicate(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Subject relation is a duplicate',
				long: 'The relation already exists in the graph',
				url: `/app/graph/${this.graph.id}/editor?tab=subjects`,
				uuid: this.uuid
			})
		}

		// Check if the relation is cyclic
		else if (this.isCyclic(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Subject relation is cyclic',
				long: 'The parent and child subjects are cyclically related',
				url: `/app/graph/${this.graph.id}/editor?tab=subjects`,
				uuid: this.uuid
			})
		}

		// Check if the relation is consistent
		else if (this.isInconsistent(this.parent, this.child)) {
			validation.add({
				severity: Severity.warning,
				short: 'Subject relation is inconsistent',
				long: 'No domain relation exists that connects these subjects',
				url: `/app/graph/${this.graph.id}/editor?tab=subjects`,
				uuid: this.uuid
			})
		}

		return validation
	}

	// --------------------> Actions

	static create(graph: GraphController): SubjectRelationController {
		const relation = new SubjectRelationController(graph)
		graph.addSubjectRelation(relation)
		relation._untouched = true
		return relation
	}

	static revive(graph: GraphController, parent: SubjectController, child: SubjectController): SubjectRelationController {
		const relation = new SubjectRelationController(graph, parent, child)
		graph.addSubjectRelation(relation)
		return relation
	}

	delete() {
		this.parent = null // Unassigning the parent will invalidate the entire relation
		this.graph.removeSubjectRelation(this)
	}
}