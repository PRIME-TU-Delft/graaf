
// Internal dependencies
import { ProgramHelper } from '$scripts/helpers'
import { instanceOfSerializedProgram } from '$scripts/types'

// Exports
export { POST, PUT, GET }


// --------------------> API Endpoints


/**
 * API endpoint for creating a Program in the database.
 * @body `{ name: string }`
 * @returns `SerializedProgram`
 */

async function POST({ request }) {

	// Retrieve data
	const { name } = await request.json()
	if (!name) return new Response('Missing name', { status: 400 })

	// Create the program
	return await ProgramHelper.create(name)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for updating a Program in the database.
 * @body `SerializedProgram`
 */

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!instanceOfSerializedProgram(data)) {
		return new Response('Invalid SerializedProgram', { status: 400 })
	}

	// Update program
	return await ProgramHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for requesting all Programs in the database.
 * @returns `SerializedProgram[]`
 */

async function GET() {

	return await ProgramHelper.getAll()
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}