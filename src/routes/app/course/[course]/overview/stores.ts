
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type { DropdownOption } from '$scripts/types'

import type {
	ControllerCache,
	CourseController,
	GraphController,
	LinkController,
	LectureController
} from '$scripts/controllers'

// Exports
export const cache = writable<ControllerCache>()
export const course = writable<CourseController>()
export const course_options = writable<DropdownOption<CourseController>[]>()
export const graphs = writable<GraphController[]>()
export const graph_options = writable<DropdownOption<GraphController>[]>()
export const links = writable<LinkController[]>()
export const lecture_options = writable<DropdownOption<LectureController>[]>()
