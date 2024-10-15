
// Internal dependencies
import { ControllerCache, CourseController } from '$scripts/controllers'

// Load
export async function load({ data }) {
    const cache = new ControllerCache()
    const course = CourseController.revive(cache, data.course)

    return { cache, course }
}