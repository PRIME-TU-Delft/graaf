
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { cache, programs, courses } from './stores'

import {
	ControllerCache,
	ProgramController,
	CourseController
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const new_cache = new ControllerCache()
	programs.set(data.programs.map(program => ProgramController.revive(new_cache, program)))
	courses.set(data.courses.map(course => CourseController.revive(new_cache, course)))
	cache.set(new_cache)
}