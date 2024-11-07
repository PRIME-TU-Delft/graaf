
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type { DropdownOption } from '$scripts/types'

import type {
	ControllerCache,
	CourseController,
	GraphController,
	LinkController
} from '$scripts/controllers'

// Exports
export const cache = writable<ControllerCache | undefined>()
export const course = writable<CourseController | undefined>()
export const course_options = writable<DropdownOption<CourseController>[] | undefined>()
export const graphs = writable<GraphController[] | undefined>()
export const graph_options = writable<DropdownOption<GraphController>[] | undefined>()
export const graphID_options = writable<DropdownOption<number>[] | undefined>()
export const links = writable<LinkController[] | undefined>()

course.subscribe(async course => course_options.set(await course?.getCourseOptions()))
course.subscribe(async course => graphs.set(await course?.getGraphs()))
course.subscribe(async course => graph_options.set(await course?.getGraphOptions()))
course.subscribe(async course => links.set(await course?.getLinks()))

graph_options.subscribe(options =>
	graphID_options.set(
		options?.map(option => ({
			value: option.value.id,
			label: option.label,
			validation: option.validation
		}))
	)
)