
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type { ValidationData } from '$scripts/validation'
import type { DropdownOption } from '$scripts/types'

import type {
	ControllerCache,
	CourseController,
	GraphController,
	LinkController
} from '$scripts/controllers'

// Exports
export const cache = writable<ControllerCache>()
export const course = writable<CourseController>()
export const course_validation = writable<ValidationData[]>()

