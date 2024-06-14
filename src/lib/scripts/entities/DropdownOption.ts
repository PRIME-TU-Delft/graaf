
// Internal imports
import { ValidationData } from './ValidationData'

// Exports
export { DropdownOption }


// --------------------> Classes


class DropdownOption<T> {
	constructor (
		public name: string,
		public value: T,
		public validation: ValidationData
	) { }
}