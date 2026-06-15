import prisma from '$lib/server/db/prisma';
import { GraphValidator } from '$lib/validators/graphValidator';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, depends }) => {
	depends('app:graph');
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

		// Fetch subjectOrder via raw SQL — Prisma client may not include this column
		// if prisma generate hasn't run since the schema migration that added it.
		type OrderRow = { id: number; subjectOrder: string };
		const orderRows = await prisma.$queryRaw<OrderRow[]>`
			SELECT id, "subjectOrder" FROM "Lecture" WHERE "graphId" = ${graphId}
		`;
		const orderMap = new Map(orderRows.map((r) => [r.id, r.subjectOrder]));

		// Sort subjects within each lecture by subjectOrder (persisted ordering)
		for (const lecture of graph.lectures) {
			const orderJson = orderMap.get(lecture.id) ?? '[]';
			const order: number[] = JSON.parse(orderJson);
			if (order.length > 0) {
				lecture.subjects.sort((a, b) => {
					const ai = order.indexOf(a.id);
					const bi = order.indexOf(b.id);
					// Subjects not in the order array go to the end
					return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
				});
			}
		}

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
