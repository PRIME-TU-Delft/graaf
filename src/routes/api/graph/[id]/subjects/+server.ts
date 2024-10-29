
// Internal dependencies
import { env } from '$env/dynamic/private'
import { GraphHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * API endpoint for getting all Subjects belonging to target graph
 * @returns `SerializedSubject[]`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/graph/[id]/subjects')

	const graph_id = Number(params.id)
	if (!graph_id || isNaN(graph_id)) {
		return new Response('Invalid graph ID', { status: 400 })
	}

	return await GraphHelper.getSubjects(graph_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}