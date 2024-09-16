
// Internal imports
import { Course } from '$lib/scripts/entities'
import { course } from '$stores'

// Load
export const load = ({ data }) => {
	course.set(Course.revive(data.course))
}