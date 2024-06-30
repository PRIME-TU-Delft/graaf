
import { Course, Graph } from '$scripts/entities'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	return {
		course: Course.revive({code: 'CSE1200', name: 'Calculus', users: [{name: 'Bram Kreulen', permissions: 'admin'}]}),
		graph: Graph.revive({
			id: 0,
			name: 'Graph',
			domains: [],
			subjects: [],
			lectures: []
		})
	}
}