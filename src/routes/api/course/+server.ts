
// Internal dependencies
import { CourseHelper } from '$scripts/helpers'
import { instanceOfSerializedCourse } from '$scripts/types'

// Exports
export { POST, PUT, GET }

// --------------------> API Endpoints


/**
 * API endpoint for creating a new Course in the database.
 * @body `{ code: string, name: string }`
 * @returns `SerializedCourse`
 */

async function POST({ request }) {

	// Retrieve data
	const { code, name } = await request.json()
	if (!code || !name) return new Response('Missing code or name', { status: 400 })

	// Create course
	return await CourseHelper.create(code, name)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for updating a Course in the database.
 * @body `SerializedCourse`
 */

async function PUT({ request }) {

	// Retrieve data
	const data = await request.json()
	if (!instanceOfSerializedCourse(data)) {
		return new Response('Invalid SerializedCourse', { status: 400 })
	}

	// Update course
	return await CourseHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for requesting all Courses in the database.
 * @returns `SerializedCourses[]`
 */

async function GET() {
	return await CourseHelper.getAll()
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}