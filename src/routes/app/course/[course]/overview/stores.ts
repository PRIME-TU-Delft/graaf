
// External dependencies
import { writable, derived } from 'svelte/store'

// Internal dependencies
import { Validation } from '$scripts/validation'

import type {
	CourseController
} from '$scripts/controllers'

// Exports
export const course = writable<CourseController>()
export const courses = writable<CourseController[]>([])

export const course_options = derived(courses, 
	courses => courses.map(course => ({
		value: course, 
		label: course.name,
		validation: Validation.success()
	}))
)