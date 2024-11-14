
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type { CourseController } from '$scripts/controllers'

// Exports
export const course = writable<CourseController>()