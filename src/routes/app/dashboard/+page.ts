
// Internal dependencies
import {
    ControllerEnvironment,
    ProgramController,
    CourseController
} from '$scripts/controllers'

// Load
export async function load({ data }) {
    const environment = new ControllerEnvironment()
	const programs = data.programs.map(datum => ProgramController.revive(environment, datum))
    const courses = data.courses.map(datum => CourseController.revive(environment, datum))

    return { environment, programs, courses }
}