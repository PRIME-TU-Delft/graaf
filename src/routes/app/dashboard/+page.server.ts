
// Internal dependencies
import { ProgramHelper, CourseHelper } from '$scripts/helpers'

// Load
export async function load() {
	const programs = await ProgramHelper.getAll()
		.catch(error => Promise.reject(error))
	const courses = await CourseHelper.getAll()
		.catch(error => Promise.reject(error))
	
	return { programs, courses }
}
