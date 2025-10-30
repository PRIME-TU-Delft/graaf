import { query } from '$app/server';
import prisma from '$lib/server/db/prisma';
import { GraphValidator } from '$lib/validators/graphValidator';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

export const getGraph = query(v.number(), async (graphId) => {
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
});
