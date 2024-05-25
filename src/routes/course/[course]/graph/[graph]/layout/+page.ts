
import { Course, Graph } from '$scripts/graph/entities'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	return {
		course: new Course(params.course),
		graph: new Graph(new Object())
	}
}