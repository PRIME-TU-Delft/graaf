
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { program } from './stores'

import {
	ControllerCache,
	ProgramController,
	CourseController
} from '$scripts/controllers'
import { UserController } from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const cache = new ControllerCache()

	// Revive controllers into stores
	program.set(ProgramController.revive(cache, data.program))

	// Revive controllers into cache
	data.courses.forEach(course => CourseController.revive(cache, course))
	data.users.forEach(user => UserController.revive(cache, user))
}