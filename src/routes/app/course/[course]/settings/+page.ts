
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { 
	ControllerCache, 
	CourseController, 
	ProgramController 
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const cache = new ControllerCache()
	const course = CourseController.revive(cache, data.course)
	const programs = data.programs.map(program => ProgramController.revive(cache, program))

	return { course, programs }
}