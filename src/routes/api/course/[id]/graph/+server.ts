
import { GraphHelper } from '$scripts/helpers'

/**
 * API endpoint for requesting all Graphs from the database related to this course.
 * @returns Array of SerializedGraph
 */

export async function GET({ params }) {
	if (!params.id || isNaN(Number(params.id)))
		return new Response('Failed to get graphs: Invalid course ID', { status: 400 })
	const id = Number(params.id)

	// Update domain
	return await GraphHelper.getByCourseId(id)
		.then(
			graphs => new Response(JSON.stringify(graphs), { status: 200 }),
			error => new Response(error, { status: 500 })
		)
}