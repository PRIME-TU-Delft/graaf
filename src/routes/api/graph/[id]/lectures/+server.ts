
// Internal dependencies
import { GraphHelper } from "$scripts/helpers"

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * Get all lectures for a graph
 * @returns `SerializedLecture[]`
 */

async function GET({ params }) {
	const lecture_id = Number(params.id)
	if (!lecture_id || isNaN(lecture_id)) {
		return new Response('Invalid lecture ID', { status: 400 })
	}

	return await GraphHelper.getLectures(lecture_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}