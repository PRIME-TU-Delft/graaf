
// Internal imports
import type { D } from 'vitest/dist/reporters-yx5ZTtEV.js'
import { Graph, Field, Domain, Subject } from '../entities'

// Exports
export { Relation }

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

	filterParentOptions(fields: Field[]): { name: string, value: Field, warning?: string, error?: string }[] {
		const options = []

		if (!this.child) {
			for (const field of fields) {
				if (!field.name) continue
				options.push({ name: field.name, value: field })
			}

			return options
		}

		const descendants = this.child.descendants
		for (const field of fields) {

			// Field must have a name
			if (!field.name) continue

			// Prevent duplicate relations
			if (this.parent !== field && this.child?.parents.includes(field)) {
				options.push({ name: field.name, value: field, error: 'Duplicate relation' })
				continue
			}

			// Prevent self-references
			if (this.child === field) {
				options.push({ name: field.name, value: field, error: 'Self-reference' })
				continue
			}

			// Prevent circular references
			if (descendants.includes(field)) {
				options.push({ name: field.name, value: field, error: 'Circular reference' })
				continue
			}

			// Check if there is a matching domain relation
			if (field instanceof Subject) {
				const child = this.child as Subject | undefined
				if (field.domain && child?.domain) {
					if (field.domain !== child.domain) {
						if (!field.domain.children.includes(child.domain)) {
							options.push({ name: field.name, value: field, warning: 'No matching domain relation' })
							continue
						}
					}
				}
			}

			// Check if there is a matching subject relation
			else if (field instanceof Domain) {
				let invalid = true
				for (const subject of field.subjects) {
					for (const child of subject.children as Subject[]) {
						if (child.domain === this.child) {
							invalid = false
							break
						}
					}
				}

				if (invalid) {
					options.push({ name: field.name, value: field, warning: 'No matching subject relation' })
					continue
				}
			}

			// Field is available
			options.push({ name: field.name, value: field })
		}

		return options
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

	filterChildOptions(fields: Field[]): { name: string, value: Field, warning?: string, error?: string }[] {
		const options = []
		if (!this.parent) {
			for (const field of fields) {
				if (!field.name) continue
				options.push({ name: field.name, value: field })
			}

			return options
		}

		const ancestors = this.parent.ancestors
		for (const field of fields) {

			// Field must have a name
			if (!field.name) continue

			// Prevent duplicate relations
			if (this.child !== field && this.parent?.children.includes(field)) {
				options.push({ name: field.name, value: field, error: 'Duplicate relation' })
				continue
			}

			// Prevent self-references
			if (field === this.parent) {
				options.push({ name: field.name, value: field, error: 'Self-reference' })
				continue
			}

			// Prevent circular references
			if (ancestors.includes(field)) {
				options.push({ name: field.name, value: field, error: 'Circular reference' })
				continue
			}

			// Check if there is a matching domain relation
			if (field instanceof Subject) {
				const parent = this.parent as Subject | undefined
				if (field.domain && parent?.domain) {
					if (field.domain !== parent.domain) {
						if (!field.domain.parents.includes(parent.domain)) {
							options.push({ name: field.name, value: field, warning: 'No matching domain relation' })
							continue
						}
					}
				}
			}

			// Check if there is a matching subject relation
			else if (field instanceof Domain) {
				let invalid = true
				for (const subject of field.subjects) {
					for (const parent of subject.parents as Subject[]) {
						if (parent.domain === this.parent) {
							invalid = false
							break
						}
					}
				}

				if (invalid) {
					options.push({ name: field.name, value: field, warning: 'No matching subject relation' })
					continue
				}
			}

			// Field is available
			options.push({ name: field.name, value: field })
		}

		return options
	}

	delete() {
		if (this.parent && this.child) {
			this.parent.children = this.parent.children.filter(field => field !== this.child)
			this.child.parents = this.child.parents.filter(field => field !== this.parent)
		}
	}
}