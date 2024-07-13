
import { CourseController } from '$lib/server/controllers'

export async function load({ params }) {
	const course = await CourseController.getCourseByCode(params.course)
	return { course }
}
