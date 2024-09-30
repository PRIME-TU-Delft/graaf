
// Extrnal imports
import * as uuid from 'uuid'

// Internal imports
import { GraphController, DomainController, SubjectController } from '$scripts/controllers'
import { ValidationData, Severity } from '$scripts/validation'

// Exports
export { RelationController, DomainRelationController, SubjectRelationController }


// --------------------> Classes


abstract class RelationController<T extends DomainController | SubjectController> {
	constructor (
		public graph: GraphController,	// The graph the relation belongs to
		public anchor: string,	// The anchor of the relation, unique for every DOM element, used for finding errors and d3 selection
		public index: number,	// The index of the relation in the list of its type, based on creation order, consistent after sorting, deleting etc
		private _parent?: T,	// The parent of the relation, exposed setter automatically updates field parents/children
		private _child?: T		// The child of the relation, exposed setter automatically updates field parents/children
	) { 
		if (this.parent && this.child) {
			this.parent.children = [...this.parent.children, this.child] as DomainController[] | SubjectController[]
			this.child.parents = [...this.child.parents, this.parent] as DomainController[] | SubjectController[]
		}
	}

	get parent(): T | undefined {
		return this._parent
	}

	set parent(parent: T | undefined) {
		if (this.parent === parent) return

		// Update parent and child references
		if (this.child) {
			if (this.parent) {
				this.child.parents = this.child.parents.filter(field => field !== this.parent) as DomainController[] | SubjectController[]
				this.parent.children = this.parent.children.filter(field => field !== this.child) as DomainController[] | SubjectController[]
			}

			if (parent) {
				this.child.parents = [...this.child.parents, parent] as DomainController[] | SubjectController[]
				parent.children = [...parent.children, this.child] as DomainController[] | SubjectController[]
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
				this.parent.children = this.parent.children.filter(field => field !== this.child) as DomainController[] | SubjectController[]
				this.child.parents = this.child.parents.filter(field => field !== this.parent) as DomainController[] | SubjectController[]
			}

			if (child) {
				this.parent.children = [...this.parent.children, child] as DomainController[] | SubjectController[]
				child.parents = [...child.parents, this.parent] as DomainController[] | SubjectController[]
			}
		}

		this._child = child
	}

	get child_color(): string {
		return this.child?.color || 'transparent'
	}

	protected hasName(field: DomainController | SubjectController) {
		/* Check if the field has a name */

		return field.name !== ''
	}

	protected isDefined(...values: (any | undefined)[]): boolean {
		/* Check if the relation is defined */

		return values.every(value => value !== undefined)
	}

	protected isCyclic(parent?: T, child?: T): boolean {
		/* Depth first check if the relation is cyclic */

		let stack: (DomainController | SubjectController)[] = [child!]
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

	abstract get parent_options(): any[]
	abstract get child_options(): any[]
	abstract validate(): ValidationData
	abstract delete(): void
}

class DomainRelationController extends RelationController<DomainController> {
	get parent_options() {
		/* Return the parent options for this domain relation */

		const options = []
		for (const domain of this.graph.domains) {

			// Check if the domain has a name
			if (!this.hasName(domain)) continue

			// Add the domain to options
			options.push({
				name: domain.name,
				value: domain,
				validation: this.validateOption(domain, this.child)
			})
		}

		return options
	}

	get child_options() {
		/* Return the child options for this domain relation */

		const options = []
		for (const domain of this.graph.domains) {

			// Check if the domain has a name
			if (!this.hasName(domain)) continue

			// Add the domain to options
			options.push({
				name: domain.name,
				value: domain,
				validation: this.validateOption(this.parent, domain)
			})
		}

		return options
	}

	static create(graph: GraphController, parent?: DomainController, child?: DomainController): DomainRelationController {
		/* Create a new domain relation */

		const relation = new DomainRelationController(graph, uuid.v4(), graph.domain_relations.length, parent, child)
		graph.domain_relations.push(relation)
		return relation
	}

	private isDuplicate(parent?: DomainController, child?: DomainController): boolean {
		/* Check if the relation is a duplicate */

		return -1 !== this.graph.domain_relations.findIndex(
			relation => relation !== this && 
			relation.parent === parent && 
			relation.child === child
		)
	}

	private isInconsistent(parent?: DomainController, child?: DomainController): boolean {
		/* Check if the relation is consistent */

		return this.graph.subject_relations.every(relation => 
			relation.parent?.domain !== parent || 
			relation.child?.domain !== child
		)
	}

