
// Internal dependencies
import { env } from '$env/dynamic/private'
import { CourseHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * Get all links for a course
 * @returns `SerializedLink[]`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/course/[id]/links')

	// Retrieve course ID
	const course_id = Number(params.id)
	if (!course_id || isNaN(course_id)) {
		return new Response('Invalid program ID', { status: 400 })
	}

	// Get all links for the course
	return await CourseHelper.getLinks(course_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}