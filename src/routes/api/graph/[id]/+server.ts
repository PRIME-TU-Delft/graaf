
// Internal dependencies
import { GraphHelper } from '$scripts/helpers'

// Exports
export { DELETE }


// --------------------> API Endpoints


async function DELETE({ params }) {

	// Retrieve data
	const graph_id = Number(params.id)
	if (!graph_id || isNaN(graph_id)) {
		return new Response('Missing graph ID', { status: 400 })
	}

	// Delete the graph
	return await GraphHelper.remove(graph_id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}