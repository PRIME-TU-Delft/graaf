
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { ProgramHelper, CourseHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async () => {

	// Get data
	const programs = await ProgramHelper.getAll()
	const courses = await CourseHelper.getAll()

	return { programs, courses }
}
