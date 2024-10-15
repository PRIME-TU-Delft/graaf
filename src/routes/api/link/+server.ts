
// Internal dependencies
import { LinkHelper } from '$scripts/helpers'
import { instanceOfSerializedLink } from '$scripts/types'

// Exports
export { POST, PUT, GET }


// --------------------> API Endpoints


/**
 * API endpoint for creating a new Link in the database.
 * @body `{ course: number, graph: number, name: string }`
 * @returns `SerializedLink`
 */

async function POST({ request }) {

	// Retrieve data
	const { course, graph, name } = await request.json()
	if (!course || !name || isNaN(course)) 
        return new Response('Missing COURSE or name', { status: 400 })

	// Create Link
	return await LinkHelper.create(course, graph, name)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for updating a Link in the database.
 * @body `SerializedLink`
 */

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!instanceOfSerializedLink(data)) {
		return new Response('Invalid SerializedLink', { status: 400 })
	}

	// Update Link
	return await LinkHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for requesting all Links in the database.
 * @returns `SerializedLinks[]`
 */

async function GET() {
	return await LinkHelper.getAll()
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}