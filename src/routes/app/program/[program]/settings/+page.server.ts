
// External dependencies
import type { PageServerLoad } from './$types'

import { 
	CourseHelper,
	ProgramHelper, 
	UserHelper 
} from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {
	const program_id = Number(params.program)
	if (isNaN(program_id))
		return Promise.reject('Invalid program ID')
	
	// Get data from the database
	const program = await ProgramHelper.getById(program_id, 'courses', 'editors', 'admins')
	const courses = await CourseHelper.getAll() // For adding courses
	const users = await UserHelper.getAll() // For adding users

	return { program, courses, users }
}
