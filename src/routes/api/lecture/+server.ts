
// Internal dependencies
import { LectureHelper } from '$scripts/helpers'
import { instanceOfSerializedLecture } from '$scripts/types'

// Exports
export { POST, PUT, GET }


// --------------------> API Endpoints


/**
 * API endpoint for creating a new Lecture in the database.
 * @body `{ graph: number }`
 * @returns `SerializedLecture`
 */

async function POST({ request }) {
	
	// Retrieve data
	const { graph } = await request.json()
	if (!graph || isNaN(graph)) 
		return new Response('Missing graph id', { status: 400 })

	// Create graph
	return await LectureHelper.create(graph)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for updating a lecture in the database.
 * @body `SerializedLecture`
 */

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!instanceOfSerializedLecture(data)) {
		return new Response('Invalid SerializedLecture', { status: 400 })
	}

	// Update domain
	return await LectureHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for requesting all Lectures in the database.
 * @returns `SerializedLecture[]`
 */

async function GET() {
	return await LectureHelper.getAll()
		.then(
			graphs => new Response(JSON.stringify(graphs), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}