
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { customError } from '$scripts/utility'

import {
	GraphHelper,
	LinkHelper
} from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {
	const course_code = params.course
	const link_name = params.link

	// Get data from the database
	const graph = await LinkHelper.getGraphFromCourseAndName(course_code, link_name, 'domains', 'subjects', 'lectures')

	// Start data streams
	const domains = GraphHelper.getDomains(graph.id, 'graph', 'parents', 'children', 'subjects')
		.catch(error => { throw customError('ServerError', error) })
	const subjects = GraphHelper.getSubjects(graph.id, 'graph', 'parents', 'children', 'domain', 'lectures')
		.catch(error => { throw customError('ServerError', error) })
	const lectures = GraphHelper.getLectures(graph.id, 'graph', 'subjects')
		.catch(error => { throw customError('ServerError', error) })

	return { graph, domains, subjects, lectures }
}
