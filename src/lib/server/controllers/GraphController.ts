import { error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

import { GraphHelper } from '$lib/server/helpers';
import { type SerializedGraph } from '$scripts/entities';


export async function getGraphsByCourseCode(code: string) {
	const graphs = await prisma.graph.findMany({
		where: {
			course: {
				code
			}
		}
	});
	return await Promise.all(graphs.map(g => GraphHelper.toDTO(g)));
}


export async function getGraphById(id: number): Promise<SerializedGraph> {
	const graph = await prisma.graph.findUnique({
		where: {
			id
		}
	});

	if (!graph) error(404, 'Graph not found');

	return await GraphHelper.toDTO(graph);
}
