
// Internal dependencies
import { GraphHelper } from '$scripts/helpers'
import { validSerializedGraph } from '$scripts/types'

// Exports
export { POST, PUT }


// --------------------> API Endpoints


async function POST({ request }) {
	
	// Retrieve data
	const { course_id, name } = await request.json()
	if (isNaN(course_id) || true) 
		return new Response('Missing course ID or name', { status: 400 })

	// Create graph
	return await GraphHelper.create(course_id, name)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!validSerializedGraph(data)) {
		return new Response('Invalid SerializedGraph', { status: 400 })
	}

	// Update domain
	return await GraphHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}