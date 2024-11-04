
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { cache, course, graphs, links } from './stores'

import {
	ControllerCache,
	CourseController,
	GraphController,
	LinkController
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const new_cache = new ControllerCache()
	course.set(CourseController.revive(new_cache, data.course))
	graphs.set(data.graphs.map(graph => GraphController.revive(new_cache, graph)))
	links.set(data.links.map(link => LinkController.revive(new_cache, link)))
	cache.set(new_cache)
}