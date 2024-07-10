
// Internal imports
import { Course, Graph } from '$lib/scripts/entities'
import { course, graph } from '$stores'

// Load
export const load = ({ data }) => {
    course.set(Course.revive(data.course))
	graph.set(Graph.revive(data.graph))
}