
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { course, courses } from './stores'

import {
	ControllerCache,
	CourseController,
	GraphController,
	LinkController
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const cache = new ControllerCache()

	// Revive controllers into stores
	course.set(CourseController.revive(cache, data.course))
	courses.set(data.courses.map(course => CourseController.revive(cache, course)))

	// Revive controllers into cache
	data.graphs.forEach(graph => GraphController.revive(cache, graph))
	data.links.forEach(link => LinkController.revive(cache, link))
	data.lectures.forEach(lecture => GraphController.revive(cache, lecture))
}