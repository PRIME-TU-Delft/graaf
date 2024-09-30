
import { GraphHelper } from '$scripts/helpers'

/**
 * API endpoint for deleting a Graph from the database.
 */

export async function DELETE({ params }) {
	if (!params.id || isNaN(Number(params.id)))
		return new Response('Failed to delete graph: Invalid graph ID', { status: 400 })
	const id = Number(params.id)

	return await GraphHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}