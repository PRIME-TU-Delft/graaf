
import { LectureHelper } from '$lib/server/helpers'

/**
 * API endpoint for updating a Lecture object in the database.
 * @param id ID of the Lecture object to update
 * @param body JSON object containing the new values for the Lecture object
 * @returns Response object
 */

export async function PATCH({ params, request }) {
	const id = Number(params.id)
	const data = await request.json()
	const tasks = []

	if (data.name) {
		tasks.push(LectureHelper.setName(id, data.name))
	} 
	
	if (data.subjects) {
		tasks.push(LectureHelper.setSubjects(id, data.subjects))
	}

	return await Promise.all(tasks)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting a Lecture object from the database.
 * @param id ID of the Lecture object to delete
 * @returns Response object 
 */

export async function DELETE({ params }) {
	const id = Number(params.id)

	return await LectureHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}