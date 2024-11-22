
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { asyncConcat } from '$scripts/utility'

import {
	CourseHelper,
	ProgramHelper,
	UserHelper
} from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {
	const course_id = Number(params.course)
	if (isNaN(course_id))
		return Promise.reject('Invalid course ID')

	// Start data streams
	const course = CourseHelper.getById(course_id, 'programs', 'graphs', 'links', 'editors', 'admins')
		.catch(error => { throw new Error(error) })
	const courses = asyncConcat(course, CourseHelper.getAll())
		.catch(error => { throw new Error(error) })
	const programs = ProgramHelper.getAll()
		.catch(error => { throw new Error(error) })
	const users = UserHelper.getAll()
		.catch(error => { throw new Error(error) })
	const graphs = CourseHelper.getGraphs(course_id)
		.catch(error => { throw new Error(error) })
	const links = CourseHelper.getLinks(course_id)
		.catch(error => { throw new Error(error) })

	return { programs, courses, course, users, graphs, links }
}
