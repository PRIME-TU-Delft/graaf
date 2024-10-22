
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { ControllerCache, CourseController } from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const cache = new ControllerCache()
	const course = CourseController.revive(cache, data.course)

	return { cache, course }
}