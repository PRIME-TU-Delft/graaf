
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { asyncConcat, asyncFlatmap } from '$scripts/utility'
import { CourseHelper, GraphHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {
	const course_id = Number(params.course)
	if (isNaN(course_id))
		return Promise.reject('Invalid course ID')
	
	// Get data from the database
	const course = await CourseHelper.getById(course_id, 'graphs', 'links')
	const courses = await asyncConcat(course, CourseHelper.getAll())
	
	const graphs = await CourseHelper.getGraphs(course_id, 'links', 'lectures')
	const links = await CourseHelper.getLinks(course_id, 'course', 'graph')
	const lectures = await asyncFlatmap(graphs, graph => GraphHelper.getLectures(graph.id))


	return { course, courses, graphs, links, lectures }
}
