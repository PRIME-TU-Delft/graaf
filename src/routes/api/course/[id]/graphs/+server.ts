
// Internal dependencies
import { env } from '$env/dynamic/private'
import { CourseHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * Get all graphs for a course
 * @returns `SerializedGraphs[]`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/course/[id]/graphs')

	// Retrieve course ID
	const course_id = Number(params.id)
	if (!course_id || isNaN(course_id)) {
		return new Response('Invalid program ID', { status: 400 })
	}

	// Get all graphs for the course
	return await CourseHelper.getGraphs(course_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}