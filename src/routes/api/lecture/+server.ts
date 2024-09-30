
import { LectureHelper } from '$scripts/helpers'

/**
 * An API endpoint for updating a Lecture object in the database.
 * @param request PUT request containing a SerializedLecture object
 */

export async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()

	// Update domain
	return await LectureHelper.update(data)
		.then(
			() => new Response('Lecture updated', { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}