import prisma from '$lib/server/prisma';

import { GraphHelper } from '$lib/server/helpers';


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
