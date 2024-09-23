
import { SubjectHelper } from '$lib/server/helpers'

/**
 * API endpoint for creating a Subject object in the database.
 * @param id ID of the Graph object to which the Subject object belongs
 * @returns ID of the created Subject object
 */

export async function POST({ params }) {
	const id = Number(params.id)
	const data = { id: await SubjectHelper.create(id) }

	return new Response(JSON.stringify(data), { status: 201 })
}