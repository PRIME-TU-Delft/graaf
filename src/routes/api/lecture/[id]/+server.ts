
// Internal dependencies
import { LectureHelper } from '$scripts/helpers'

// Exports
export { GET, DELETE }


// --------------------> API Endpoints


/**
 * API endpoint for fetching a Lecture from the database.
 * @returns `SerializedLecture`
 */

async function GET({ params }) {

	// Retrieve data
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Delete the lecture
	return await LectureHelper.getById(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting a Lecture from the database.
 */

async function DELETE({ params }) {
	if (env.DEBUG) conole.log('\nDELETE /api/lecture/[id]')

	// Retrieve data
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Delete the lecture
	return await LectureHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}