
// Internal dependencies
import { CourseHelper } from '$scripts/helpers'

// Exports
export { DELETE }


// --------------------> API Endpoints


async function DELETE({ params }) {

	// Retrieve course ID
	const course_id = Number(params.id)
	if (!course_id || isNaN(course_id)) {
		return new Response('Missing course ID', { status: 400 })
	}

	// Delete the course
	return await CourseHelper.remove(course_id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}