
// Internal dependencies
import { ValidationData } from '$scripts/validation'

// Exports
export type { DropdownOption }


// --------------------> Types


type DropdownOption<T> = {
    value: T
    label: string
    validation: ValidationData
}