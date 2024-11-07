
// Internal dependencies
import { LectureHelper } from '$scripts/helpers'

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * API endpoint for getting the Subjects of a Lecture
 * @returns `SerializedSubject[]`
 */

async function GET({ params }) {

	const lecture_id = Number(params.id)
	if (!lecture_id || isNaN(lecture_id)) {
		return new Response('Invalid lecture ID', { status: 400 })
	}

	return await LectureHelper.getSubjects(lecture_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}