// Internal dependencies
import { GraphHelper } from '$scripts/helpers';

// Exports
export { PUT };

// --------------------> API Endpoints

async function PUT({ request }) {
	// Retrieve data
	const { domain_ids } = await request.json();
	if (!domain_ids) {
		return new Response('Missing data', { status: 400 });
	}

	// Reorder data
	return await GraphHelper.reorderDomains(domain_ids).then(
		() => new Response(null, { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}
