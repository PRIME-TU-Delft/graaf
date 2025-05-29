import prisma from '$lib/server/db/prisma';
import { GraphValidator } from '$lib/validators/graphValidator';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	if (!params.graphid) {
		error(400, { message: 'Graph ID is required' });
	}

	const graphId = parseInt(params.graphid);
	// Check if graphId is not NaN
	if (isNaN(graphId)) {
		error(400, { message: 'Graph id must be a number' });
	}

	try {
		const graph = await prisma.graph.findFirst({
			where: {
				id: graphId
			},
			include: {
				domains: {
					include: {
						sourceDomains: true,
						targetDomains: true
					},
					orderBy: {
						order: 'asc'
					}
				},
				subjects: {
					include: {
						sourceSubjects: true,
						targetSubjects: true,
						domain: true
					},
					orderBy: {
						order: 'asc'
					}
				},
				lectures: {
					include: {
						subjects: true
					},
					orderBy: {
						order: 'asc'
					}
				}
			}
		});

		if (!graph) error(404, { message: 'Graph not found' });

		const graphValidator = new GraphValidator(graph);
		const issues = graphValidator.validate();

		// Happy path
		return {
			graph: graph,
			issues: issues
		};
	} catch (e: unknown) {
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}
};
