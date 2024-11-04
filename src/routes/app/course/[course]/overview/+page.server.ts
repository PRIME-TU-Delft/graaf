
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { CourseHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {

	// Validate course ID
	const course_id = Number(params.course)
	if (isNaN(course_id)) {
		return Promise.reject('Invalid course ID')
	}

	// Get data
	const course = await CourseHelper.getById(course_id)
	const graphs = await CourseHelper.getGraphs(course_id)
	const links = await CourseHelper.getLinks(course_id)

	return { course, graphs, links }
}
