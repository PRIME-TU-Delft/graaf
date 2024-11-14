
// Internal dependencies
import { LectureHelper } from '$scripts/helpers'
import { validSerializedLecture } from '$scripts/types'

// Exports
export { POST, PUT }


// --------------------> API Endpoints


async function POST({ request }) {
	
	// Retrieve data
	const { graph_id } = await request.json()
	if (!graph_id || isNaN(graph_id)) 
		return new Response('Missing graph ID', { status: 400 })

	// Create graph
	return await LectureHelper.create(graph_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!validSerializedLecture(data)) {
		return new Response('Invalid SerializedLecture', { status: 400 })
	}

	// Update domain
	return await LectureHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}
