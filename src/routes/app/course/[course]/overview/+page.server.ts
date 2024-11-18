
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
	const graphs = await CourseHelper.getGraphs(course_id, 'course', 'links', 'domains', 'subjects', 'lectures')

	// Start data streams
	const course = CourseHelper.getById(course_id, 'graphs', 'links')
		.catch(error => { throw new Error(error) })
	const links = CourseHelper.getLinks(course_id, 'course', 'graph')
		.catch(error => { throw new Error(error) })
	const domains = asyncFlatmap(graphs, graph => GraphHelper.getDomains(graph.id, 'parents', 'children'))
		.catch(error => { throw new Error(error) })
	const subjects = asyncFlatmap(graphs, graph => GraphHelper.getSubjects(graph.id, 'parents', 'children', 'domain'))
		.catch(error => { throw new Error(error) })
	const lectures = asyncFlatmap(graphs, graph => GraphHelper.getLectures(graph.id, 'subjects'))
		.catch(error => { throw new Error(error) })
	const courses = asyncConcat(course, CourseHelper.getAll())
		.catch(error => { throw new Error(error) })

	return { course, courses, graphs, links, domains, subjects, lectures }
}
