
import { DomainHelper } from '$lib/server/helpers'

/**
 * API endpoint for creating a Domain object in the database.
 * @param id ID of the Graph object to which the Domain object belongs
 * @returns Serialized Domain object
 */

export async function POST({ params }) {
	const id = Number(params.id)
	const data = await DomainHelper.create(id)
		.catch(() => new Response('Failed to create domain', { status: 400 }))

	return new Response(JSON.stringify(data), { status: 201 })
}