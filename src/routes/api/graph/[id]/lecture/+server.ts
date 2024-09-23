
import { LectureHelper } from '$lib/server/helpers'

/**
 * API endpoint for creating a Lecture object in the database.
 * @param id ID of the Graph object to which the Lecture object belongs
 * @returns ID of the created Lecture object
 */

export async function POST({ params }) {
	const id = Number(params.id)
	const data = { id: await LectureHelper.create(id) }

	return new Response(JSON.stringify(data), { status: 201 })
}