
import type { PageServerLoad } from './$types'

// Internal imports
import { CourseHelper, GraphHelper } from '$lib/server/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {

	// Get course
	const course_id = Number(params.course)
	if (isNaN(course_id)) return Promise.reject('Invalid course ID')
	const course = await CourseHelper.getById(course_id)
		.catch(() => Promise.reject('Course not found'))

	// Get graph
	const graph_id = Number(params.graph)
	if (isNaN(graph_id)) return Promise.reject('Invalid graph ID')
	const graph = await GraphHelper.getById(graph_id)
		.catch(() => Promise.reject('Graph not found'))

	return { course, graph }
}
