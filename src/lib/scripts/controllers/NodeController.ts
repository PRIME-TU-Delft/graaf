
// External dependencies
import * as uuid from 'uuid'

// Internal dependencies
import * as settings from '$scripts/settings'
import { Validation } from '$scripts/validation'

import {
	ControllerCache,
	GraphController,
	DomainController,
	SubjectController
} from '$scripts/controllers'

import type { DropdownOption } from '$scripts/types'

// Exports
export { NodeController }


// --------------------> Node Controller


abstract class NodeController<T extends DomainController | SubjectController> {
	public uuid: string = uuid.v4()

	protected _untouched: boolean = false
	protected _graph?: GraphController
	protected _parents?: T[]
	protected _children?: T[]

	protected constructor(
		public cache: ControllerCache,
		public id: number,
		protected _name: string,
		public ordering: number,
		public x: number,
		public y: number,
		protected _graph_id?: number,
		protected _parent_ids?: number[],
		protected _child_ids?: number[]
	) { }

	// --------------------> Getters & Setters

	// Name properties
	get name(): string {
		return this._name
	}

	set name(value: string) {
		this._name = value
		this._untouched = false
	}

	get trimmed_name(): string {
		return this._name.trim()
	}

	// Graph properties
	get graph_id(): number {
		if (this._graph_id === undefined)
			throw new Error('NodeError: Graph data unknown')
		return this._graph_id
	}

	get graph(): GraphController {
		if (this._graph_id === undefined)
			throw new Error('NodeError: Graph data unknown')
		if (this._graph !== undefined)
			return this._graph

		// Fetch graph from cache
		this._graph = this.cache.findOrThrow(GraphController, this._graph_id)
		return this._graph
	}

	// Parent properties
	get parent_ids(): number[] {
		if (this._parent_ids === undefined)
			throw new Error('NodeError: Parent data unknown')
		return Array.from(this._parent_ids)
	}

	get parent_options(): DropdownOption<T>[] {
		return this.parents.map(parent => ({
				value: parent,
				label: parent.name,
				validation: Validation.success()
			})
		)
	}

	// Child properties
	get child_ids(): number[] {
		if (this._child_ids === undefined)
			throw new Error('NodeError: Child data unknown')
		return Array.from(this._child_ids)
	}

	get child_options(): DropdownOption<T>[] {
		return this.children.map(child => ({
				value: child,
				label: child.name,
				validation: Validation.success()
			})
		)
	}

	abstract get untouched(): boolean
	abstract set untouched(value: boolean)
	abstract get parents(): T[]
	abstract get children(): T[]

	// --------------------> Assignments

	abstract addParent(parent: T): void
	abstract removeParent(parent: T): void
	abstract addChild(child: T): void
	abstract removeChild(child: T): void

	// --------------------> Validation

	abstract validateName(strict: boolean): Validation
	abstract validate(strict: boolean): Validation

	// --------------------> Actions

	abstract save(): void
	abstract delete(): void
}