
// Internal dependencies
import {
    ControllerEnvironment,
    CourseController
} from '$scripts/controllers'

// Load
export async function load({ data }) {
    const environment = new ControllerEnvironment()
    const course = CourseController.revive(environment, data.course)

    return { environment, course }
}