
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { ProgramHelper, CourseHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async () => {

	// Get programs
	const programs = await ProgramHelper.getAll()
		.catch(error => Promise.reject(error))

	// Get courses
	const courses = await CourseHelper.getAll()
		.catch(error => Promise.reject(error))

	return { programs, courses }
}
