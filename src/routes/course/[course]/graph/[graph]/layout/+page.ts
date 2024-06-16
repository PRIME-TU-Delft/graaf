
import { Course, Graph } from '$scripts/entities'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	return {
		course: Course.load(new Object()),
		graph: Graph.create()
	}
}