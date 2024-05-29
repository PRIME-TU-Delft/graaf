
import { Course, Graph } from '$scripts/entities'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	return {
		course: new Course(new Object()),
		graph: new Graph(new Object())
	}
}
