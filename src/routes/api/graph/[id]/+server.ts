
// Internal dependencies
import { env } from '$env/dynamic/private'
import { GraphHelper } from '$scripts/helpers'

// Exports
export { GET, DELETE }


// --------------------> API Endpoints


/**
 * API endpoint for fetching a Graph from the database.
 * @returns `SerializedGraph`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/graph/[id]')

	// Retrieve data
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Delete the graph
	return await GraphHelper.getById(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting a Graph from the database.
 */

async function DELETE({ params }) {
	if (env.DEBUG) console.log('\nDELETE /api/graph/[id]')

	// Retrieve data
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Delete the graph
	return await GraphHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}