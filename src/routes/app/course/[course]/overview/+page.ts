
// Internal dependencies
import { ControllerEnvironment } from '$scripts/controllers'

// Load
export async function load({ data }) {
    const environment = new ControllerEnvironment()
    const course = environment.get(data.course)

    return { environment, course }
}