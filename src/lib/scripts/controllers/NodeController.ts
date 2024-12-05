
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

import type { DomainStyle } from '$scripts/types'
import type SaveStatus from '$components/SaveStatus.svelte'

// Exports
export { NodeController }


// --------------------> Node Controller


abstract class NodeController<T extends DomainController | SubjectController> {
	public uuid: string = uuid.v4()
	public fx?: number
	public fy?: number

	protected _unsaved: boolean = false
	protected _graph?: GraphController
	protected _parents?: T[]
	protected _children?: T[]

	protected constructor(
		public cache: ControllerCache,
		public id: number,
		protected _unchanged: boolean,
		protected _name: string,
		protected _x: number,
		protected _y: number,
		protected _graph_id?: number,
		protected _parent_ids?: number[],
		protected _child_ids?: number[]
	) {
		this.fx = this._x
		this.fy = this._y
	}

	// --------------------> Getters & Setters

	// Unchanged properties
	get unchanged(): boolean {
		return this._unchanged
	}

	// Name properties
	get name(): string {
		return this._name
	}

	set name(value: string) {
		this._name = value
		this._unchanged = false
		this._unsaved = true
	}

	get trimmed_name(): string {
		return this._name.trim()
	}

	// Position properties
	get x(): number {
		return this._x
	}

	set x(value: number) {
		this._x = value
		this._unchanged = false
		this._unsaved = true
	}

	get y(): number {
		return this._y
	}

	set y(value: number) {
		this._y = value
		this._unchanged = false
		this._unsaved = true
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

	// Child properties
	get child_ids(): number[] {
		if (this._child_ids === undefined)
			throw new Error('NodeError: Child data unknown')
		return Array.from(this._child_ids)
	}

	// Color properties
	get color(): string {
		return this.style === null ? 'transparent' : settings.NODE_STYLES[this.style].stroke
	}

	abstract get style(): DomainStyle | null
	abstract get parents(): T[]
	abstract get children(): T[]

	// --------------------> Assignments

	abstract assignParent(parent: T, mirror: boolean): void
	abstract assignChild(child: T, mirror: boolean): void
	abstract unassignParent(parent: T, mirror: boolean): void
	abstract unassignChild(child: T, mirror: boolean): void

	// --------------------> Validation

	abstract validateName(strict: boolean): Validation
	abstract validate(strict: boolean): Validation

	// --------------------> Actions

	abstract save(save_status: SaveStatus): void
	abstract delete(): void
	abstract copy(graph: GraphController): Promise<T>
}