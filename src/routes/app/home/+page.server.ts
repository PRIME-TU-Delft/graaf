
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { asyncFlatmap } from '$scripts/utility'
import { ProgramHelper, CourseHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async () => {

	// Get data from the database
	const programs = await ProgramHelper.getAll('courses', 'admins')

	// Start data streams
	const courses = CourseHelper.getAll()
		.catch(error => { throw new Error(error) })
	const admins = asyncFlatmap(programs, program => ProgramHelper.getAdmins(program.id))
		.catch(error => { throw new Error(error) })

	return { programs, courses, admins }
}
