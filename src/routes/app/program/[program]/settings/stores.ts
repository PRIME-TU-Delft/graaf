
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type { 
    ProgramController,
    CourseController
} from '$scripts/controllers'

// Exports
export const program = writable<ProgramController>()
export const courses = writable<CourseController[]>()