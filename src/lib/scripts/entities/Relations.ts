
// Internal imports
import { Graph, Field } from '../entities'

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

	filterParentOptions(fields: Field[]): { name: string, value: Field, available: boolean, reason?: string }[] {
		let options = fields.map(field => {
			return { name: field.name, value: field, available: true } as { name: string, value: Field, available: boolean, reason?: string }
		})

		// Field must have a name
		options = options.filter(option => option.value.name)

		// Prevent duplicate relations
		options.forEach(option => {
			if (this.parent !== option.value && this.child?.parents.includes(option.value)) {
				option.available = false
				option.reason = 'Duplicate relation'
			}
		})

		// Prevent circular references
		const descendants = this.child?.descendants
		options.forEach(option => {
			if (!option.available) return
			if (option.value === this.child || descendants?.includes(option.value)) {
				option.available = false
				option.reason = 'Circular reference'
			}
		})

		// Ensure child options remain available
		options.forEach(option => {
			if (!option.available) return
			let childOptions = Array.from(fields)

			// Field must have a name
			childOptions = childOptions.filter(option => option.name)

			// Prevent duplicate relations
			const parent = option.value
			childOptions = childOptions.filter(option => {
				if (this.child === option) return true
				return !parent.children.includes(option)
			})

			// Prevent circular references
			const ancestors = parent.ancestors
			childOptions = childOptions.filter(option =>
				option !== parent && !ancestors?.includes(option)
			)

			// Prevent duplicate relations
			childOptions = childOptions.filter(option => {
				if (this.child === option) return true
				return !parent.children.includes(option)
			})

			if (childOptions.length === 0) {
				option.available = false
				option.reason = 'No valid child'
			}
		})

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

	filterChildOptions(fields: Field[]): { name: string, value: Field, available: boolean, reason?: string }[] {
		let options = fields.map(field => {
			return { name: field.name, value: field, available: true } as { name: string, value: Field, available: boolean, reason?: string }
		})

		// Field must have a name
		options = options.filter(option => option.value.name)

		// Prevent duplicate relations
		options.forEach(option => {
			if (this.child !== option.value && this.parent?.children.includes(option.value)) {
				option.available = false
				option.reason = 'Duplicate relation'
			}
		})

		// Prevent circular references
		const ancestors = this.parent?.ancestors
		options.forEach(option => {
			if (!option.available) return
			if (option.value === this.parent || ancestors?.includes(option.value)) {
				option.available = false
				option.reason = 'Circular reference'
			}
		})

		// Ensure parent options remain available
		options.forEach(option => {
			if (!option.available) return
			let parentOptions = Array.from(fields)

			// Field must have a name
			parentOptions = parentOptions.filter(option => option.name)

			// Prevent duplicate relations
			const child = option.value
			const descendants = child.descendants
			parentOptions = parentOptions.filter(option => {
				if (this.parent === option) return true
				return !child.parents.includes(option)
			})

			// Prevent circular references
			parentOptions = parentOptions.filter(option =>
				option !== child && !descendants?.includes(option)
			)

			if (parentOptions.length === 0) {
				option.available = false
				option.reason = 'No valid parent'
			}
		})

		return options
	}

	delete() {
		if (this.parent && this.child) {
			this.parent.children = this.parent.children.filter(field => field !== this.child)
			this.child.parents = this.child.parents.filter(field => field !== this.parent)
		}
	}
}