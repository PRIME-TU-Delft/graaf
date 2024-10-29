
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { 
	ControllerCache, 
	CourseController, 
	GraphController, 
	LinkController 
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const cache = new ControllerCache()
	const course = CourseController.revive(cache, data.course)
	const graphs = data.graphs.map(graph => GraphController.revive(cache, graph))
	const links = data.links.map(link => LinkController.revive(cache, link))

	return { cache, course, graphs, links }
}