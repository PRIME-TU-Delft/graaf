
// Internal dependencies
import { SubjectHelper } from '$scripts/helpers'
import { instanceOfSerializedSubject } from '$scripts/types'

// Exports
export { POST, PUT, GET }


// --------------------> API Endpoints


/**
 * API endpoint for creating a new Subject in the database.
 * @body `{ graph: number }`
 * @returns `SerializedSubject`
 */

async function POST({ request }) {
	
	// Retrieve data
	const { graph } = await request.json()
	if (!graph || isNaN(graph)) 
		return new Response('Failed to create Subject: missing Graph ID', { status: 400 })

	// Create graph
	return await SubjectHelper.create(graph)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for updating a Subject in the database.
 * @body `SerializedSubject`
 */

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!instanceOfSerializedSubject(data)) {
		return new Response('Invalid SerializedSubject', { status: 400 })
	}

	// Update subject
	return await SubjectHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for requesting Subjects in the database.
 * @returns `SerializedSubject[]` or `SerializedSubject` if a single ID is provided
 */

async function GET() {

	return await SubjectHelper.getAll()
		.then(
			subjects => new Response(JSON.stringify(subjects), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}