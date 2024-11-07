
// Internal dependencies
import { GraphHelper } from '$scripts/helpers'
import { instanceOfSerializedGraph } from '$scripts/types'

// Exports
export { POST, PUT, GET }


// --------------------> API Endpoints


/**
 * API endpoint for creating a new Graph in the database.
 * @body `{ course: number, name: string }`
 * @returns `SerializedGraph`
 */

async function POST({ request }) {
	
	// Retrieve data
	const { course, name } = await request.json()
	if (!course || !name || isNaN(course)) 
		return new Response('Missing course or name', { status: 400 })

	// Create graph
	return await GraphHelper.create(course, name)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for updating a Graph in the database.
 * @body `SerializedGraph`
 */

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!instanceOfSerializedGraph(data)) {
		return new Response('Invalid SerializedGraph', { status: 400 })
	}

	// Update domain
	return await GraphHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for requesting Graphs in the database.
 * @returns `SerializedGraph[]` or `SerializedGraph` if a single ID is provided
 */

async function GET() {

	return await GraphHelper.getAll()
		.then(
			graphs => new Response(JSON.stringify(graphs), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}