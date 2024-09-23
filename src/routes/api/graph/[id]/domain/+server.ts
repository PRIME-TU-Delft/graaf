
import { DomainHelper } from '$lib/server/helpers'

/**
 * API endpoint for creating a Domain object in the database.
 * @param id ID of the Graph object to which the Domain object belongs
 * @returns ID of the created Domain object
 */

export async function POST({ params }) {
	const id = Number(params.id)
	const data = { id: await DomainHelper.create(id) }

	return new Response(JSON.stringify(data), { status: 201 })
}