
import { CourseHelper } from '$lib/server/helpers'
import type { SerializedCourse } from '$scripts/entities/Course.js'

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