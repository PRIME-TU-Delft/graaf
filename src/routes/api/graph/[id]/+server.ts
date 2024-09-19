import { json, error } from '@sveltejs/kit';

import { GraphHelper } from '$lib/server/helpers';
import { getGraphById } from '$lib/server/controllers/GraphController';
import { type SerializedGraph } from '$scripts/entities';


/**
 * Fetches a graph by its ID and returns it as a DTO
 */
export async function GET({ params }): Promise<Response> {
	const id = Number(params.id);
	const graph = await getGraphById(id);
	return json(graph);
}


/**
 * Updates a graph from a DTO
 */
export async function PUT({ request, params }): Promise<Response> {
	const id = Number(params.id);
	const dto: SerializedGraph = await request.json();

	if (id !== dto.id) error(400, 'ID mismatch');

	await GraphHelper.updateFromDTO(dto);
	return new Response(null, { status: 201 });
}
