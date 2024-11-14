
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { programs, courses } from './stores'

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
	programs.set(data.programs.map(program => ProgramController.revive(cache, program)))
	courses.set(data.courses.map(course => CourseController.revive(cache, course)))

	// Revive controllers into cache
	data.admins.forEach(admin => UserController.revive(cache, admin))

	return { cache }
}