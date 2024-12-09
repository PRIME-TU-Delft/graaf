
import type { Validation } from '$scripts/validation'
export type DropdownOption<T> = { 
    value: T, 
    label: string, 
    validation?: Validation,
    color?: string
}