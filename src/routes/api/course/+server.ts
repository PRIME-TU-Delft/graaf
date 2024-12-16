// Internal dependencies
import { CourseHelper } from '$scripts/helpers';
import { validSerializedCourse } from '$scripts/types';

// Exports
export { POST, PUT };

// --------------------> API Endpoints

async function POST({ request }) {
	// Retrieve course code and name
	const { code, name, program_id } = await request.json();
	if (!code || !name) return new Response('Missing code or name', { status: 400 });

	// Create course
	return await CourseHelper.create(code, name, program_id).then(
		(data) => new Response(JSON.stringify(data), { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}

async function PUT({ request }) {
	// Retrieve data
	const data = await request.json();
	if (!validSerializedCourse(data)) {
		return new Response('Invalid SerializedCourse', { status: 400 });
	}

	// Update course
	return await CourseHelper.update(data).then(
		() => new Response(null, { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}
