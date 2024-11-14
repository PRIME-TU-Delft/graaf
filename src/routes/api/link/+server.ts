
// Internal dependencies
import { LinkHelper } from '$scripts/helpers'
import { validSerializedLink } from '$scripts/types'

// Exports
export { POST, PUT }


// --------------------> API Endpoints


async function POST({ request }) {

	// Retrieve data
	const { course_id } = await request.json()
	if (!course_id || isNaN(course_id)) 
        return new Response('Missing course ID', { status: 400 })

	// Create Link
	return await LinkHelper.create(course_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!validSerializedLink(data)) {
		return new Response('Invalid SerializedLink', { status: 400 })
	}

	// Update Link
	return await LinkHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}
