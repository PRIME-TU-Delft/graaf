
// Internal dependencies
import { env } from '$env/dynamic/private'
import { DomainHelper } from '$scripts/helpers'

// Exports
export { GET, DELETE }


// --------------------> API Endpoints


/**
 * API endpoint for fetching a Domain from the database.
 * @returns `SerializedDomain`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/domain/[id]')

	// Retrieve domain ID
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Delete the domain
	return await DomainHelper.getById(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting a Domain from the database.
 */

async function DELETE({ params }) {
	if (env.DEBUG) console.log('\nDELETE /api/domain/[id]')

	// Retrieve domain ID
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Delete the domain
	return await DomainHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}