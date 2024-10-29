
// Internal dependencies
import { env } from '$env/dynamic/private'
import { DomainHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * API endpoint for getting the children of a Domain
 * @returns `SerializedDomain[]`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/domain/[id]/children')

	// Get the domain ID
	const domain_id = Number(params.id)
	if (!domain_id || isNaN(domain_id)) {
		return new Response('Invalid domain ID', { status: 400 })
	}

	// Get all children of the domain
	return await DomainHelper.getChildren(domain_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}