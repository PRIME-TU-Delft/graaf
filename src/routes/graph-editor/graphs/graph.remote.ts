import { command, getRequestEvent, query } from '$app/server';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { svelteError } from '$lib/utils/setError';
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

const changePositionSchema = v.object({
	graphId: v.number(),
	domains: v.array(
		v.object({
			domainId: v.number(),
			x: v.number(),
			y: v.number()
		})
	),
	subjects: v.array(
		v.object({
			subjectId: v.number(),
			x: v.number(),
			y: v.number()
		})
	)
});

export const changePosition = command(
	changePositionSchema,
	async ({ graphId, domains, subjects }) => {
		const user = await getUser(getRequestEvent());

		try {
			return await prisma.graph.update({
				where: {
					id: graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					domains: {
						updateMany: domains.map((domain) => ({
							where: { id: domain.domainId },
							data: { x: domain.x, y: domain.y }
						}))
					},
					subjects: {
						updateMany: subjects.map((subject) => ({
							where: { id: subject.subjectId },
							data: { x: subject.x, y: subject.y }
						}))
					}
				}
			});
		} catch (e: unknown) {
			return svelteError(e);
		}
	}
);
