
import { DomainHelper } from '$scripts/helpers'

/**
 * API endpoint for creating a new Domain in the database.
 * @body `{ graph_id: number }`
 * @returns `SerializedDomain`
 */

export async function POST({ request }) {
	
	// Retrieve data
	const { graph_id } = await request.json()
	if (!graph_id || isNaN(graph_id)) 
		return new Response('Failed to create Domain: missing Graph ID', { status: 400 })

	// Create graph
	return await DomainHelper.create(graph_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting Domains from the database.
 * @body `{ ids: number[] }`
 */

export async function DELETE({ request }) {
	
	// Retrieve data
	const { ids } = await request.json()
	if (!ids) return new Response('Failed to remove Domains: Missing IDs', { status: 400 })

	// Remove graphs
	return await DomainHelper.remove(ids)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * An API endpoint for updating a Domain in the database.
 * @body `SerializedDomain`
 */

export async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()

	// Update domain
	return await DomainHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}