
// Internal dependencies
import { CourseHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * Get all programs for a course
 * @returns `SerializedProgram[]`
 */

async function GET({ params }) {

	// Retrieve course ID
	const course_id = Number(params.id)
	if (!course_id || isNaN(course_id)) {
		return new Response('Invalid program ID', { status: 400 })
	}

	// Get all programs for the course
	return await CourseHelper.getPrograms(course_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}