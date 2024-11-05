
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { cache, course, course_options, graph_options, graphs, links } from './stores'

import {
	ControllerCache,
	CourseController
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data, fetch }) => {
	const new_cache = new ControllerCache()
	cache.set(new_cache)

	course.set(CourseController.revive(new_cache, data.course))
	course.subscribe(course => course.getCourseOptions(fetch).then(course_options.set))
	course.subscribe(course => course.getGraphs(fetch).then(graphs.set))
	course.subscribe(course => course.getGraphOptions(fetch).then(graph_options.set))
	course.subscribe(course => course.getLinks(fetch).then(links.set))
}