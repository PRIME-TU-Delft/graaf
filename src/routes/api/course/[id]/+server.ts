
import { CourseHelper } from '$lib/server/helpers'

/**
 * API endpoint for deleting a Subject from the database.
 */

export async function DELETE({ params }) {
	if (!params.id || isNaN(Number(params.id))) 
		return new Response('Failed to delete course: Invalid course ID', { status: 400 })
	const id = Number(params.id)

	return await CourseHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}