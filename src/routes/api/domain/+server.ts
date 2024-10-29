
// Internal dependencies
import { env } from '$env/dynamic/private'
import { DomainHelper } from '$scripts/helpers'
import { instanceOfSerializedDomain } from '$scripts/types'

// Exports
export { POST, PUT, GET }


// --------------------> API Endpoints


/**
 * API endpoint for creating a new Domain in the database.
 * @body `{ graph: number }`
 * @returns `SerializedDomain`
 */

async function POST({ request }) {
	if (env.DEBUG) console.log('\nPOST /api/domain')

	// Retrieve graph ID
	const { graph } = await request.json()
	if (!graph || isNaN(graph))
		return new Response('Failed to create Domain: missing Graph ID', { status: 400 })

	// Create graph
	return await DomainHelper.create(graph)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for updating a Domain in the database.
 * @body `SerializedDomain`
 */

async function PUT({ request }) {
	if (env.DEBUG) console.log('\nPUT /api/domain')

	// Retrieve data
	const data = await request.json()
	if (!instanceOfSerializedDomain(data)) {
		return new Response('Invalid SerializedDomain', { status: 400 })
	}

	// Update domain
	return await DomainHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for requesting Domains in the database.
 * @returns `SerializedDomain[]` or `SerializedDomain` if a single ID is provided
 */

async function GET() {
	if (env.DEBUG) console.log('\nGET /api/domain')

	// Get all domains
	return await DomainHelper.getAll()
		.then(
			domains => new Response(JSON.stringify(domains), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}