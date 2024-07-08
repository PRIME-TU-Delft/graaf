
// Internal imports
import { Domain, Subject } from './Fields'
import { Graph } from './Graph'

import { ValidationData, Severity } from './Validation'
import { DropdownOption } from './DropdownOption'

// Exports
export { Relation, DomainRelation, SubjectRelation }


// --------------------> Classes


abstract class Relation<T extends Domain | Subject> {
	constructor (
		public graph: Graph,
		public index: number,
		private _parent?: T,
		private _child?: T
	) { }

	get parent(): T | undefined {
		return this._parent
	}

	set parent(parent: T | undefined) {
		if (this.parent === parent) return

		// Update parent and child references
		if (this.child) {
			if (this.parent) {
				this.child.parents = this.child.parents.filter(field => field !== this.parent) as Domain[] | Subject[]
				this.parent.children = this.parent.children.filter(field => field !== this.child) as Domain[] | Subject[]
			}

			if (parent) {
				this.child.parents = [...this.child.parents, parent] as Domain[] | Subject[]
				parent.children = [...parent.children, this.child] as Domain[] | Subject[]
			}
		}

		this._parent = parent
	}

	get parent_color(): string {
		return this.parent?.color || 'transparent'
	}

	get child(): T | undefined {
		return this._child
	}

	set child(child: T | undefined) {
		if (this.child === child) return

		// Update parent and child references
		if (this.parent) {
			if (this.child) {
				this.parent.children = this.parent.children.filter(field => field !== this.child) as Domain[] | Subject[]
				this.child.parents = this.child.parents.filter(field => field !== this.parent) as Domain[] | Subject[]
			}

			if (child) {
				this.parent.children = [...this.parent.children, child] as Domain[] | Subject[]
				child.parents = [...child.parents, this.parent] as Domain[] | Subject[]
			}
		}

		this._child = child
	}

	get child_color(): string {
		return this.child?.color || 'transparent'
	}

	protected hasName(field: Domain | Subject) {
		/* Check if the field has a name */

		return field.name !== ''
	}

	protected isDefined(...values: (any | undefined)[]): boolean {
		/* Check if the relation is defined */

		return values.every(value => value !== undefined)
	}

	protected isCyclic(parent?: T, child?: T): boolean {
		/* Depth first check if the relation is cyclic */

		if (!this.isDefined(parent, child)) return false

		let stack: (Domain | Subject)[] = [child!]
		while (stack.length > 0) {
			const current = stack.pop()!
			if (current === parent) return true
			stack.push(...current.children)
		}

		return false
	}

	protected isSelfReferential(parent?: T, child?: T): boolean {
		/* Check if the relation is self-referential */

		if (!this.isDefined(parent, child)) return false
		return parent === child
	}

	abstract get parent_options(): DropdownOption<Domain | Subject>[]
	abstract get child_options(): DropdownOption<Domain | Subject>[]
	abstract validate(): ValidationData
	abstract delete(): void
}

class DomainRelation extends Relation<Domain> {
	get parent_options(): DropdownOption<Domain>[] {
		/* Return the parent options for this domain relation */

		const options: DropdownOption<Domain>[] = []
		for (const domain of this.graph.domains) {

			// Check if the domain has a name
			if (!this.hasName(domain)) continue

			// Add the domain to options
			options.push(
				new DropdownOption(
					domain.name,
					domain,
					this.validateOption(domain, this.child)
				)
			)
		}

		return options
	}

	get child_options(): DropdownOption<Domain>[] {
		/* Return the child options for this domain relation */

		const options: DropdownOption<Domain>[] = []
		for (const domain of this.graph.domains) {

			// Check if the domain has a name
			if (!this.hasName(domain)) continue

			// Add the domain to options
			options.push(
				new DropdownOption(
					domain.name,
					domain,
					this.validateOption(this.parent, domain)
				)
			)
		}

		return options
	}

	static create(graph: Graph): DomainRelation {
		/* Create a new domain relation */

		const relation = new DomainRelation(graph, graph.domain_relations.length)
		graph.domain_relations.push(relation)
		return relation
	}

	private isDuplicate(parent?: Domain, child?: Domain): boolean {
		/* Check if the relation is a duplicate */

		if (!this.isDefined(parent, child)) return false

		const first = this.graph.domain_relations.findIndex(relation => relation.parent === parent && relation.child === child)
		const index = this.graph.domain_relations.indexOf(this, first + 1)
		return first !== -1 && index !== -1
	}

	private isInconsistent(parent?: Domain, child?: Domain): boolean {
		/* Check if the relation is consistent */

		if (!this.isDefined(parent, child)) return true

		for (const relation of this.graph.subject_relations) {
			if (relation.parent?.domain === parent && relation.child?.domain === child) {
				return false
			}
		}

		return true
	}

	private validateOption(parent?: Domain, child?: Domain): ValidationData {
		const validation = new ValidationData()

		// Check if the relation is self-referential
		if (this.isSelfReferential(parent, child))
			validation.add({ severity: Severity.error, short: 'Self-referential'})

		// Check if the relation is cyclic
		else if (this.isCyclic(parent, child))
			validation.add({ severity: Severity.error, short: 'Cyclic relation'})

		// Check if the relation is a duplicate
		else if (this.isDuplicate(parent, child))
			validation.add({ severity: Severity.error, short: 'Duplicate relation'})

		// Check if the relation is consistent
		else if (this.isInconsistent(parent, child))
			validation.add({ severity: Severity.warning, short: 'Inconsistent with subjects'})

		return validation
	}

