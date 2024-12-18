// Internal dependencies
import { ProgramHelper } from '$scripts/helpers';
import { validSerializedProgram } from '$scripts/types';

// Exports
export { POST, PUT };

// --------------------> API Endpoints

async function POST({ request }) {
	// Retrieve data
	const { name } = await request.json();
	if (!name) return new Response('Missing name', { status: 400 });

	// Create the program
	return await ProgramHelper.create(name).then(
		(data) => new Response(JSON.stringify(data), { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}

async function PUT({ request }) {
	// Retrieve data
	const data = await request.json();
	if (!validSerializedProgram(data)) {
		return new Response('Invalid SerializedProgram', { status: 400 });
	}

	// Update program
	return await ProgramHelper.update(data).then(
		() => new Response(null, { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}
