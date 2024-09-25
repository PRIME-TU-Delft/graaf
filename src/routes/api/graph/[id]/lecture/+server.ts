
import { LectureHelper } from '$lib/server/helpers'

/**
 * API endpoint for creating a Lecture object in the database.
 * @param id ID of the Graph object to which the Lecture object belongs
 * @returns Serialized Lecture object
 */

export async function POST({ params }) {
	const id = Number(params.id)
	const data = await LectureHelper.create(id)
		.catch(() => new Response('Failed to create lecture', { status: 400 }))

	return new Response(JSON.stringify(data), { status: 201 })
}