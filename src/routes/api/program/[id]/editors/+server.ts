
// Internal dependencies
import { ProgramHelper } from "$scripts/helpers"

// Exports
export { GET }

// --------------------> API Endpoints


/**
 * Get all editors for a program
 * @returns `SerializedUser[]`
 */

async function GET({ params }) {
	const program_id = Number(params.id)
	if (!program_id || isNaN(program_id)) {
		return new Response('Invalid program ID', { status: 400 })
	}

	return await ProgramHelper.getEditors(program_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}