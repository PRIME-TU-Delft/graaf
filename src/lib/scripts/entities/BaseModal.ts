
// Internal imports
import { ValidationData } from '$scripts/entities'

// External imports
import Modal from '$components/Modal.svelte'

// Base class for modals
export abstract class BaseModal {
	private defaults: { [key: string]: any } = {}
	modal?: Modal

	protected initialize() {
		for (const property in this) {
			if (property !== 'modal' && property !== 'defaults') {
				this.defaults[property] = this[property]
			}
		}
	}

	show() {
		this.modal?.show()
	}

	hide() {
		this.modal?.hide()
		for (const property in this) {
			if (property !== 'modal' && property !== 'defaults') {
				this[property] = this.defaults[property]
			}
		}
	}

	abstract validate(): ValidationData
}