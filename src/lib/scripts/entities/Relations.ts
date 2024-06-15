
// Internal imports
import { DropdownOption } from './DropdownOption'
import { ValidationData, Error, Warning } from './ValidationData'
import { Domain, Subject } from './Fields'
import { Graph } from './Graph'

// Exports
export { Relation, DomainRelation, SubjectRelation }


// --------------------> Classes


abstract class Relation<T extends Domain | Subject> {
	constructor (
		public graph: Graph,
		public uuid: string,
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
				this.child.parents = this.child.parents.filter(field => field !== this.parent)
				this.parent.children = this.parent.children.filter(field => field !== this.child)
			}

			if (parent) {
				this.child.parents.push(parent)
				parent.children.push(this.child)
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
				this.parent.children = this.parent.children.filter(field => field !== this.child)
				this.child.parents = this.child.parents.filter(field => field !== this.parent)
			}

			if (child) {
				this.parent.children.push(child)
				child.parents.push(this.parent)
			}
		}

		this._child = child
	}

	get child_color(): string {
		return this.child?.color || 'transparent'
	}

	get defined(): boolean {
		return this.parent !== undefined && this.child !== undefined
	}

	protected isCyclic(parent?: T, child?: T): boolean {
		/* Depth first check if the relation is cyclic */

		if (!parent || !child) return false

		let stack = [child]
		while (stack.length > 0) {
			const current = stack.pop()!
			if (current === parent) return true
			stack.push(...current.children)
		}

		return false
	}

	protected isSelfReferential(parent?: T, child?: T): boolean {
		/* Check if the relation is self-referential */

		if (!parent || !child) return false
		return parent === child
	}

	abstract get parent_options(): DropdownOption<T>[]
	abstract get child_options(): DropdownOption<T>[]
	abstract validate(): ValidationData
	abstract delete(): void
}

class DomainRelation extends Relation<Domain> {
	static create(graph: Graph): DomainRelation {
		/* Create this domain relation */

		const relation = new DomainRelation(
			graph,
			Graph.generateUUID(),
			graph.domain_relations.length
		)

		graph.domain_relations.push(relation)
		return relation
	}

	private isDuplicate(parent?: Domain, child?: Domain): boolean {
		/* Check if the relation is a duplicate */

		if (!parent || !child) return false

		const first = this.graph.domain_relations.findIndex(relation => relation.parent === parent && relation.child === child)
		const index = this.graph.domain_relations.indexOf(this)

		return first >= 0 && first < index
	}

	private isConsistent(parent?: Domain, child?: Domain): boolean {
		/* Check if the relation is consistent */

		if (!parent || !child) return true

		for (const relation of this.graph.subject_relations) {
			if (relation.parent?.domain === parent && relation.child?.domain === child) {
				return true
			}
		}

		return false
	}

	private validateOption(parent?: Domain, child?: Domain): ValidationData {
		const validation = new ValidationData()

		// Check if the relation is self-referential
		if (this.isSelfReferential(parent, child))
			validation.add(new Error('Self-referential'))

		// Check if the relation is cyclic
		else if (this.isCyclic(parent, child))
			validation.add(new Error('Cyclic relation'))

		// Check if the relation is a duplicate
		else if (this.isDuplicate(parent, child))
			validation.add(new Error('Duplicate relation'))

		// Check if the relation is consistent
		else if (!this.isConsistent(parent, child))
			validation.add(new Warning('Inconsistent with subjects'))

		return validation
	}

	get parent_options(): DropdownOption<Domain>[] {
		/* Return the parent options for this domain relation */

		const options: DropdownOption<Domain>[] = []
		for (const domain of this.graph.domains) {

			// Check if the domain has a name
			if (domain.name === '')
				continue

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
			if (domain.name === '')
				continue

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

	validate(): ValidationData {
		/* Validate this domain relation */

		const response = new ValidationData()

		// Check if the relation is defined
		if (!this.defined)
			response.add(new Error(`Domain relation (${this.index + 1}) is not fully defined`))

		// Check if the relation is consistent
		if (!this.isConsistent(this.parent, this.child))
			response.add(new Warning(`Domain relation (${this.index + 1}) is inconsistent`, 'The subjects of these domains are not related'))

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
		if (this.defined) {
			this.parent!.children = this.parent!.children.filter(child => child !== this.child)
			this.child!.parents = this.child!.parents.filter(parent => parent !== this.parent)
		}

		// Remove this relation from the graph
		this.graph.domain_relations = this.graph.domain_relations.filter(relation => relation !== this)
	}
}

class SubjectRelation extends Relation<Subject> {
	static create(graph: Graph): SubjectRelation {
		/* Create this subject relation */

		const relation = new SubjectRelation(
			graph,
			Graph.generateUUID(),
			graph.subject_relations.length
		)

		graph.subject_relations.push(relation)
		return relation
	}

	private isConsistent(parent?: Subject, child?: Subject): boolean {
		/* Check if the relation is consistent */

		if (
			!child?.domain ||
			!parent?.domain ||
			parent.domain === child.domain
		) return true

		for (const domain_child of parent.domain.children) {
			if (domain_child === child.domain) return true
		}

		return false

	}

	private isDuplicate(parent?: Subject, child?: Subject): boolean {
		/* Check if the relation is a duplicate */

		if (!parent || !child) return false

		const first = this.graph.subject_relations.findIndex(relation => relation.parent === parent && relation.child === child)
		const index = this.graph.subject_relations.indexOf(this)

		return first >= 0 && first < index
	}

	private validateOption(parent?: Subject, child?: Subject): ValidationData {
		const validation = new ValidationData()

		// Check if the relation is self-referential
		if (this.isSelfReferential(parent, child))
			validation.add(new Error('Self-referential'))

		// Check if the relation is cyclic
		else if (this.isCyclic(parent, child))
			validation.add(new Error('Cyclic relation'))

		// Check if the relation is a duplicate
		else if (this.isDuplicate(parent, child))
			validation.add(new Error('Duplicate relation'))

		// Check if the relation is consistent
		else if (!this.isConsistent(parent, child))
			validation.add(new Warning('Inconsistent with domains'))

		return validation
	}

	get parent_options(): DropdownOption<Subject>[] {
		/* Return the parent options for this subject relation */

		const options: DropdownOption<Subject>[] = []
		for (const subject of this.graph.subjects) {

			// Check if the subject has a name
			if (subject.name === '')
				continue

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
			if (subject.name === '')
				continue

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

	validate(): ValidationData {
		/* Validate this subject relation */

		const response = new ValidationData()

		// Check if the relation is defined
		if (!this.defined)
			response.add(new Error(`Subject relation (${this.index + 1}) is not fully defined`))

		// Check if the relation is consistent
		if (!this.isConsistent(this.parent, this.child))
			response.add(new Warning(`Subject relation (${this.index + 1}) is inconsistent`, 'The subjects of these domains are not related'))

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
		if (this.defined) {
			this.parent!.children = this.parent!.children.filter(child => child !== this.child)
			this.child!.parents = this.child!.parents.filter(parent => parent !== this.parent)
		}

		// Remove this relation from the graph
		this.graph.subject_relations = this.graph.subject_relations.filter(relation => relation !== this)
	}
}