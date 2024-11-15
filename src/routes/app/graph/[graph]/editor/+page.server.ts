
// External dependencies
import type { PageServerLoad } from './$types'

import { 
	GraphHelper
} from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {
	const graph_id = Number(params.graph)
	if (isNaN(graph_id))
		return Promise.reject('Invalid graph ID')
	
	// Start data streams
	const graph = GraphHelper.getById(graph_id, 'course', 'domains')
		.catch(error => { throw new Error(error) })
	const course = GraphHelper.getCourse(graph_id)
		.catch(error => { throw new Error(error) })

	return { graph, course }
}
