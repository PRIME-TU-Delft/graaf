
import { LectureHelper } from '$lib/server/helpers'

/**
 * API endpoint for deleting a Lecture object from the database.
 */

export async function DELETE({ params }) {
	const id = Number(params.id)

	return await LectureHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}