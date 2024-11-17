
// Internal dependencies
import { SubjectHelper } from '$scripts/helpers'


// --------------------> API Endpoints


export async function DELETE({ params }) {

	// Retrieve data
	const subject_id = Number(params.id)
	if (isNaN(subject_id)) {
		return new Response('Missing subject ID', { status: 400 })
	}

	// Delete the subject
	return await SubjectHelper.remove(subject_id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}