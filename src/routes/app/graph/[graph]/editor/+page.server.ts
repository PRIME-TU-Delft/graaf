
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
	const graph = GraphHelper.getById(graph_id, 'course', 'domains', 'subjects', 'lectures')
		.catch(error => { throw customError('ServerError', error) })
	const course = GraphHelper.getCourse(graph_id)
		.catch(error => { throw customError('ServerError', error) })
	const domains = GraphHelper.getDomains(graph_id, 'graph', 'subjects', 'parents', 'children')
		.catch(error => { throw customError('ServerError', error) })
	const subjects = GraphHelper.getSubjects(graph_id, 'graph', 'domain', 'parents', 'children', 'lectures')
		.catch(error => { throw customError('ServerError', error) })
	const lectures = GraphHelper.getLectures(graph_id, 'graph', 'subjects')
		.catch(error => { throw customError('ServerError', error) })

	return { graph, course, domains, subjects, lectures }
}
