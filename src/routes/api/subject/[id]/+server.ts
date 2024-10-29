
// Internal dependencies
import { env } from '$env/dynamic/private'
import { SubjectHelper } from '$scripts/helpers'

// Exports
export { GET, DELETE }


// --------------------> API Endpoints


/**
 * API endpoint for fetching a Subject from the database.
 * @returns `SerializedSubject`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/subject')

	// Retrieve data
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Delete the subject
	return await SubjectHelper.getById(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting a Subject from the database.
 */

async function DELETE({ params }) {
	if (env.DEBUG) console.log('\nDELETE /api/subject')

	// Retrieve data
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Delete the subject
	return await SubjectHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}