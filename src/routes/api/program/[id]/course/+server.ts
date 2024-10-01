
import { CourseHelper } from '$scripts/helpers'

/**
 * API endpoint for creating a Course in the database.
 * @returns SerializedCourse
 */

export async function POST({ request, params }) {
	
	// Retrieve data
	if (!params.id || isNaN(Number(params.id)) )
		return new Response('Failed to create domain: Invalid program ID', { status: 400 })
	const program_id = Number(params.id)

	const { code, name } = await request.json()
	if (!code || !name) return new Response('Failed to create course: Missing code or name', { status: 400 })

	// Create the course
	return await CourseHelper.create(program_id, code, name)
		.then(
			data => new Response(JSON.stringify(data), { status: 201 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for retrieving all Courses associated with a Program.
 * @returns Array of SerializedCourses
 */

export async function GET({ params }) {
	if (!params.id || isNaN(Number(params.id)))
		return new Response('Failed to get courses: Invalid program ID', { status: 400 })
	const id = Number(params.id)

	return await CourseHelper.getByProgramId(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}