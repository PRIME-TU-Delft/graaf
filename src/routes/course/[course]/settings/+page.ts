
import { Course } from '$scripts/entities'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	return {
		course: Course.revive({})
	}
}