	validate(): ValidationData {
		/* Validate this domain relation */

		const response = new ValidationData()

		// Check if the relation is defined
		if (!this.isDefined(this.parent, this.child)) {
			response.add({
				severity: Severity.error,
				short: 'Domain relation is not fully defined',
				long: 'Both the parent and child domains must be selected',
				tab: 1,
				anchor: this.index.toString()
			})
		}

		// Check if the relation is consistent
		if (this.isInconsistent(this.parent, this.child)) {
			response.add({
				severity: Severity.warning,
				short: 'Domain relation is inconsistent',
				long: 'The subjects of these domains are not related',
				tab: 1,
				anchor: this.index.toString()
			})
		}

		return response
	}

	delete(): void {
		/* Delete this domain relation */

		// Shift indexes
		for (const relation of this.graph.domain_relations) {
			if (relation.index > this.index) {
				relation.index--
			}
		}

		// Remove references in the parent and child
		if (this.isDefined(this.parent, this.child)) {
			this.parent!.children = this.parent!.children.filter(child => child !== this.child)
			this.child!.parents = this.child!.parents.filter(parent => parent !== this.parent)
		}

		// Remove this relation from the graph
		this.graph.domain_relations = this.graph.domain_relations.filter(relation => relation !== this)
	}
}

class SubjectRelation extends Relation<Subject> {
	get parent_options(): DropdownOption<Subject>[] {
		/* Return the parent options for this subject relation */

		const options: DropdownOption<Subject>[] = []
		for (const subject of this.graph.subjects) {

			// Check if the subject has a name
			if (!this.hasName(subject)) continue

			// Add the subject to options
			options.push(
				new DropdownOption(
					subject.name,
					subject,
					this.validateOption(subject, this.child)
				)
			)
		}

		return options
	}

	get child_options(): DropdownOption<Subject>[] {
		/* Return the child options for this subject relation */

		const options: DropdownOption<Subject>[] = []
		for (const subject of this.graph.subjects) {

			// Check if the subject has a name
			if (!this.hasName(subject)) continue

			// Add the subject to options
			options.push(
				new DropdownOption(
					subject.name,
					subject,
					this.validateOption(this.parent, subject)
				)
			)
		}

		return options
	}

	static create(graph: Graph): SubjectRelation {
		/* Create a new subject relation */

		const relation = new SubjectRelation(graph, graph.subject_relations.length)
		graph.subject_relations.push(relation)
		return relation
	}

	private isInconsistent(parent?: Subject, child?: Subject): boolean {
		/* Check if the relation is consistent */

		if (!this.isDefined(parent?.domain, child?.domain) || parent!.domain === child!.domain) {
			return false
		}

		for (const domain_child of parent!.domain!.children) {
			if (domain_child === child!.domain) return true
		}

		return false

	}

	private isDuplicate(parent?: Subject, child?: Subject): boolean {
		/* Check if the relation is a duplicate */

		if (!this.isDefined(parent, child)) return false

		const first = this.graph.subject_relations.findIndex(relation => relation.parent === parent && relation.child === child)
		const index = this.graph.subject_relations.indexOf(this, first + 1)
		return first !== -1 && index !== -1
	}

	private validateOption(parent?: Subject, child?: Subject): ValidationData {
		const validation = new ValidationData()

		// Check if the relation is self-referential
		if (this.isSelfReferential(parent, child))
			validation.add({ severity: Severity.error, short: 'Self-referential' })

		// Check if the relation is cyclic
		else if (this.isCyclic(parent, child))
			validation.add({ severity: Severity.error, short: 'Cyclic relation' })

		// Check if the relation is a duplicate
		else if (this.isDuplicate(parent, child))
			validation.add({ severity: Severity.error, short: 'Duplicate relation' })

		// Check if the relation is consistent
		else if (this.isInconsistent(parent, child))
			validation.add({ severity: Severity.warning, short: 'Inconsistent with domains' })

		return validation
	}

	validate(): ValidationData {
		/* Validate this subject relation */

		const response = new ValidationData()

		// Check if the relation is defined
		if (!this.isDefined(this.parent, this.child)) {
			response.add({
				severity: Severity.error,
				short: 'Subject relation is not fully defined',
				long: 'Both the parent and child subjects must be selected',
				tab: 2,
				anchor: this.index.toString()
			})
		}

		// Check if the relation is consistent
		if (this.isInconsistent(this.parent, this.child)) {
			response.add({
				severity: Severity.warning,
				short: 'Subject relation is inconsistent',
				long: 'The domains of these subjects are not related',
				tab: 2, 
				anchor: this.index.toString()
			})
		}

		return response
	}

	delete(): void {
		/* Delete this subject relation */

		// Shift indexes
		for (const relation of this.graph.subject_relations) {
			if (relation.index > this.index) {
				relation.index--
			}
		}

		// Remove references in the parent and child
		if (this.isDefined(this.parent, this.child)) {
			this.parent!.children = this.parent!.children.filter(child => child !== this.child)
			this.child!.parents = this.child!.parents.filter(parent => parent !== this.parent)
		}

		// Remove this relation from the graph
		this.graph.subject_relations = this.graph.subject_relations.filter(relation => relation !== this)
	}
}
