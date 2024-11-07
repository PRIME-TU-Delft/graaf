
// Internal dependencies
import { GraphHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * API endpoint for getting all Domains belonging to target graph
 * @returns `SerializedDomain[]`
 */

async function GET({ params }) {
	const graph_id = Number(params.id)
	if (!graph_id || isNaN(graph_id)) {
		return new Response('Invalid graph ID', { status: 400 })
	}

	return await GraphHelper.getDomains(graph_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}