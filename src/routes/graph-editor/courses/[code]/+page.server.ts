import { GraphActions } from '$lib/server/actions/Graphs.js';
import { getUser } from '$lib/server/actions/Users.js';
import prisma from '$lib/server/db/prisma';
import type { OrError } from '$lib/utils.js';
import { graphSchema, graphSchemaWithId } from '$lib/zod/graphSchema.js';
import type { Course, Graph } from '@prisma/client';
import { type ServerLoad } from '@sveltejs/kit';
import { superValidate, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = (async ({ params, locals }) => {
	const result = {
		course: undefined,
		graphForm: await superValidate(zod(graphSchema)),
		error: ''
	} as OrError<{
		course: Course;
		graphForm: SuperValidated<Infer<typeof graphSchema>>;
		graphs: Graph[];
	}>;

	if (!params.code) {
		result.error = 'Course code is required';
		return result;
	}

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

		if (!dbCourse) {
			result.error = 'Course not found';
			return result;
		}

		// Happy path
		return {
			error: undefined,
			graphSchema: await superValidate(zod(graphSchema)),
			course: dbCourse,
			graphs: dbCourse.graphs,
			user
		};
	} catch (e: unknown) {
		result.error = e instanceof Error ? e.message : `${e}`;
		return result;
	}
}) satisfies ServerLoad;

export const actions = {
	'add-graph-to-course': async (event) => {
		const form = await superValidate(event, zod(graphSchema));

		return GraphActions.addGraphToCourse(await getUser(event), form);
	},
	'delete-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));

		return GraphActions.deleteGraphFromCourse(await getUser(event), form);
	}
};
