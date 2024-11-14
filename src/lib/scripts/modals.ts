
// External imports
import type Modal from '$components/Modal.svelte'


// --------------------> Classes


export abstract class FormModal {
	private defaults: { [key: string]: any } = {}
	private changed: { [key: string]: boolean } = {}
	private _modal?: Modal

	get modal() {
		return this._modal
	}

	set modal(modal: Modal | undefined) {
		this._modal = modal
		this.modal?.setHideCallback(() => this.reset())
	}

	protected initialize() {
		for (const property in this) {
			if (this.isField(property)) {
				this.defaults[property] = this[property]
				this.changed[property] = false
			}
		}
	}

	protected reset() {
		for (const property in this) {
			if (this.isField(property)) {
				this[property] = this.defaults[property]
				this.changed[property] = false
			}
		}
	}

	protected hasChanged(property: string): boolean {
		const cast = property as Extract<keyof this, string>
		if (this[cast] !== this.defaults[property])
			this.changed[property] = true
		return this.changed[property]
	}

	protected touchAll() {
		for (const property in this) {
			if (this.isField(property)) {
				this.changed[property] = true
			}
		}
	}

	private isField(property: string): boolean {
		return property !== '_modal' && property !== 'modal' && property !== 'defaults' && property !== 'changed'
	}

	show() {
		this.modal?.show()
	}

	hide() {
		this.modal?.hide()
	}
}