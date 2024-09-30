
// Internal imports
import { CourseController, GraphController } from '$scripts/controllers'
import { course, graph } from '$stores'

// Load
export const load = async ({ data }) => {
	course.set(await CourseController.revive(data.course))
	graph.set(await GraphController.revive(data.graph))
}