
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { cache, course } from './stores'

import {
	ControllerCache,
	CourseController
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data, fetch }) => {
	const new_cache = new ControllerCache(fetch)
	course.set(CourseController.revive(new_cache, data.course))
	cache.set(new_cache)
}