
import { ProgramHelper } from '$scripts/helpers'

/**
 * API endpoint for creating a Program in the database.
 * @param POST request with JSON body { name: string }
 * @returns SerializedProgram
 */

export async function POST({ request }) {

	// Retrieve data
	const { name } = await request.json()
	if (!name) return new Response('Failed to create program: Missing name', { status: 400 })

	// Create the program
	return await ProgramHelper.create(name)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}