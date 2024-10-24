
// Internal dependencies
import { env } from '$env/dynamic/private'
import { CourseHelper } from '$scripts/helpers'

// Exports
export { GET, DELETE }


// --------------------> API Endpoints


/**
 * API endpoint for fetching a Course from the database.
 * @returns `SerializedCourse`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/course/[id]')

	// Retrieve course ID
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Get the course
	return await CourseHelper.getById(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting a Course from the database.
 */

async function DELETE({ params }) {
	if (env.DEBUG) console.log('\nDELETE /api/course/[id]')

	// Retrieve course ID
	const id = Number(params.id)
	if (!id || isNaN(id)) {
		return new Response('Missing ID', { status: 400 })
	}

	// Delete the course
	return await CourseHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}