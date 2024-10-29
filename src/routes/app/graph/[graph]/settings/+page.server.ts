
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { CourseHelper, GraphHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {

	// Get course
	const course_id = Number(params.course)
	if (isNaN(course_id)) return Promise.reject('Invalid course ID')
	const course = await CourseHelper.getById(course_id)
		.catch(error => Promise.reject(error))

	// Get graph
	const graph_id = Number(params.graph)
	if (isNaN(graph_id)) return Promise.reject('Invalid graph ID')
	const graph = await GraphHelper.getById(graph_id)
		.catch(error => Promise.reject(error))

	return { course, graph }
}
