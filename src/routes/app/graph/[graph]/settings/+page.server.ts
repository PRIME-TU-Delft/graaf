
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { GraphHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {

	// Validate graph ID
	const graph_id = Number(params.graph)
	if (isNaN(graph_id)) {
		return Promise.reject('Invalid graph ID')
	}

	// Get data
	const course = await GraphHelper.getCourse(graph_id)
	const graph = await GraphHelper.getById(graph_id)
	const domains = await GraphHelper.getDomains(graph_id)
	const subjects = await GraphHelper.getSubjects(graph_id)
	const lectures = await GraphHelper.getLectures(graph_id)

	return { course, graph, domains, subjects, lectures }
}
