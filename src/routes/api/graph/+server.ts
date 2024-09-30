
import { GraphHelper } from '$lib/server/helpers'
import type { SerializedGraph } from '$scripts/entities/Graph.js'

/**
 * API endpoint for updating a Graph in the database.
 * @param request PUT request containing a SerializedGraph
 */

export async function PUT({ request }) {

	// Retrieve data
	const data: SerializedGraph = await request.json()

	// Update domain
	return await GraphHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}