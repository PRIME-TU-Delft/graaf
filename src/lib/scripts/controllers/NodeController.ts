
// External dependencies
import * as uuid from 'uuid'

// Internal dependencies
import * as settings from '$scripts/settings'
import { Validation } from '$scripts/validation'
import { customError } from '$scripts/utility'

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

	protected _name_unchanged: boolean = false
	protected _graph?: GraphController
	protected _parents?: T[]
	protected _children?: T[]

	protected constructor(
		public cache: ControllerCache,
		public id: number,
		protected _name: string,
		public x: number,
		public y: number,
		protected _graph_id?: number,
		protected _parent_ids?: number[],
		protected _child_ids?: number[]
	) {
		this.fx = this.x
		this.fy = this.y
	}

	// --------------------> Getters & Setters

	// Name properties
	get name(): string {
		return this._name
	}

	set name(value: string) {
		this._name = value
		this._name_unchanged = false
	}

	get trimmed_name(): string {
		return this._name.trim()
	}

	// Graph properties
	get graph_id(): number {
		if (this._graph_id === undefined)
			throw customError('NodeError', 'Graph data unknown')
		return this._graph_id
	}

	get graph(): GraphController {
		if (this._graph_id === undefined)
			throw customError('NodeError', 'Graph data unknown')
		if (this._graph !== undefined)
			return this._graph

		// Fetch graph from cache
		this._graph = this.cache.findOrThrow(GraphController, this._graph_id)
		return this._graph
	}

	// Parent properties
	get parent_ids(): number[] {
		if (this._parent_ids === undefined)
			throw customError('NodeError', 'Parent data unknown')
		return Array.from(this._parent_ids)
	}

	// Child properties
	get child_ids(): number[] {
		if (this._child_ids === undefined)
			throw customError('NodeError', 'Child data unknown')
		return Array.from(this._child_ids)
	}

	// Color properties
	get color(): string {
		return this.style === null ? 'transparent' : settings.NODE_STYLES[this.style].stroke
	}

	abstract get display_name(): string
	abstract get is_empty(): boolean
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

	abstract save(save_status?: SaveStatus): void
}