
// Internal dependencies
import { env } from '$env/dynamic/private'
import { LinkHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * API endpont for getting Graph belonging to target link
 * @returns `SerializedGraph`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/link/[id]/graph')

	const link_id = Number(params.id)
	if (!link_id || isNaN(link_id)) {
		return new Response('Invalid link ID', { status: 400 })
	}

	return await LinkHelper.getGraph(link_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}