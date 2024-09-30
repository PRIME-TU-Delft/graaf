
import { LectureHelper } from '$scripts/helpers'

/**
 * API endpoint for creating a Lecture in the database.
 * @returns SerializedLecture
 */

export async function POST({ params }) {
	if (!params.id || isNaN(Number(params.id)))
		return new Response('Failed to create lecture: Invalid graph ID', { status: 400 })
	const id = Number(params.id)

	return await LectureHelper.create(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 201 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for retrieving all Lectures associated with a Graph.
 * @returns Array of SerializedLectures
 */

export async function GET({ params }) {
	if (!params.id || isNaN(Number(params.id)))
		return new Response('Failed to get lectures: Invalid graph ID', { status: 400 })
	const id = Number(params.id)

	return await LectureHelper.getByGraphId(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}