
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import {
	ControllerCache,
	ProgramController,
	CourseController
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const cache = new ControllerCache()
	const programs = data.programs.map(program => ProgramController.revive(cache, program))
	const courses = data.courses.map(course => CourseController.revive(cache, course))

	return { cache, programs, courses }
}