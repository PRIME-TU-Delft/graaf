// Internal dependencies
import { LinkHelper } from '$scripts/helpers';

// Exports
export { DELETE };

// --------------------> API Endpoints

async function DELETE({ params }) {
	// Retrieve data
	const link_id = Number(params.id);
	if (isNaN(link_id)) {
		return new Response('Missing link ID', { status: 400 });
	}

	// Delete the Link
	return await LinkHelper.remove(link_id).then(
		() => new Response(null, { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}
