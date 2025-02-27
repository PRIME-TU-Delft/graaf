import { GraphActions } from '$lib/server/actions/Graphs.js';
import { getUser } from '$lib/server/actions/Users.js';
import prisma from '$lib/server/db/prisma';
import { graphSchema, graphSchemaWithId } from '$lib/zod/graphSchema.js';
import { redirect, type ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = (async ({ params, locals }) => {
	if (!params.code) redirect(303, '/');

	const user = await getUser({ locals });

	try {
		const dbCourse = await prisma.course.findFirst({
			where: {
				code: params.code
			},
			include: {
				graphs: {
					include: {
						_count: {
							select: {
								domains: true,
								subjects: true
							}
						}
					}
				},
				admins: { select: { id: true } },
				editors: { select: { id: true } },
				programs: {
					include: {
						admins: { select: { id: true } },
						editors: { select: { id: true } }
					}
				}
			}
		});

		if (!dbCourse) throw new Error('Course not found, or you do not have access to it');

		// Happy path
		return {
			error: undefined,
			graphSchema: await superValidate(zod(graphSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			course: dbCourse,
			graphs: dbCourse.graphs,
			user
		};
	} catch (e: unknown) {
		return {
			error: e instanceof Error ? e.message : `${e}`,
			graphSchema: await superValidate(zod(graphSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			course: [],
			graphs: [],
			user
		};
	}
}) satisfies ServerLoad;

export const actions = {
	'add-graph-to-course': async (event) => {
		const form = await superValidate(event, zod(graphSchema));

		return GraphActions.addGraphToCourse(await getUser(event), form);
	},
	'edit-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));

		return GraphActions.editGraph(await getUser(event), form);
	},
	'delete-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));

		return GraphActions.deleteGraphFromCourse(await getUser(event), form);
	}
};
