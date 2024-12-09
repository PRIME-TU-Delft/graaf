
// Internal dependencies
import type { Validation } from './validation'

// --------------------> Classes

export abstract class AbstractFormModal {
	private _changed: { [key: string]: boolean } = {}
	private _defaults: { [key: string]: any } = {}

	public show = () => {} // To be overwritten by the FormModal component
	public hide = () => {} // To be overwritten by the FormModal component

	constructor(
		public close_on_submit: boolean = true
	) { }

	/**
	 * Check if a property is a field of the form
	 * @param property The property to check
	 * @returns True if the property is a field, false otherwise
	 */

	private isField(property: string): boolean {
		return this.hasOwnProperty(property)
			&& property !== '_defaults' 
			&& property !== '_changed'
			&& property !== 'close_on_submit'
			&& property !== 'show'
			&& property !== 'hide'
	}

	/**
	 * Initialize the form by registering all fields and their default values.
	 * This method should be called in the constructor of the child class.
	 */

	protected initialize() {
		for (const property in this) {
			if (this.isField(property)) {
				this._defaults[property] = this[property]
				this._changed[property] = false
			}
		}
	}

	/**
	 * Check if a field has changed since the form was reset
	 * @param property The field to check
	 * @returns True if the field has changed, false otherwise
	 * @throws Error if the property is not a field of the form
	 */

	protected hasChanged(property: string): boolean {
		if (!this.isField(property))
			throw new Error(`Property "${property}" is not a field of the form`)
		if (this._changed[property])
			return true

		const cast = property as Extract<keyof this, string>
		if (this[cast] !== this._defaults[property])
			this._changed[property] = true
		return this._changed[property]
	}

	/**
	 * Mark all fields as changed
	 */

	public touchAll() {
		for (const property in this) {
			if (this.isField(property)) {
				this._changed[property] = true
			}
		}
	}

	/**
	 * Reset the form to its default values, marking all fields as unchanged
	 */

	public reset() {
		for (const property in this) {
			if (this.isField(property)) {
				this[property] = this._defaults[property]
				this._changed[property] = false
			}
		}
	}

	abstract validate(): Validation
	abstract submit(): Promise<void>
}