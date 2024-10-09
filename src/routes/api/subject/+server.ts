
import { SubjectHelper } from '$scripts/helpers'

/**
 * API endpoint for creating a new Subject in the database.
 * @body `{ graph_id: number }`
 * @returns `SerializedSubject`
 */

export async function POST({ request }) {
	
	// Retrieve data
	const { graph_id } = await request.json()
	if (!graph_id || isNaN(graph_id)) 
		return new Response('Failed to create Subject: missing Graph ID', { status: 400 })

	// Create graph
	return await SubjectHelper.create(graph_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting Subjects from the database.
 * @body `{ ids: number[] }`
 */

export async function DELETE({ request }) {
	
	// Retrieve data
	const { ids } = await request.json()
	if (!ids) return new Response('Failed to remove Subjects: Missing IDs', { status: 400 })

	// Remove graphs
	return await SubjectHelper.remove(ids)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * An API endpoint for updating a Subject in the database.
 * @body `SerializedSubject`
 */

export async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()

	// Update subject
	return await SubjectHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}