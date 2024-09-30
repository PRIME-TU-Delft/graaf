
import { DomainHelper } from '$scripts/helpers'

/**
 * API endpoint for creating a Domain in the database.
 * @returns Serialized Domain
 */

export async function POST({ params }) {
	if (!params.id || isNaN(Number(params.id)) )
		return new Response('Failed to create domain: Invalid graph ID', { status: 400 })
	const id = Number(params.id)

	return await DomainHelper.create(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 201 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for retrieving all Domains associated with a Graph.
 * @returns Array of SerializedDomains
 */

export async function GET({ params }) {
	if (!params.id || isNaN(Number(params.id)))
		return new Response('Failed to get domains: Invalid graph ID', { status: 400 })
	const id = Number(params.id)

	return await DomainHelper.getByGraphId(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}