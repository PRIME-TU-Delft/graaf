
// Internal dependencies
import { LinkHelper } from "$scripts/helpers"

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * API endpoint for getting Course target link belongs to
 * @returns `SerializedCourse`
 */

async function GET({ params }) {
	const link_id = Number(params.id)
	if (!link_id || isNaN(link_id)) {
		return new Response('Invalid link ID', { status: 400 })
	}

	return await LinkHelper.getCourse(link_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}