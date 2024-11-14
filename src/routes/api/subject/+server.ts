
// Internal dependencies
import { SubjectHelper } from '$scripts/helpers'
import { validSerializedSubject } from '$scripts/types'

// Exports
export { POST, PUT }


// --------------------> API Endpoints


async function POST({ request }) {
	
	// Retrieve data
	const { graph_id } = await request.json()
	if (!graph_id || isNaN(graph_id)) {
		return new Response('Missing graph ID', { status: 400 })
	}

	// Create graph
	return await SubjectHelper.create(graph_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!validSerializedSubject(data)) {
		return new Response('Invalid SerializedSubject', { status: 400 })
	}

	// Update subject
	return await SubjectHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}