
// Internal dependencies
import { LectureHelper } from '$scripts/helpers'

// Exports
export { DELETE }


// --------------------> API Endpoints


async function DELETE({ params }) {

	// Retrieve data
	const lecture_id = Number(params.id)
	if (!lecture_id || isNaN(lecture_id)) {
		return new Response('Missing lecture ID', { status: 400 })
	}

	// Delete the lecture
	return await LectureHelper.remove(lecture_id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}