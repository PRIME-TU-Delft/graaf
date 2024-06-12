
// Internal imports
import { Graph, Field, Domain, Subject } from '../entities'

// Exports
export { Relation }

class Log

class Relation {
	graph: Graph
	private _parent?: Field
	private _child?: Field

	constructor(graph: Graph, parent?: Field, child?: Field) {
		this.graph = graph
		this._parent = parent
		this._child = child
	}

	static create(graph: Graph, parent?: Field, child?: Field): Relation {
		let relation = new Relation(graph)
		relation.parent = parent
		relation.child = child
		return relation
	}

	get id(): string {
		return `${this.parent?.id ?? 'undefined'}.${this.child?.id ?? 'undefined'}`
	}

	get parent(): Field | undefined {
		return this._parent
	}

	set parent(parent: Field | undefined) {
		if (this.parent === parent) return

		if (this.child) {
			if (this.parent) {
				this.parent.children = this.parent.children.filter(field => field !== this.child)
				this.child.parents = this.child.parents.filter(field => field !== this.parent)
			}

			if (parent) {
				parent.children.push(this.child)
				this.child.parents.push(parent)
			}
		}

		this._parent = parent
	}

	get parentColor(): string {
		return this.parent?.color ?? 'transparent'
	}

	get child(): Field | undefined {
		return this._child
	}

	set child(child: Field | undefined) {
		if (this.child === child) return

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

	get childColor(): string {
		return this.child?.color ?? 'transparent'
	}

	filterParentOptions(fields: Field[]): { name: string, value: Field, warning?: string, error?: string }[] {
		const options = []
		for (const field of fields) {
			if (!field.name) continue

			if (!this.child) {
				options.push({ name: field.name, value: field })
				continue
			}

			options.push(
				{ name: field.name, value: field, ...this.validate(field, this.child) }
			)
		}

		return options
	}

	filterChildOptions(fields: Field[]): { name: string, value: Field, warning?: string, error?: string }[] {
		const options = []
		for (const field of fields) {
			if (!field.name) continue

			if (!this.parent) {
				options.push({ name: field.name, value: field })
				continue
			}

			options.push(
				{ name: field.name, value: field, ...this.validate(this.parent, field) }
			)
		}

		return options
	}

	validate(a: Field, b: Field): { warning?: string, error?: string, description?: string } {
		const type = a instanceof Subject ? 'subject' : 'domain'
		const parent = a as Subject & Domain
		const child = b as Subject & Domain

		// Cast parent and child to their respective types
		parent

		// Prevent self-references
		if (parent === child) {
			return { error: 'Self-reference', description: `A ${type} cannot relate to itself` }
		}

		// Prevent duplicate relations
		if (parent.children.includes(child)) {
			return { error: 'Duplicate relation', description: 'This relation between already exists' }
		}

		// Prevent circular references
		if (parent.ancestors.includes(child)) {
			return { error: 'Circular relation', description: 'This relation results in a loop' }
		}

		// Check if there is a conflicting domain relation
		if (
			type === 'subject'
		) {
			if (parent.domain && child.domain &&
				parent.domain !== child.domain && (
					// TODO check child.domain.children.includes(parent.domain)
					parent.domain.parents.includes(child.domain) ||
					!parent.domain.children.includes(child.domain)
				)
			) {
				return { warning: 'Conflicting domain relations', description: `This relation does not obey domain relations` }
			}

			return { }

		} else {
			for (const subject of parent.subjects) {
			
				// TODO check child.subjects.children.domain === parent
				// Check if there is a conflicting domain relation
				for (const ancestor of subject.parents as Subject[]) {
					if (ancestor.domain === child) {
						return { warning: 'Conflicting subject relations', description: 'Subjects do not obey this relation' }
					}
				}
	
				// Check if there is matching domain relation
				for (const descendant of subject.children as Subject[]) {
					if (descendant.domain === child) {
						return { }
					}
				}
			}
	
			return { warning: 'Conflicting subject relations', description: 'No subjects follow this relation' }
		}
	}

	delete() {
		if (this.parent && this.child) {
			this.parent.children = this.parent.children.filter(field => field !== this.child)
			this.child.parents = this.child.parents.filter(field => field !== this.parent)
		}
	}
}