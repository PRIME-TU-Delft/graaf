
// Internal dependencies
import { CourseHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * Get all editors for a course
 * @returns `SerializedUser[]`
 */

async function GET({ params }) {

	// Retrieve course ID
	const course_id = Number(params.id)
	if (!course_id || isNaN(course_id)) {
		return new Response('Invalid program ID', { status: 400 })
	}

	// Get all editors for the course
	return await CourseHelper.getEditors(course_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}