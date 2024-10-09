
import { GraphHelper } from '$scripts/helpers'
import type { SerializedGraph } from '$scripts/types'

/**
 * API endpoint for creating a new Graph in the database.
 * @body `{ course_id: number, name: string }`
 * @returns `SerializedGraph`
 */

export async function POST({ request }) {
	
	// Retrieve data
	const { course_id, name } = await request.json()
	if (!course_id || isNaN(course_id) || !name) 
		return new Response('Failed to create graph: Missing course or name', { status: 400 })

	// Create graph
	return await GraphHelper.create(course_id, name)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting Graphs from the database.
 * @body `{ ids: number[] }`
 */

export async function DELETE({ request }) {
	
	// Retrieve data
	const { ids } = await request.json()
	if (!ids) return new Response('Failed to remove graph: Missing IDs', { status: 400 })

	// Remove graphs
	return await GraphHelper.remove(ids)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

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

/**
 * API endpoint for requesting Graphs in the database.
 * @body `{ ids: number[] }` If not provided, all graphs are returned
 * @returns `SerializedGraph[]` or `SerializedGraph` if a single ID is provided
 */

export async function GET({ request }) {

	// Retrieve data
	const { ids } = await request.json()

	// Retrieve graphs by ID
	if (ids) {
		return await GraphHelper.getById(...ids)
			.then(
				graphs => new Response(JSON.stringify(graphs), { status: 200 }),
				error => new Response(error, { status: 400 })
			)
	}

	// Retrieve all programs
	else {
		return await GraphHelper.getAll()
			.then(
				graphs => new Response(JSON.stringify(graphs), { status: 200 }),
				error => new Response(error, { status: 400 })
			)
	}
}