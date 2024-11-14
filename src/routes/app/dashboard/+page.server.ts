
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { asyncFlatmap } from '$scripts/utility'
import { ProgramHelper, CourseHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async () => {

	// Get data from the database
	const programs = await ProgramHelper.getAll('courses', 'admins')
	const courses = await CourseHelper.getAll()
	const admins = await asyncFlatmap(programs, program => ProgramHelper.getAdmins(program.id))

	return { programs, courses, admins }
}
