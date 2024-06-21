
import { Course } from '$scripts/entities'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	return {
		course: Course.revive({code: 'CSE1200', name: 'Calculus', users: [{name: 'Bram Kreulen', permissions: 'admin'}]})
	}
}