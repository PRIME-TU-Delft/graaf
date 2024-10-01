
import { CourseHelper } from '$scripts/helpers'
import type { SerializedCourse } from '$scripts/types'

/**
 * API endpoint for updating a Course in the database.
 * @param request PUT request containing a SerializedCourse
 */

export async function PUT({ request }) {

	// Retrieve data
	const data: SerializedCourse = await request.json()

	// Update course
	return await CourseHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for requesting all Courses in the database.
 * @returns Array of SerializedCourses
 */

export async function GET() {
	
	// Retrieve courses
	return await CourseHelper.getAll()
		.then(
			courses => new Response(JSON.stringify(courses), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}