	private validateOption(parent?: DomainController, child?: DomainController): ValidationData {
		const validation = new ValidationData()

		// Check if the relation is defined
		if (!this.isDefined(parent, child))
			return validation

		// Check if the relation is self-referential
		if (this.isSelfReferential(parent, child))
			validation.add({ severity: Severity.error, short: 'Self-referential'})

		// Check if the relation is a duplicate
		else if (this.isDuplicate(parent, child))
			validation.add({ severity: Severity.error, short: 'Duplicate relation'})

		// Check if the relation is cyclic
		else if (this.isCyclic(parent, child))
			validation.add({ severity: Severity.error, short: 'Cyclic relation'})

		// Check if the relation is consistent
		else if (this.isInconsistent(parent, child))
			validation.add({ severity: Severity.warning, short: 'Inconsistent'})

		return validation
	}

	validate(): ValidationData {
		/* Validate this domain relation */

		const result = new ValidationData()

		// Check if the relation is defined
		if (!this.isDefined(this.parent, this.child)) {
			result.add({
				severity: Severity.error,
				short: 'Domain relation is not fully defined',
				long: 'Both the parent and child domains must be selected',
				tab: 1,
				anchor: this.anchor
			})
		}

		// Check if the relation is consistent
		if (this.isInconsistent(this.parent, this.child)) {
			result.add({
				severity: Severity.warning,
				short: 'Domain relation is inconsistent',
				long: 'The subjects of these domains are not related',
				tab: 1,
				anchor: this.anchor
			})
		}

		return result
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

class SubjectRelationController extends RelationController<SubjectController> {
	get parent_options() {
		/* Return the parent options for this subject relation */

		const options = []
		for (const subject of this.graph.subjects) {

			// Check if the subject has a name
			if (!this.hasName(subject)) continue

			// Add the subject to options
			options.push({
				name: subject.name,
				value: subject,
				validation: this.validateOption(subject, this.child)
			})
		}

		return options
	}

	get child_options() {
		/* Return the child options for this subject relation */

		const options = []
		for (const subject of this.graph.subjects) {

			// Check if the subject has a name
			if (!this.hasName(subject)) continue

			// Add the subject to options
			options.push({
				name: subject.name,
				value: subject,
				validation: this.validateOption(this.parent, subject)
			})
		}

		return options
	}

	static create(graph: GraphController, parent?: SubjectController, child?: SubjectController): SubjectRelationController {
		/* Create a new subject relation */

		const relation = new SubjectRelationController(graph, uuid.v4(), graph.subject_relations.length, parent, child)
		graph.subject_relations.push(relation)
		return relation
	}

	private isInconsistent(parent?: SubjectController, child?: SubjectController): boolean {
		/* Check if the relation is consistent */

		if (!this.isDefined(parent?.domain, child?.domain) || parent!.domain === child!.domain)
			return false
		return parent!.domain!.children.every(domain_child => domain_child !== child!.domain)
	}

	private isDuplicate(parent?: SubjectController, child?: SubjectController): boolean {
		/* Check if the relation is a duplicate */

		return -1 !== this.graph.subject_relations.findIndex(relation =>
			relation !== this && 
			relation.parent === parent && 
			relation.child === child
		)
	}

	private validateOption(parent?: SubjectController, child?: SubjectController): ValidationData {
		const validation = new ValidationData()

		// Check if the relation is defined
		if (!this.isDefined(parent, child))
			return validation

		// Check if the relation is self-referential
		if (this.isSelfReferential(parent, child))
			validation.add({ severity: Severity.error, short: 'Self-referential' })

		// Check if the relation is a duplicate
		else if (this.isDuplicate(parent, child))
			validation.add({ severity: Severity.error, short: 'Duplicate relation' })
		
		// Check if the relation is cyclic
		else if (this.isCyclic(parent, child))
			validation.add({ severity: Severity.error, short: 'Cyclic relation' })

		// Check if the relation is consistent
		else if (this.isInconsistent(parent, child))
			validation.add({ severity: Severity.warning, short: 'Inconsistent' })

		return validation
	}

	validate(): ValidationData {
		/* Validate this subject relation */

		const result = new ValidationData()

		// Check if the relation is defined
		if (!this.isDefined(this.parent, this.child)) {
			result.add({
				severity: Severity.error,
				short: 'Subject relation is not fully defined',
				long: 'Both the parent and child subjects must be selected',
				tab: 2,
				anchor: this.anchor
			})
		}

		// Check if the relation is consistent
		if (this.isInconsistent(this.parent, this.child)) {
			result.add({
				severity: Severity.warning,
				short: 'Subject relation is inconsistent',
				long: 'The domains of these subjects are not related',
				tab: 2, 
				anchor: this.anchor
			})
		}

		return result
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
