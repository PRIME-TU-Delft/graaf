
// Internal dependencies
import { GraphHelper } from "$scripts/helpers"

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * Get the course of a graph
 * @returns `SerializedCourse`
 */

async function GET({ params }) {
	const course_id = Number(params.id)
	if (!course_id || isNaN(course_id)) {
		return new Response('Invalid course ID', { status: 400 })
	}

	return await GraphHelper.getCourse(course_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}