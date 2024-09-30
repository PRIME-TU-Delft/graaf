
// Internal imports
import { Course, Graph } from '$lib/scripts/entities'
import { course, graph } from '$stores'

// Load
export const load = async ({ data }) => {
	course.set(await Course.revive(data.course))
	graph.set(await Graph.revive(data.graph))
}