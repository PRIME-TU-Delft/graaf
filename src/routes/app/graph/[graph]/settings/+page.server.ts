
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { GraphHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {

	// Get graphs
	const graph_id = Number(params.graph)
	if (isNaN(graph_id)) return Promise.reject('Invalid graph ID')
	const graph = await GraphHelper.getById(graph_id)
		.catch(error => Promise.reject(error))

	// Get course
	const course = await GraphHelper.getCourse(graph_id)
		.catch(error => Promise.reject(error))

	return { course, graph }
}
