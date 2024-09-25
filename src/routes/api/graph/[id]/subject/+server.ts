
import { SubjectHelper } from '$lib/server/helpers'

/**
 * API endpoint for creating a Subject object in the database.
 * @param id ID of the Graph object to which the Subject object belongs
 * @returns Serialized Subject object
 */

export async function POST({ params }) {
	const id = Number(params.id)
	const data = await SubjectHelper.create(id)
		.catch(() => new Response('Failed to create subject', { status: 400 }))

	return new Response(JSON.stringify(data), { status: 201 })
}