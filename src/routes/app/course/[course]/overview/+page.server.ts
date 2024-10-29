
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { CourseHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {

	// Get course
	const course_id = Number(params.course)
	if (isNaN(course_id)) return Promise.reject('Invalid course ID')
	const course = await CourseHelper.getById(course_id)
		.catch(error => Promise.reject(error))

	// Get graphs
	const graphs = await CourseHelper.getGraphs(course_id)
		.catch(error => Promise.reject(error))

	// Get links
	const links = await CourseHelper.getLinks(course_id)
		.catch(error => Promise.reject(error))

	return { course, graphs, links }
}
