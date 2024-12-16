// Internal dependencies
import { GraphHelper } from '$scripts/helpers';

// Exports
export { PUT };

// --------------------> API Endpoints

async function PUT({ request }) {
	// Retrieve data
	const { lecture_ids } = await request.json();
	if (!lecture_ids) {
		return new Response('Missing data', { status: 400 });
	}

	// Reorder data
	return await GraphHelper.reorderLectures(lecture_ids).then(
		() => new Response(null, { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}
