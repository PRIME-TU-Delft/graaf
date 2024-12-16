// Internal dependencies
import { DomainHelper } from '$scripts/helpers';
import { validSerializedDomain } from '$scripts/types';

// Exports
export { POST, PUT };

// --------------------> API Endpoints

async function POST({ request }) {
	// Retrieve graph ID and order
	const { graph_id, order } = await request.json();
	if (isNaN(graph_id)) return new Response('Missing graph ID', { status: 400 });
	if (isNaN(order)) return new Response('Missing order', { status: 400 });

	// Create graph
	return await DomainHelper.create(graph_id, order).then(
		(data) => new Response(JSON.stringify(data), { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}

async function PUT({ request }) {
	// Retrieve data
	const data = await request.json();
	if (!validSerializedDomain(data)) {
		return new Response('Invalid SerializedDomain', { status: 400 });
	}

	// Update domain
	return await DomainHelper.update(data).then(
		() => new Response(null, { status: 200 }),
		(error) => new Response(error, { status: 400 })
	);
}
