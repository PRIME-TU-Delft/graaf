
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { customError } from '$scripts/utility'
import { 
	GraphHelper
} from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {
	const graph_id = Number(params.graph)
	if (isNaN(graph_id))
		return Promise.reject('Invalid graph ID')
	
	// Start data streams
	const graph = GraphHelper.getById(graph_id, 'course')
		.catch(error => { throw customError('ServerError', error) })
	const course = GraphHelper.getCourse(graph_id)
		.catch(error => { throw customError('ServerError', error) })

	return { graph, course }
}
