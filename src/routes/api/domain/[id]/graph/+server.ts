
// Internal dependencies
import { env } from '$env/dynamic/private'
import { DomainHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * API endpoint for getting the Graph this Domain belongs to
 * @returns `SerializedGraph`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/domain/[id]/graph')

	// Get the domain ID
	const domain_id = Number(params.id)
	if (!domain_id || isNaN(domain_id)) {
		return new Response('Invalid domain ID', { status: 400 })
	}

	// Get the graph this domain belongs to
	return await DomainHelper.getGraph(domain_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}