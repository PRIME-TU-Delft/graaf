
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { course } from './stores'

import {
	ControllerCache,
	ProgramController,
	CourseController,
	UserController
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const cache = new ControllerCache()

	// Revive controllers into stores
	course.set(CourseController.revive(cache, data.course))

	// Revive controllers into cache
	data.programs.forEach(program => ProgramController.revive(cache, program))
	data.users.forEach(user => UserController.revive(cache, user))
	data.courses.forEach(course => CourseController.revive(cache, course))
}