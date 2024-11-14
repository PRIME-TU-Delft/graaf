
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
	
	// Get data from the database
	const course = await CourseHelper.getById(course_id, 'programs', 'graphs', 'links', 'editors', 'admins')
	const courses = await asyncConcat(course, CourseHelper.getAll()) // For course validation
	const programs = await ProgramHelper.getAll() // For adding programs
	const users = await UserHelper.getAll() // For adding users

	return { programs, courses, course, users }
}
