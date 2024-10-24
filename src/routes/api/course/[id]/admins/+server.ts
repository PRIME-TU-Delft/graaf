
// Internal dependencies
import { env } from '$env/dynamic/private'
import { CourseHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * Get all admins for a course
 * @returns `SerializedUser[]`
 */

async function GET({ params }) {
	if (env.DEBUG) console.log('\nGET /api/course/[id]/admins')

	// Retrieve course ID
	const course_id = Number(params.id)
	if (!course_id || isNaN(course_id)) {
		return new Response('Invalid program ID', { status: 400 })
	}

	// Get all admins for the course
	return await CourseHelper.getAdmins(course_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}