
// Internal imports
import { ValidationData } from '$scripts/validation'

// External imports
import Modal from '$components/layouts/Modal.svelte'

// Exports
export { BaseModal }


// --------------------> Classes


abstract class BaseModal {
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
	abstract submit(): void
}