
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

// Exports
export {
	RelationController,
	DomainRelationController,
	SubjectRelationController
}


// --------------------> Controllers


abstract class RelationController {
	uuid: string

	constructor(
		public graph: GraphController,
		protected _parent?: FieldController,
		protected _child?: FieldController
	) {
		this.uuid = uuid.v4()
	}

	// --------------------> Getters & Setters

	get parent(): FieldController | undefined {
		return this._parent
	}

	set parent(parent: FieldController | undefined) {
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

	get child(): FieldController | undefined {
		return this._child
	}

	set child(child: FieldController | undefined) {
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

	protected hasName(field: FieldController): boolean {
		return field.trimmed_name !== ''
	}

	/**
	 * Check if the given values are all defined
	 * @param values The values to check
	 * @returns Whether all values are defined
	 */

	protected isDefined(...values: (any | undefined)[]): boolean {
		return values.every(value => value !== undefined)
	}

	/**
	 * Uses a depth first search to check if a relation is cyclic
	 * @param parent The parent field
	 * @param child The child field
	 * @returns Whether the relation is cyclic
	 */

	protected async isCyclic(parent?: FieldController, child?: FieldController): Promise<boolean> {
		let stack: FieldController[] = [child!]
		while (stack.length > 0) {

			// Pop the current node
			const current = stack.pop()!
			if (current === parent) {
				return true
			}

			// Add children to the stack
			const children = await current.getChildren()
			stack.push(...children)
		}

		return false
	}

	/**
	 * Check if a relation is self referential
	 * @param parent The parent field
	 * @param child The child field
	 * @returns Whether the relation is self referential
	 */

	protected isSelfReferential(parent?: FieldController, child?: FieldController): boolean {
		return parent === child
	}

	// --------------------> Abstract

	abstract getParentOptions(): Promise<{ value: FieldController, label: string, validation: ValidationData }[]>
	abstract getChildOptions(): Promise<{ value: FieldController, label: string, validation: ValidationData }[]>

	abstract validate(): Promise<ValidationData>
}

class DomainRelationController extends RelationController {

	// --------------------> API Getters

	/**
	 * Get the parent options for this domain relation
	 * @returns The parent options
	 */

	async getParentOptions(): Promise<{ value: DomainController, label: string, validation: ValidationData }[]> {
		const options: { value: DomainController, label: string, validation: ValidationData }[] = []
		const domains = await this.graph.getDomains()

		for (const domain of domains) {

			// Check if the domain has a name
			if (!this.hasName(domain)) continue

			// Add the domain to options
			options.push({
				value: domain,
				label: domain.trimmed_name,
				validation: await this.validateOption(domain, this.child as DomainController)
			})
		}

		return options
	}

	/**
	 * Get the child options for this domain relation
	 * @returns The child options
	 */

	async getChildOptions(): Promise<{ value: DomainController, label: string, validation: ValidationData }[]> {
		const options: { value: DomainController, label: string, validation: ValidationData }[] = []
		const domains = await this.graph.getDomains()

		for (const domain of domains) {

			// Check if the domain has a name
			if (!this.hasName(domain)) continue

			// Add the domain to options
			options.push({
				value: domain,
				label: domain.trimmed_name,
				validation: await this.validateOption(this.parent as DomainController, domain)
			})
		}

		return options
	}

	// --------------------> Validation

	/**
	 * Check if the relation already exists
	 * @param parent The parent domain
	 * @param child The child domain
	 * @returns Whether the relation already exists
	 */

	private async isDuplicate(parent?: DomainController, child?: DomainController): Promise<boolean> {
		const domain_relations = await this.graph.getDomainRelations()
		return domain_relations.find(relation =>
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

	private async isInconsistent(parent?: DomainController, child?: DomainController): Promise<boolean> {
		const subject_relations = await this.graph.getSubjectRelations()
		return subject_relations.find(relation =>
			relation.parent === parent &&
			relation.child === child
		) !== undefined
	}

	/**
	 * Validate an option for this domain relation
	 * @param parent The parent domain
	 * @param child The child domain
	 * @returns The validation data
	 */

	private async validateOption(parent?: DomainController, child?: DomainController): Promise<ValidationData> {
		const validation = new ValidationData()

		// Check if the relation is defined
		if (!this.isDefined(parent, child)) {
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
		if (!this.isDefined(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Domain relation is not fully defined',
				long: 'Both the parent and child domains must be selected',
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

		return validation
	}
}

class SubjectRelationController extends RelationController {

	// --------------------> API Getters

	/**
	 * Get the parent options for this subject relation
	 * @returns The parent options
	 */

	async getParentOptions(): Promise<{ value: SubjectController, label: string, validation: ValidationData }[]> {
		const options: { value: SubjectController, label: string, validation: ValidationData }[] = []
		const subjects = await this.graph.getSubjects()
		for (const subject of subjects) {

			// Check if the subject has a name
			if (!this.hasName(subject)) continue

			// Add the subject to options
			options.push({
				value: subject,
				label: subject.trimmed_name,
				validation: await this.validateOption(subject, this.child as SubjectController)
			})
		}

		return options
	}

	/**
	 * Get the child options for this subject relation
	 * @returns The child options
	 */

	async getChildOptions(): Promise<{ value: SubjectController, label: string, validation: ValidationData }[]> {
		const options: { value: SubjectController, label: string, validation: ValidationData }[] = []
		const subjects = await this.graph.getSubjects()
		for (const subject of subjects) {

			// Check if the subject has a name
			if (!this.hasName(subject)) continue

			// Add the subject to options
			options.push({
				value: subject,
				label: subject.trimmed_name,
				validation: await this.validateOption(this.parent as SubjectController, subject)
			})
		}

		return options
	}

	// --------------------> Validation

	/**
	 * Check if the relation already exists
	 * @param parent The parent subject
	 * @param child The child subject
	 * @returns Whether the relation already exists
	 */

	private async isDuplicate(parent?: SubjectController, child?: SubjectController): Promise<boolean> {
		const subject_relations = await this.graph.getSubjectRelations()
		return subject_relations.find(relation =>
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

	private async isInconsistent(parent?: SubjectController, child?: SubjectController): Promise<boolean> {
		const domain_relations = await this.graph.getDomainRelations()
		return domain_relations.find(relation =>
			relation.parent?.id === parent?.domain_id &&
			relation.child?.id === child?.domain_id
		) !== undefined
	}

	/**
	 * Validate an option for this subject relation
	 * @param parent The parent subject
	 * @param child The child subject
	 * @returns The validation data
	 */

	private async validateOption(parent?: SubjectController, child?: SubjectController): Promise<ValidationData> {
		const validation = new ValidationData()

		// Check if the relation is defined
		if (!this.isDefined(parent, child)) {
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
		if (!this.isDefined(this.parent, this.child)) {
			validation.add({
				severity: Severity.error,
				short: 'Subject relation is not fully defined',
				long: 'Both the parent and child subjects must be selected',
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

		return validation
	}
}