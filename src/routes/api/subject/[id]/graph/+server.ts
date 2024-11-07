
// Internal dependencies
import { SubjectHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * API endpoint for getting the Graph this Subject belongs to
 * @returns `SerializedGraph`
 */

async function GET({ params }) {

	const subject_id = Number(params.id)
	if (!subject_id || isNaN(subject_id)) {
		return new Response('Invalid subject ID', { status: 400 })
	}

	return await SubjectHelper.getGraph(subject_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}