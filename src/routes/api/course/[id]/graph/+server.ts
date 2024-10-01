
import { GraphHelper } from '$scripts/helpers'

/**
 * API endpoint for creating a Graph in the database.
 * @params POST request with JSON body { name: string }
 * @returns SerializedGraph
 */

export async function POST({ request, params }) {
	// Retrieve data
	if (!params.id || isNaN(Number(params.id)))
		return new Response('Failed to create graph: Invalid course ID', { status: 400 })
	const course_id = Number(params.id)

	const { name } = await request.json()
	if (!name) return new Response('Failed to create graph: Missing name', { status: 400 })

	// Create the graph
	return await GraphHelper.create(course_id, name)
		.then(
			data => new Response(JSON.stringify(data), { status: 201 }),
			error => new Response(error, { status: 400 })
		)
}

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