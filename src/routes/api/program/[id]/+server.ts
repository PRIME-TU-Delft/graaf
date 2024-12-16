// Internal dependencies
import { ProgramHelper } from '$scripts/helpers';

// Exports
export { DELETE };

// --------------------> API Endpoints

async function DELETE({ params }) {
	// Retrieve data
	const program_id = Number(params.id);
	if (isNaN(program_id)) {
		return new Response('Missing program ID', { status: 400 });
	}

	// Delete the program
	return await ProgramHelper.remove(program_id).then(
		() => new Response(null, { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}
