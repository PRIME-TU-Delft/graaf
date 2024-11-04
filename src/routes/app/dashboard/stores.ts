
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type {
	ControllerCache,
	ProgramController,
	CourseController
} from '$scripts/controllers'

// Exports
export const cache = writable<ControllerCache>()
export const programs = writable<ProgramController[]>()
export const courses = writable<CourseController[]>()
export const search_query = writable<string>('')