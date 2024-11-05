
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { CourseHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {
	const course_id = Number(params.course)
	if (isNaN(course_id)) {
		return Promise.reject('Invalid course ID')
	}
	
	return { 
		course: await CourseHelper.getById(course_id) 
	}
}
