
// Internal imports
import { CourseHelper } from '$scripts/helpers'
import type { SerializedCourse } from '$scripts/types'

// Load
export async function load({ params }) {

	// Retrieve data
	const course_id = Number(params.course)
	if (isNaN(course_id)) return Promise.reject('Invalid course ID')
	const course = await CourseHelper.getById(course_id)
		.catch(error => Promise.reject(error)) as SerializedCourse
	
	return { course }
}
