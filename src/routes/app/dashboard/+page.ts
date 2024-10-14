
// Internal dependencies
import { ControllerEnvironment} from '$scripts/controllers'

// Load
export async function load({ data }) {
    const environment = new ControllerEnvironment()
	const programs = data.programs.map(program => environment.get(program))
    const courses = data.courses.map(course => environment.get(course))

    return { environment, programs, courses }
}