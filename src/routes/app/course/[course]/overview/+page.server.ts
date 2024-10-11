
// Internal dependencies
import { CourseHelper } from '$scripts/helpers'

// Load
export async function load({ params }) {
	const course_id = Number(params.course)
	if (isNaN(course_id)) return Promise.reject('Invalid course ID')
	const course = await CourseHelper.getById(course_id)
		.catch(error => Promise.reject(error))
	
	return { course }
}
