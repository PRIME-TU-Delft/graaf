
// External dependencies
import { writable } from 'svelte/store'

// Internal dependencies
import type {
	ControllerCache,
	CourseController,
	GraphController,
	DomainController,
	SubjectController,
	LectureController
} from '$scripts/controllers'

// Exports
export const cache = writable<ControllerCache>()
export const course = writable<CourseController>()
export const graph = writable<GraphController>()
export const domains = writable<DomainController[]>()
export const subjects = writable<SubjectController[]>()
export const lectures = writable<LectureController[]>()

