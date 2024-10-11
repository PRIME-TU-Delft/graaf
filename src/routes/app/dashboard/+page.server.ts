
// Internal imports
import { ProgramHelper, CourseHelper } from '$scripts/helpers'

// Load
export async function load() {
	const programs = await ProgramHelper.getAll()
	const courses = await CourseHelper.getAll()
	
	return { programs, courses }
}
